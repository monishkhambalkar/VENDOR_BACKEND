const WebSocket = require("ws");

const initializeWebSocket = (server) => {
  const wss = new WebSocket.Server({ server });
  const users = new Map();

  console.log("✅ WebSocket server initialized on port 5514");

  wss.on("connection", (ws) => {
    console.log("🔗 New WebSocket client connected");

    ws.on("message", (message) => {
      try {
        console.log("📩 Received:", message);

        // Parse JSON message
        const data = JSON.parse(message);

        if (data.type === "register") {
          users.set(data.userId, ws); // Store user socket
          console.log(`👤 User ${data.userId} registered`);
          return;
        }

        if (!data.message) {
          console.error("⚠️ Error: Empty message payload");
          return;
        }

        if (data.type === "message") {
          console.log(
            `📩 Message from ${data.sender} to ${data.receiver}: ${data.message}`
          );

          const recipientSocket = users.get(data.receiver);
          if (
            recipientSocket &&
            recipientSocket.readyState === WebSocket.OPEN
          ) {
            recipientSocket.send(JSON.stringify(data)); // Send message to receiver
          }
        }

        // Broadcast the message to all connected clients
        wss.clients.forEach((client) => {
          if (client.readyState === WebSocket.OPEN) {
            client.send(
              JSON.stringify({
                sender: data.sender || "Anonymous",
                message: data.message,
              })
            );
          }
        });
      } catch (error) {
        console.error("❌ Error processing message:", error);
      }
    });

    ws.on("close", () => {
      console.log("❌ Client disconnected");
    });
  });
};

module.exports = initializeWebSocket;
