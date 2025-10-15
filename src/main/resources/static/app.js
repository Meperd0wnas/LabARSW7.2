var app = (function () {

    class Point {
        constructor(x, y) {
            this.x = Number(x);
            this.y = Number(y);
        }
    }

    var stompClient = null;
    var isConnected = false;
    var currentSubscription = null;

    // Dibuja un punto en el canvas 
    var addPointToCanvas = function (point) {
        var canvas = document.getElementById("canvas");
        if (!canvas) {
            console.warn("Canvas no encontrado");
            return;
        }
        var ctx = canvas.getContext("2d");
        ctx.beginPath();
        ctx.arc(point.x, point.y, 3, 0, 2 * Math.PI);
        ctx.fill(); // rellena para que se vea mejor
        ctx.closePath();
    };
    

    var drawPolygon = function(points) {
        var canvas = document.getElementById("canvas");
        if (!canvas) { console.warn("Canvas no encontrado"); return; }
        var ctx = canvas.getContext("2d");

        // Normalizar: asegurarnos que points es un array de {x,y}
        var pts = points;
        if (!Array.isArray(pts)) {
            console.warn("drawPolygon: formato inesperado:", points);
            return;
        }
        if (pts.length < 3) {
            console.warn("drawPolygon: menos de 3 puntos:", pts.length);
            return;
        }

        ctx.beginPath();
        ctx.moveTo(Number(pts[0].x), Number(pts[0].y));
        for (var i = 1; i < pts.length; i++) {
            ctx.lineTo(Number(pts[i].x), Number(pts[i].y));
        }
        ctx.closePath();

        // Estilos
        ctx.fillStyle = 'rgba(0,150,255,0.25)';
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.strokeStyle = 'rgba(0,150,255,0.9)';
        ctx.stroke();

        console.log("Polígono dibujado con", pts.length, "puntos.");
    };




    // Obtiene la posición del clic en el canvas
    var getMousePosition = function (evt) {
        var canvas = document.getElementById("canvas");
        var rect = canvas.getBoundingClientRect();
        return {
            x: evt.clientX - rect.left,
            y: evt.clientY - rect.top
        };
    };

    var doSubscribe = function (id) {
    if (!stompClient) {
        console.warn("stompClient no inicializado, no puedo subscribir.");
        return;
    }

    // cancelar subs previas si existen
    try {
        if (currentSubscription) {
            if (currentSubscription.points && typeof currentSubscription.points.unsubscribe === 'function') {
                currentSubscription.points.unsubscribe();
            }
            if (currentSubscription.polygon && typeof currentSubscription.polygon.unsubscribe === 'function') {
                currentSubscription.polygon.unsubscribe();
            }
        }
    } catch (e) {
        console.warn("Error cancelando subs previas:", e);
    }

    console.log("Creando subs para id =", id);

    // subs a puntos individuales
    var pointsSub = stompClient.subscribe("/topic/newpoints." + id, function (message) {
        console.log("Callback /topic/newpoints." + id + " - message:", message);
        try {
            var payload = message.body;
            var obj = (typeof payload === "string") ? JSON.parse(payload) : payload;
            console.log("Punto recibido en /topic/newpoints." + id + " ->", obj);
            if (obj && typeof obj.x !== 'undefined' && typeof obj.y !== 'undefined') {
                addPointToCanvas(new Point(obj.x, obj.y));
            } else {
                console.warn("Payload de punto con formato inesperado:", obj);
            }
        } catch (err) {
            console.error("Error parseando mensaje de puntos:", err, message);
        }
    });

    // subs a polígonos 
    var polygonSub = stompClient.subscribe("/topic/newpolygon." + id, function (message) {
        console.log("Callback /topic/newpolygon." + id + " - message:", message);
        try {
            var payload = message.body;
            var obj = (typeof payload === "string") ? JSON.parse(payload) : payload;
            console.log("Polígono recibido en /topic/newpolygon." + id + " ->", obj);
            // Manejar distintos formatos:
            var pts = null;
            if (obj) {
                if (Array.isArray(obj)) pts = obj;
                else if (Array.isArray(obj.points)) pts = obj.points;
                else if (Array.isArray(obj.pointsArray)) pts = obj.pointsArray; 
            }
            if (pts && pts.length >= 3) {
                drawPolygon(pts);
            } else {
                console.warn("Formato o número de puntos inválido para polígono:", obj);
            }
        } catch (err) {
            console.error("Error parseando mensaje de polígonos:", err, message);
        }
    });

    // guardar referencias para cancelación
    currentSubscription = { points: pointsSub, polygon: polygonSub };

    console.log("Suscrito a /topic/newpoints." + id + " (id subs: " + (pointsSub && pointsSub.id) + ")");
    console.log("Suscrito a /topic/newpolygon." + id + " (id subs: " + (polygonSub && polygonSub.id) + ")");
};


    // Conecta a STOMP/SockJS y se suscribe al topic indicado
    var connectAndSubscribe = function () {
        var idEl = document.getElementById("drawId");
        var id = (idEl && idEl.value) ? idEl.value.trim() : "";
        if (!id) {
            alert("Ingrese un ID de dibujo antes de conectar.");
            return;
        }

        console.log("Intentando conectar al WS para dibujo id =", id);

        try {
            var socket = new SockJS('/stompendpoint');
            stompClient = Stomp.over(socket);

            // opcional: quitar logs muy verbosos del stomp (si la librería tiene debug)
            if (stompClient.debug) stompClient.debug = null;

            stompClient.connect({}, function (frame) {
                isConnected = true;
                console.log("Conectado a STOMP, frame:", frame);
                doSubscribe(id);
                // opcional: deshabilitar el botón conectar (si quieres)
                // document.querySelector("button[onclick='app.connect()']").disabled = true;
            }, function (error) {
                isConnected = false;
                console.error("Error en conexión STOMP:", error);
                alert("No se pudo conectar al servidor WebSocket. Revisa la consola del navegador y del servidor.");
            });
        } catch (e) {
            console.error("Excepción al conectar:", e);
            alert("Error al iniciar la conexión: " + e);
        }
    };

    return {

        // Inicializa manejadores (se llama desde onload o body)
        init: function () {
            var can = document.getElementById("canvas");
            if (!can) {
                console.error("No se encontró el canvas con id 'canvas'");
                return;
            }

            // Dibuja localmente y envía si está conectado
            can.addEventListener("click", function (evt) {
                var mousePos = getMousePosition(evt);
                // dibujar localmente siempre
                addPointToCanvas(new Point(mousePos.x, mousePos.y));
                // y enviar si está conectado
                if (isConnected && stompClient) {
                    app.publishPoint(mousePos.x, mousePos.y);
                } else {
                    console.log("Punto dibujado localmente (aún no conectado). Presiona 'Conectarse' para enviar al servidor.");
                }
            });

            console.log("init() completado: eventos de canvas registrados.");
        },

        // Método llamado por el botón "Conectarse"
        connect: function () {
            if (isConnected) {
                console.log("Ya conectado.");
                return;
            }
            connectAndSubscribe();
        },

        // Envía punto al server (/app/newpoint.{id})
        publishPoint: function (px, py) {
            var idEl = document.getElementById("drawId");
            var id = (idEl && idEl.value) ? idEl.value.trim() : "";
            if (!id) {
                console.warn("No se puede publicar: ID del dibujo vacío.");
                return;
            }
            var pt = new Point(px, py);
            console.info("Enviando punto al servidor:", pt);

            if (isConnected && stompClient) {
                try {
                    stompClient.send("/app/newpoint." + id, {}, JSON.stringify(pt));
                    console.log("Punto enviado a /app/newpoint." + id);
                } catch (e) {
                    console.error("Error enviando punto:", e);
                }
            } else {
                console.warn("No conectado: el punto fue dibujado localmente pero no enviado.");
            }
        },

        // Desconexión limpia
        disconnect: function () {
            if (stompClient) {
                try {
                    if (currentSubscription && typeof currentSubscription.unsubscribe === 'function') {
                        currentSubscription.unsubscribe();
                    }
                    stompClient.disconnect();
                } catch (e) {
                    console.warn("Error durante desconexión:", e);
                }
            }
            stompClient = null;
            isConnected = false;
            console.log("Desconectado.");
        }
    };

})();

// --- Inicializar la app cuando el DOM esté listo ---
(function initOnReady(){
    function safeInit(){
        try {
            if (app && typeof app.init === 'function') {
                app.init();
            } else {
                console.error('app.init no disponible');
            }
        } catch (e) {
            console.error('Error inicializando app:', e);
        }
    }

    if (document.readyState === 'complete' || document.readyState === 'interactive') {
        // DOM ya parseado
        safeInit();
    } else {
        // Esperar al DOMContentLoaded
        document.addEventListener('DOMContentLoaded', safeInit);
    }
})();

