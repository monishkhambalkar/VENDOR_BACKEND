const express = require("express");

const userController = ({
  registerUser,
  loginUser,
  logoutUser,
  refreshToken,
} = require("../controllers/user"));

const router = express.Router();

router.post("/register", userController.registerUser);

router.post("/login", userController.loginUser);

router.post("/logout", userController.logoutUser);

router.post("/token", userController.refreshToken);

module.exports = router;
