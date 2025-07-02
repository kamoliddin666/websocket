import { WebSocketServer } from "ws";

const server = new WebSocketServer({ port: 8080 ,maxPayload: 1024 * 1024 * 100});
const clients = new Map();
const usernames = new Set();

server.on("connection", (ws) => {
  ws.on("message", (data) => {
    let msg;
    try {
      msg = JSON.parse(data);
    } catch (err) {
      return;
    }
    if (file.size > 100 * 1024 * 1024) {
        alert("100MB dan katta fayl yuborib bo'lmaydi.");
        return;
        }       
    if (msg.type === "register") {
      if (usernames.has(msg.username)) {
        ws.send(JSON.stringify({ type: "reject", reason: "Ism band" }));
        return;
      }

      clients.set(ws, msg.username);
      usernames.add(msg.username);
      ws.send(JSON.stringify({ type: "accept", message: "Ism qabul qilindi" }));
      return;
    }

    const username = clients.get(ws);
    if (!username) return;
    msg.username = username;

    if (msg.type === "scheduled") {
      const sendAt = new Date(msg.sendAt);
      const delay = sendAt - new Date();
      if (delay < 0) return;

      const delayed = {
        type: "message",
        text: msg.text,
        username,
      };

      setTimeout(() => {
        const json = JSON.stringify(delayed);
        for (const [client] of clients) {
          if (client.readyState === WebSocket.OPEN) {
            client.send(json);
          }
        }
      }, delay);
      return;
    }

    if (msg.type === "voice") {
      const json = JSON.stringify(msg);
      for (const [client] of clients) {
        if (client.readyState === WebSocket.OPEN) {
          client.send(json);
        }
      }
      return;
    }

    if (msg.type === "file") {
      const json = JSON.stringify(msg);
      for (const [client] of clients) {
        if (client.readyState === WebSocket.OPEN) {
          client.send(json);
        }
      }
      return;
    }

    if (msg.type === "typing") {
      const json = JSON.stringify(msg);
      for (const [client] of clients) {
        if (client !== ws && client.readyState === WebSocket.OPEN) {
          client.send(json);
        }
      }
      return;
    }
    if (msg.type === "message") {
      const json = JSON.stringify(msg);
      for (const [client] of clients) {
        if (client.readyState === WebSocket.OPEN) {
          client.send(json);
        }
      }
    }
  });

  ws.on("close", () => {
    const name = clients.get(ws);
    if (name) usernames.delete(name);
    clients.delete(ws);
  });
});

console.log("Server ishlayapti: ws://localhost:8080");