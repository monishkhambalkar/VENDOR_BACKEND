const http = require("http");
const config = require("./src/config/config");
const connectDB = require("./src/config/db");
const app = require("./app");
const initializeWebSocket = require("./src/chatApp/chatServer");
const mongoose = require("mongoose");

const startServer = async () => {
  try {
    // Connect to Database
    await connectDB();

    // Define Port
    const port = config.port || 3000;

    // Create HTTP Server
    const server = http.createServer(app);

    // Initialize WebSocket Server
    initializeWebSocket(server);

    // Start Server
    server.listen(port, () => {
      console.log(`✅ Server running at http://localhost:${port}`);
    });

    process.on("uncaughtException", (err) => {
      console.error("UNCAUGHT EXCEPTION:", err);
    });

    process.on("unhandledRejection", (err) => {
      console.error("UNHANDLED REJECTION:", err);
    });

    // Graceful Shutdown
    process.on("SIGINT", async () => {
      console.log("🔻 Shutting down gracefully...");
      await mongoose.connection.close();
      server.close(() => {
        console.log("✅ Server closed");
        process.exit(0);
      });
    });
  } catch (error) {
    console.error("❌ Server startup failed:", error);
    process.exit(1);
  }
};

// Start the Server
startServer();
