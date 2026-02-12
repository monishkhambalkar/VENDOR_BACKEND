const mongoose = require("mongoose");

const config = require("./config");

const connectDB = async () => {
  mongoose
    .connect(config.databaseUrl)
    .then(() => {
      console.log("mongodb is connected");
    })
    .catch((error) => {
      console.log(error.message);
    });

  mongoose.connection.on("connected", () => {
    console.log("Mongoose connected on DB");
  });

  mongoose.connection.on("error", (err) => {
    console.log(err.message);
  });

  mongoose.connection.on("disconnected", (err) => {
    console.log("mongoose connection is disconnected");
  });

  process.on("SIGINT", () => {
    mongoose.connection.close(() => {
      console.log("Mongoose connection is disconnected due to app termination");
    });
    process.exit(0);
  });
};

module.exports = connectDB;
