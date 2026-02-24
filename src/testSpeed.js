const redisClient = require("./config/redis");
const productModel = require("./models/products");

(async () => {

  console.time("MongoDB");
  await productModel.find().limit(10);
  console.timeEnd("MongoDB");

  console.time("Redis");
  await redisClient.get("products:test");
  console.timeEnd("Redis");

})();