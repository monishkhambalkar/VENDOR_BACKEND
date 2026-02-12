const express = require("express");
const { NextFunction, Request, Response } = require("express");
const config = require("../config/config");
const createHttpError = require("http-errors");

// Global Error Handler
const globalErrorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;

  return res.status(statusCode).json({
    message: err.message,
    errorStack: config.env === "development" ? err.stack : "",
  });
};

module.exports = globalErrorHandler;
