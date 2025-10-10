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

    var connectAndSubscribe = function () {
        console.info('Connecting to WS...');
        var socket = new SockJS('/stompendpoint');
        stompClient = Stomp.over(socket);

        // Subscribe to topic when connection succeeds
        stompClient.connect({}, function (frame) {
            console.log('Connected: ' + frame);

            // Suscribirse al tópico de puntos nuevos
            stompClient.subscribe('/topic/newpoint', function (eventbody) {
                var newPoint = JSON.parse(eventbody.body);
                addPointToCanvas(newPoint);
            });
        });
    };

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
            stompClient.send("/topic/newpoint", {}, JSON.stringify(pt));
        },

        disconnect: function () {
            if (stompClient !== null) {
                stompClient.disconnect();
            }
            console.log("Disconnected");
        }
    };

})();
