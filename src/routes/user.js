const express = require("express");

const userController = ({
  registerUser,
  loginUser,
  logoutUser,
  refreshToken,
} = require("../controllers/user"));

const router = express.Router();

/**
 * @swagger
 * /admin/api/user/register:
 *   post:
 *     summary: Register a new user
 *     tags:
 *       - User
 *     responses:
 *       200:
 *         description: User registered successfully
 */
router.post("/register", userController.registerUser);

/**
 * @swagger
 * /admin/api/user/login:
 *   post:
 *     summary: Login user
 *     tags:
 *       - User
 *     responses:
 *       200:
 *         description: User logged in successfully
 */
router.post("/login", userController.loginUser);

/**
 * @swagger
 * /admin/api/user/logout:
 *   post:
 *     summary: Logout user
 *     tags:
 *       - User
 *     responses:
 *       200:
 *         description: User logged out successfully
 */
router.post("/logout", userController.logoutUser);

router.post("/token", userController.refreshToken);

module.exports = router;
