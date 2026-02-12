// import { v2 as cloudinary } from "cloudinary";

const cloudinary = require("cloudinary");
const config = require("../config/config");

cloudinary.config({
  cloud_name: config.cloudinaryCloud,
  api_key: config.cloudinaryApiKey,
  api_secret: config.cloudinarySecret,
});

module.exports = cloudinary;
