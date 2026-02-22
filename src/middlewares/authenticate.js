const createHttpError = require("http-errors");
const { verify } = require("jsonwebtoken");
const config = require("../config/config");

const authenticate = (req, res, next) => {
  try {
    const authHeader = req.header("Authorization");

    // 1️⃣ check token exists
    if (!authHeader) {
      return next(createHttpError(401, "Authorization token is required"));
    }

    // 2️⃣ extract token (Bearer TOKEN)
    const parsedToken = authHeader.split(" ")[1];

    if (!parsedToken) {
      return next(createHttpError(401, "Invalid authorization format"));
    }

    // 3️⃣ verify JWT
    const decoded = verify(parsedToken, config.jwtSecret);

    // 4️⃣ attach user object (IMPORTANT ⭐)
    req.user = {
      id: decoded.sub,   // vendor/user id
    };

    next();

  } catch (error) {
    return next(createHttpError(401, "Token expired or invalid"));
  }
};

module.exports = authenticate;
