## Lab ARSW7 Parte 2

## Daniel Ricardo Ruge Gomez

### Laboratorio - Broker de Mensajes STOMP con WebSockets + HTML5 Canvas.

### Parte I.

#### 1.

Se completó el cliente JavaScript para que, además de dibujar los puntos localmente, los publique en el tópico /topic/newpoint mediante stompClient.send, y se agregó la suscripción al mismo canal para que cada cliente reciba y dibuje en tiempo real los puntos enviados por otros usuarios, logrando así la funcionalidad colaborativa del lienzo.

![alt text](./img/image.png)

![alt text](./img/image2.png)

![alt text](./img/image3.png)

#### 2.

 modifique la función de conexión al WebSocket para que la aplicación se suscriba al tópico /topic/newpoint en lugar de /TOPICOXX. Además, se agregó un callback que, al recibir un mensaje, convierte su contenido (message.body) en un objeto JSON mediante JSON.parse, extrae las coordenadas X y Y, y muestra un mensaje de alerta con estos valores.

![alt text](./img/image4.png)


#### 3 , 4 y 5


compile, ejecute y probe la aplicación en varias pestañas de navegadores diferentes y pude ver que en todas la pestañas se lanzo la alerta con los datos ingresados.

![alt text](./img/image5.png)