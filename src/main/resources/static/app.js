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
        console.log("Connecting to WebSocket...");

        var socket = new SockJS('/stompendpoint');
        stompClient = Stomp.over(socket);

        stompClient.connect({}, function (frame) {
            console.log("Connected: " + frame);

            var id = document.getElementById("drawId").value || 1;
            stompClient.subscribe("/topic/newpoint." + id, function (message) {
                var theObject = JSON.parse(message.body);
                addPointToCanvas(new Point(theObject.x, theObject.y));
            });

            alert("Conectado al dibujo #" + id);
        });
    };

    return {

        init: function () {
            var can = document.getElementById("canvas");

            can.addEventListener("click", function (evt) {
                var mousePos = getMousePosition(evt);
                app.publishPoint(mousePos.x, mousePos.y);
            });

            console.log("Canvas listo. Esperando conexión...");
        },

        connect: function () {
            connectAndSubscribe();
        },

        publishPoint: function (px, py) {
            var pt = new Point(px, py);
            console.info("Publishing point at " + JSON.stringify(pt));
            addPointToCanvas(pt);

            if (stompClient && stompClient.connected) {
                var id = document.getElementById("drawId").value || 1;
                stompClient.send("/topic/newpoint." + id, {}, JSON.stringify(pt));
            } else {
                console.warn("No hay conexión activa.");
            }
        },

        disconnect: function () {
            if (stompClient !== null) {
                stompClient.disconnect();
            }
            console.log("Disconnected");
        }
    };

})();
