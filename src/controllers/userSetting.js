const createHttpError = require("http-errors");
const userSettingModel = require("../models/userSetting");
const cloudinary = require("../config/cloudinary");
const path = require("node:path");
const fs = require("node:fs");
const multer = require("multer");

const addUser = async (req, res, next) => {
  try {
    userID = "665ad869514ad9cc291adced";

    const {
      sName,
      iMobile,
      sEmail,
      sCity,
      sState,
      sCountry,
      sAddress,
      sCompanyName,
      sGSTNumber,
      sBankNumber,
      sPuckUpAddress,
    } = req.body;

    const aProfileImageFiles = req.files.file;

    if (
      !sName ||
      !iMobile ||
      !sEmail ||
      !sCity ||
      !sState ||
      !sCountry ||
      !sAddress ||
      !sCompanyName ||
      !sGSTNumber ||
      !sBankNumber ||
      !sPuckUpAddress
    ) {
      return next(createHttpError(400, "all fields are required"));
    }

    let aProfileImages = [];

    for (const file of aProfileImageFiles) {
      const coverImageMimeType = file.mimetype.split("/").pop();
      const fileName = file.fileName;
      const filePath = path.resolve(
        __dirname,
        "../../../uploads/admin",
        fileName
      );
      try {
        const profileImage = await cloudinary.uploader.upload(filePath, {
          public_id: fileName,
          folder: "book-covers",
          resource_type: "auto",
        });
        aProfileImages.push(profileImage.secure_url);
      } catch (error) {}
    }

    const addUserData = new userSettingModel({
      full_name: sName,
      mobile: iMobile,
      email: sEmail,
      city: sCity,
      state: sState,
      country: sCountry,
      address: sAddress,
      company_name: sCompanyName,
      gst_number: sGSTNumber,
      bank_account: sBankNumber,
      pickup_address: sPuckUpAddress,
      images: aProfileImages,
      user_id: userID,
      status: 1,
    });
    await addUserData.save();
    res
      .status(201)
      .json({ message: "user data added successfully", user: addUserData });
  } catch (error) {
    console.error("Error details:", error);
    return next(createHttpError(500, "Error while adding user data"));
  }
};

const updateUser = (req, res, next) => {};

const selectUser = (req, res, next) => {};

module.exports = { addUser, updateUser, selectUser };
