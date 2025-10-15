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

    // Dibuja un punto en el canvas (siempre localmente)
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

    // Obtiene la posición del clic en el canvas
    var getMousePosition = function (evt) {
        var canvas = document.getElementById("canvas");
        var rect = canvas.getBoundingClientRect();
        return {
            x: evt.clientX - rect.left,
            y: evt.clientY - rect.top
        };
    };

    // Hace la suscripción a /topic/newpoint.{id}
    var doSubscribe = function (id) {
        // cancelar suscripción anterior si existe
        try {
            if (currentSubscription && typeof currentSubscription.unsubscribe === 'function') {
                currentSubscription.unsubscribe();
                console.log("Suscripción anterior cancelada.");
            }
        } catch (e) {
            console.warn("Error cancelando suscripción previa:", e);
        }

        // subscribirse y guardar el objeto de suscripción
        currentSubscription = stompClient.subscribe("/topic/newpoint." + id, function (message) {
            try {
                var payload = message.body;
                var theObject = (typeof payload === "string") ? JSON.parse(payload) : payload;
                addPointToCanvas(new Point(theObject.x, theObject.y));
                console.log("Punto recibido y dibujado desde topic:", theObject);
            } catch (err) {
                console.error("Error procesando mensaje recibido:", err, message);
            }
        });

        console.log("Suscrito a /topic/newpoint." + id);
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

