const redisClient = require("../config/redis");

const redisCache = (keyGenerator) => {
  return async (req, res, next) => {
    try {
      const cacheKey = keyGenerator(req);

      const cachedData = await redisClient.get(cacheKey);

      if (cachedData) {
        console.log("⚡ Data from Redis:", cacheKey);
        return res.status(200).json(JSON.parse(cachedData));
      }

      // pass key to controller
      req.cacheKey = cacheKey;

      next();
    } catch (error) {
      console.log("Redis middleware error:", error);
      next();
    }
  };
};

module.exports = redisCache;
