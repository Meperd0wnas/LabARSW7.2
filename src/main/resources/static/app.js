var app = (function () {

    class Point {
        constructor(x, y) {
            this.x = x;
            this.y = y;
        }
    }

    var stompClient = null;

    var addPointToCanvas = function (point) {
        var canvas = document.getElementById("canvas");
        var ctx = canvas.getContext("2d");
        ctx.beginPath();
        ctx.arc(point.x, point.y, 3, 0, 2 * Math.PI);
        ctx.stroke();
    };

    var getMousePosition = function (evt) {
        var canvas = document.getElementById("canvas");
        var rect = canvas.getBoundingClientRect();
        return {
            x: evt.clientX - rect.left,
            y: evt.clientY - rect.top
        };
    };

    function connectAndSubscribe() {
        console.log("Connecting to WebSocket...");
        
        // Crear la conexión con el servidor STOMP
        var socket = new SockJS('/stompendpoint');
        stompClient = Stomp.over(socket);

        stompClient.connect({}, function (frame) {
            console.log("Connected: " + frame);

            // Suscribirse al tópico "/topic/newpoint"
            var id = document.getElementById("drawId").value || 1;
            stompClient.subscribe("/topic/newpoint." + id, function (message) {

                // Extraer el cuerpo del mensaje
                var theObject = JSON.parse(message.body);

                // Obtener coordenadas X e Y
                var x = theObject.x;
                var y = theObject.y;

                // Dibujar el punto recibido en el canvas
                addPointToCanvas(new Point(x, y));

            });
        });
    }


    return {

        init: function () {
            var can = document.getElementById("canvas");

            // evento de clic para dibujar y enviar el punto
            can.addEventListener("click", function (evt) {
                var mousePos = getMousePosition(evt);
                app.publishPoint(mousePos.x, mousePos.y);
            });

            // conexión WebSocket
            connectAndSubscribe();
        },

        publishPoint: function (px, py) {
            var pt = new Point(px, py);
            console.info("Publishing point at " + JSON.stringify(pt));

            // Dibujar localmente
            addPointToCanvas(pt);

            // Enviar al servidor mediante STOMP
            var id = document.getElementById("drawId").value || 1;
            stompClient.send("/topic/newpoint." + id, {}, JSON.stringify(pt));

        },

        disconnect: function () {
            if (stompClient !== null) {
                stompClient.disconnect();
            }
            console.log("Disconnected");
        }
    };

})();
