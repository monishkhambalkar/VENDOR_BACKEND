// const errorLogger = require("../utils/errorLogger");
// const express = require("express");
// const { NextFunction, Request, Response } = require("express");
// const config = require("../config/config");
// const createHttpError = require("http-errors");

// // GLOBAL ERROR HANDLER
// const globalErrorHandler = (err, req, res, next) => {

//   errorLogger(err);

//   // 👇 PRINT ERROR IN TERMINAL (file + line number)
//   console.error("🔥 ERROR STACK:\n", err.stack);

//   const statusCode = err.statusCode || err.status || 500;

//   res.status(statusCode).json({
//     success: false,
//     message: err.message || "Internal Server Error",
//     stack: config.env === "development" ? err.stack : undefined,
//   });
// };

// module.exports = globalErrorHandler;



const config = require("../config/config");
const errorLogger = require("../utils/errorLogger");

const globalErrorHandler = (err, req, res, next) => {

  console.error("🔥 ERROR STACK:\n", err.stack);

  errorLogger(err); // <-- LOG TO FILE

  const statusCode = err.statusCode || err.status || 500;

  res.status(statusCode).json({
    success: false,
    message: err.message || "Internal Server Error",
    stack: config.env === "development" ? err.stack : undefined,
  });
};

module.exports = globalErrorHandler;
