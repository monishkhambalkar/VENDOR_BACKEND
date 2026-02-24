const redisClient = require("../config/redis");

const cacheInvalidator = (keyGenerator) => {
  return async (req, res, next) => {
    try {
      // run controller first
      const originalJson = res.json;

      res.json = async function (data) {
        try {
          const key = keyGenerator(req);

          if (key) {
            await redisClient.del(key);
            console.log("🔥 Cache cleared:", key);
          }
        } catch (err) {
          console.log("Cache clear error:", err);
        }

        return originalJson.call(this, data);
      };

      next();
    } catch (err) {
      next();
    }
  };
};

module.exports = cacheInvalidator;