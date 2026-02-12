const express = require("express");
const path = require("node:path");
const multer = require("multer");
const userSettingController = ({
  addUser,
  updateUser,
  selectUser,
} = require("../controllers/userSetting"));

const router = express.Router();

const upload = multer({
  dest: path.resolve(__dirname, "../../../uploads/admin"),
  limits: { fileSize: 3e7 },
});

router.post(
  "/add-user",
  upload.fields([{ name: "file", maxCount: 3 }]),
  userSettingController.addUser
);

router.patch("/update-user/:userID", userSettingController.updateUser);

router.post("/select-user/:userID", userSettingController.selectUser);

module.exports = router;
