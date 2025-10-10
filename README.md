## Lab ARSW7 Parte 2

## Daniel Ricardo Ruge Gomez

### Laboratorio - Broker de Mensajes STOMP con WebSockets + HTML5 Canvas.

### Parte I.

#### 1.

Se completó el cliente JavaScript para que, además de dibujar los puntos localmente, los publique en el tópico /topic/newpoint mediante stompClient.send, y se agregó la suscripción al mismo canal para que cada cliente reciba y dibuje en tiempo real los puntos enviados por otros usuarios, logrando así la funcionalidad colaborativa del lienzo.

![alt text](./img/image.png)

![alt text](./img/image2.png)

![alt text](./img/image3.png)