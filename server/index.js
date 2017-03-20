'use strict';

const 
  http = require('http'),
  webSocketServer = require('websocket').server,
  port = /*process.env.PORT ||*/ 1337,
  server = http.createServer(),
  hex = [0,1,2,3,4,5,6,7,8,9,'a','b','c','d','e','f'],
  getColor = () => `#${
    Math.floor(Math.random()*16777215).toString(16)
  }`,
  htmlEntities = str => String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
class listNode {
  constructor(m) {
    this.message = m;
    this.next = null;
  }
}
class messageList {
  constructor (max = 100) {
    this.history = true;
    this.head = null;
    this.tail = null;
    this.maxLength = max;
    this.length = 0;
  }
  remove() {
    if(!this.head) return;
    if(this.head === this.tail) this.head = this.tail = null;
    else this.head = this.head.next;
    this.length--;
  }
  append(message) {
    if(!this.head) this.head = this.tail = new listNode(message);
    else {
      this.tail.next = new listNode(message);
      this.tail = this.tail.next;
    }
    if(++this.length > this.maxLength) this.remove();
  }
}
let
  history = new messageList(),
  clients = [];

process.title ='ChatSocket Server';

server.listen(port, () => {
  console.log(`${new Date()}: Server listening on port ${port}`);
});

const wsServer = new webSocketServer({
  httpServer: server
});

wsServer.on('request', req => {
  const connection = req.accept(null, req.origin);
  let 
    index = clients.push(connection) - 1,
    userName = false,
    userColor = false;

  console.log(`${new Date()}: Connection accepted.`);

  if(history.length) connection.sendUTF(JSON.stringify({
    type: 'history', data: history
  }));

  connection.on('message', message => {
    if(message.type === 'utf8') {
      if(userName === false) {
        userName = htmlEntities(message.utf8Data);
        userColor = getColor();
        connection.sendUTF(JSON.stringify({
          type:'color', data:userColor
        }));
        console.log(`${new Date()}: User ${userName} assigned color ${userColor}.`);
      } else {
        console.log(`${new Date()}: User ${userName} assigned color ${userColor}.`);
        const 
          obj = {
            time: (new Date()).getTime(),
            text: htmlEntities(message.utf8Data),
            author: userName,
            color: userColor
          },
          json = JSON.stringify({
            type: 'message', data: obj
          });
        history.append(obj);
        clients.forEach(client => client.sendUTF(json));
      }
    }
  });
  connection.on('close', connection => {
    if(userName !== false && userColor !== false) {
      console.log(`${new Date()}: Peer ${connection.remoteAddress} disconnected.`);
      clients.splice(index, 1);
    }
  });
})