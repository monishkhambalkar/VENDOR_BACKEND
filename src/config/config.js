const conf = require("dotenv");
// const cloudinary = require("./cloudinary");

if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

const config = {
  port: process.env.PORT || 3000,

  databaseUrl: process.env.MONGO_CONNECTION_STRING,

  env: process.env.NODE_ENV,

  jwtSecret: process.env.JWT_SECRETE,

  jwtExpire: process.env.JWT_EXP,

  refreshTokenSecret: process.env.JWT_REFRESH_TOKEN_SECREATE,

  refreshTokenExpire: process.env.JWT_REFRESH_TOKEN_EXP,

  cloudinaryCloud: process.env.CLOUDINARY_CLOUD,

  cloudinaryApiKey: process.env.CLOUDINARY_API_KEY,

  cloudinarySecret: process.env.CLOUDINARY_API_SECRET,
};

module.exports = config;
