package edu.eci.arsw.collabpaint.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import edu.eci.arsw.collabpaint.PolygonDto;
import edu.eci.arsw.collabpaint.model.Point;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Handler STOMP que reenvía puntos y arma polígonos cada 4 puntos.
 * Mantiene un buffer por numdibujo y protege accesos concurrentes.
 */
@Controller
public class STOMPMessagesHandler {

    @Autowired
    SimpMessagingTemplate msgt;

    // Buffer por dibujo: id -> lista de puntos recibidos
    private final ConcurrentHashMap<String, List<Point>> pointsBuffer = new ConcurrentHashMap<>();

    private static final int POLYGON_THRESHOLD = 4; //  4 puntos

    @MessageMapping("/newpoint.{numdibujo}")
    public void handlePointEvent(Point pt, @DestinationVariable String numdibujo) throws Exception {
        String now = Instant.now().toString();
        try {
            System.out.println("[" + now + "] Nuevo punto recibido - dibujo: " + numdibujo + " -> " + pt);

            // 1) Reenviar el punto individual
            msgt.convertAndSend("/topic/newpoints." + numdibujo, pt);
            System.out.println("[" + now + "] Punto reenviado a /topic/newpoints." + numdibujo);

            // 2) Guardar/controlar el punto en el buffer por dibujo (concurrencia controlada)
            List<Point> bufferForDrawing = pointsBuffer.computeIfAbsent(numdibujo, k -> new ArrayList<>());

            synchronized (bufferForDrawing) {
                bufferForDrawing.add(pt);
                // Si hay POLYGON_THRESHOLD o más puntos, publicar uno o más polígonos por lotes de POLYGON_THRESHOLD
                while (bufferForDrawing.size() >= POLYGON_THRESHOLD) {
                    // Tomar los primeros POLYGON_THRESHOLD puntos para formar el polígono
                    List<Point> polygonPoints = new ArrayList<>(bufferForDrawing.subList(0, POLYGON_THRESHOLD));
                    // Publicar el polígono en /topic/newpolygon.{numdibujo}
                    PolygonDto poly = new PolygonDto(polygonPoints, now);
                    msgt.convertAndSend("/topic/newpolygon." + numdibujo, poly);
                    System.out.println("[" + now + "] Polígono publicado a /topic/newpolygon." + numdibujo + " -> " + poly);

                    // Eliminar los primeros POLYGON_THRESHOLD puntos del buffer 
                    for (int i = 0; i < POLYGON_THRESHOLD; i++) {
                        bufferForDrawing.remove(0);
                    }
                }
            }
        } catch (Exception e) {
            System.err.println("[" + now + "] Error procesando punto para dibujo " + numdibujo);
            e.printStackTrace();
        }
    }
}