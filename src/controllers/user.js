const createHttpError = require("http-errors");
const loginModel = require("../models/user");
const bcrypt = require("bcrypt");
const { sign } = require("jsonwebtoken");
const config = require("../config/config");

//REGISTER
const registerUser = async (req, res, next) => {
  const { sName, sEmail, sPassword, sUserType } = req.body;

  //check validation
  if (!sName || !sEmail || !sPassword) {
    const error = createHttpError(400, "All fields are required");
    return next(error);
  }

  try {
    const user = await loginModel.findOne({ email: sEmail });
    if (user) {
      const error = createHttpError(
        400,
        "User already exists with the same email"
      );
      return next(error);
    }

    // password hash
    const hashedPassword = await bcrypt.hash(sPassword, 10);

    // add user for login
    const newUser = new loginModel({
      username: sName,
      email: sEmail,
      password: hashedPassword,
      user_type: sUserType,
      createdAt: new Date(),
      updatedAt: new Date(),
      status: 1,
    });

    await newUser.save();

    // create jwt token
    const token = sign({ sub: newUser._id }, config.jwtSecret, {
      expiresIn: config.jwtExpire,
      algorithm: "HS256",
    });

    const refreshToken = sign({ sub: newUser._id }, config.jwtSecret, {
      expiresIn: config.refreshTokenExpire,
      algorithm: "HS256",
    });

    newUser.refreshToken = refreshToken;
    await newUser.save();

    res.status(201).json({
      message: "User added successfully",
      accessToken: token,
      user: newUser._id,
      refreshToken: refreshToken,
    });
  } catch (err) {
    console.log(err);
    return next(createHttpError(500, "Error while creating user or jwt token"));
  }
};

// LOGIN
const loginUser = async (req, res, next) => {
  const { sEmail, sPassword } = req.body;
  if (!sEmail || !sPassword) {
    return next(createHttpError(400, "All fields are required"));
  }

  const login = await loginModel.findOne({ email: sEmail });

  if (!login) {
    return next(createHttpError(400, "User not found"));
  }

  const isMatch = await bcrypt.compare(sPassword, login.password);

  if (!isMatch) {
    res.status(400).json({ message: "username or password is incorrect" });
    return next(createHttpError(400, "username or password is incorrect"));
  }

  const token = sign({ sub: login._id }, config.jwtSecret, {
    expiresIn: config.jwtExpire,
    algorithm: "HS256",
  });

  const refreshToken = sign({ sub: login._id }, config.jwtSecret, {
    expiresIn: config.refreshTokenExpire,
    algorithm: "HS256",
  });

  login.refreshToken = refreshToken;
  await login.save();

  res
    .status(200)
    .json({ accessToken: token, user: login._id, user_type: login.user_type,  refreshToken: refreshToken });
};

const logoutUser = async (req, res, next) => {
  try {
    const { token } = req.body;

    console.log(token);

    const logout = await loginModel.findOneAndUpdate(
      { refreshToken: token }, // Query to find the document by refreshToken
      { $set: { refreshToken: null } }, // Update operation to set refreshToken to null
      { new: true } // Option to return the updated document
    );

    if (!logout) {
      return res.status(400).json({ message: "invalid request" });
    }

    res.status(200).json({ message: "Logged out" });
  } catch (error) {
    console.log(error);
  }
};

const refreshToken = async (req, res) => {
  const { token } = req.body;
  if (!token) {
    return res.status(401).json({ message: "No token provided" });
  }

  try {
    const decoded = jwt.verify(token, config.refreshTokenSecret);
    const user = await loginModel.findById(decoded.id);
    if (!user || user.refreshToken !== token) {
      return res.status(403).json({ message: "Invalid token" });
    }

    const accessToken = jwt.sign({ id: user._id }, config.jwtSecret, {
      expiresIn: config.jwtExpire,
    });
    res.json({ accessToken });
  } catch (error) {
    res.status(403).json({ message: "Invalid token" });
  }
};

module.exports = { registerUser, loginUser, logoutUser, refreshToken };
