'use strict'; 
const 
  DEFAULT_DEBOUNCE = 100,//ms
  qs = document.querySelector.bind(document);
function chatClient () {
  let
    content = qs('#content'),
    input = qs('#input'),
    status = qs('#status'),
    myColor = false,
    myName = false, 
    connection;
  function addMessage(messages) {
    const format = t => t < 10 ? '0' + t : t;
    let 
      list = messages.history ? 
        messages 
        : {
            head: {
              message: messages,
              next: null
            }
          },
      output = '', 
      current = list.head; 
    while(current) {
      let 
        msg = current.message,
        dt = new Date(msg.time),
        h = format(dt.getHours()),
        m = format(dt.getMinutes());
      output += `
        <p>
          <span style="color: ${msg.color}">${msg.author}</span> @[${h}:${m}]: ${msg.text}
        </p>
      `;
      current = current.next;
    }
    content.innerHTML = output + content.innerHTML; 
  }
  function debounce (func, wait = DEFAULT_DEBOUNCE) {
    let timeout, args, context, timestamp, result;
    const later = () => {
      let last = Date.now() - timestamp;
      if (last < wait && last >= 0) {
        timeout = setTimeout(later, wait - last);
      } else {
        timeout = null;
        result = func.apply(context, args);
        if (!timeout) context = args = null;
      }
    };
    return function() {
      context = this;
      args = arguments;
      timestamp = Date.now();
      let callNow = !timeout;
      if (!timeout) timeout = setTimeout(later, wait);
      else if (callNow) {
        result = func.apply(context, args);
        context = args = null;
      }
      return result;
    };
  };
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
  input.addEventListener('keydown', debounce(e => {
    if(e.key === 'Enter') {
      const msg = e.srcElement.value;
      if(!msg) return;
      connection.send(msg);
      input.value = '';
      input.disabled = 'disabled';
      if(myName === false) myName = msg;
    }
  }));
};

document.addEventListener('DOMContentLoaded', chatClient);