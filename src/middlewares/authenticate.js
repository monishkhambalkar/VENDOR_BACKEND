const { NextFunction, Request, Response } = require("express");
const createHttpError = require("http-errors");
const { verify } = require("jsonwebtoken");
const config = require("../config/config");

const authenticate = (req, res, next) => {
  const token = req.header("Authorization");

  if (!token) {
    return next(createHttpError(401, "Authorization token is required"));
  }

  try {
    const parsedToken = token.split(" ")[1];

    const decoded = verify(parsedToken, config.jwtSecret);

    req.userId = decoded.sub;

    next();
  } catch (error) {
    return next(createHttpError(401, "Token Expired"));
  }
};

module.exports = authenticate;
