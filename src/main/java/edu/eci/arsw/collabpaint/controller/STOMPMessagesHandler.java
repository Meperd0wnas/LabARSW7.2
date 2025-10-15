package edu.eci.arsw.collabpaint.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;
import edu.eci.arsw.collabpaint.model.Point;

@Controller
public class STOMPMessagesHandler {

    @Autowired
    SimpMessagingTemplate msgt;

    /**
     * Maneja los mensajes enviados al destino /app/newpoint.{numdibujo}.
     * Recibe un punto, lo muestra por consola y lo reenvía al tópico
     * correspondiente para que todos los clientes suscritos lo vean.
     */
    @MessageMapping("/newpoint.{numdibujo}")
    public void handlePointEvent(Point pt, @DestinationVariable String numdibujo) throws Exception {
        System.out.println("Nuevo punto recibido en el servidor: " + pt);
        msgt.convertAndSend("/topic/newpoint." + numdibujo, pt);
    }
}
