const redis = require("redis");

const redisClient = redis.createClient({
  socket: {
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT,
  },
});

redisClient.on("connect", () => {
  console.log("✅ Redis Connected");
});

redisClient.on("error", (err) => {
  console.error("❌ Redis Connection Error:", err);
});

// connect redis
(async () => {
  try {
    await redisClient.connect();
  } catch (err) {
    console.error("Redis connect failed:", err);
  }
})();

module.exports = redisClient;
