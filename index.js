'use strict'; 
const qs = document.querySelector.bind(document);
function chatClient () {
  let
    content = qs('#content'),
    input = qs('#input'),
    status = qs('#status'),
    myColor = false,
    myName = false, 
    connection;
  function addMessage(messages) {
    if(!Array.isArray(messages))
      messages = [messages];
    const format = t => t < 10 ? '0' + t : t;
    content.innerHTML = messages
      .reduce((a,b) => {
        let 
          dt = new Date(b.time),
          h = format(dt.getHours()),
          m = format(dt.getMinutes());
        return a + `
          <p>
            <span style="color: ${b.color}">${b.author}</span> @[${h}:${m}]: ${b.text}
          </p>
        `;
      }, '') + content.innerHTML;
  }
  window.WebSocket = window.WebSocket || window.MozWebSocket;
  if(!window.WebSocket) {
    status.innerHTML = `Sorry, your browser doesn't support WebSockets. Cannot connect.`;
    input.hide();
    return;
  }
  (function connect() {
    connection = new WebSocket('ws://127.0.0.1:1337');
    connection.onopen = () => {
      input.removeAttribute('disabled');
      status.innerHTML = 'Choose name:';
    };
    connection.onclose = e => {
      status.innerHTML = `
        <span class="error">
          Unable to connect to server. Error ${e.code}: ${
            e.reason ? e.reason : 'reason unknown.'}
        </span>`;
      setTimeout(connect, 3000);
    }
    connection.onmessage = message => {
      let json;
      try {
        json = JSON.parse(message.data);
      } catch(e) {
        console.log(`JSON error: ${e}`);
        return;
      }
      if(json.type === 'color') {
        myColor = json.data;
        status.innerHTML = `<span style="color: ${myColor}>${myName}:</span> `;
        input.removeAttribute('disabled');
        input.focus();
      } else if (json.type === 'history') {
        addMessage(json.data);
      } else if (json.type === 'message') {
        input.removeAttribute('disabled');
        addMessage(json.data);
      } else {
        console.log(`Invalid JSON Input: ${json}`);
      }
      input.focus();
    };
  })();
  input.addEventListener('keydown', e => {
    if(e.key === 'Enter') {
      const msg = e.srcElement.value;
      if(!msg) return;
      connection.send(msg);
      input.value = '';
      input.disabled = 'disabled';
      if(myName === false) myName = msg;
    }
  });
};

document.addEventListener('DOMContentLoaded', chatClient);