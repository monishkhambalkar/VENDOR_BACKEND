const { NextFunction, Request, Response, response } = require("express");
const cloudinary = require("../config/cloudinary");
const path = require("node:path");
const fs = require("node:fs");
const createHttpError = require("http-errors");
const productModel = require("../models/products");
const { AuthRequest } = require("../middlewares/authenticate");
const { model } = require("mongoose");
const { query } = require("express");

const addProduct = async (req, res, next) => {
  try {
    const sProductName = req.body.sProductName;
    const iCategory = req.body.iCategory;
    const iSubCategory = req.body.iSubCategory;
    const iOriginalPrice = req.body.iOriginalPrice;
    const iSellingPrice = req.body.iSellingPrice;
    const sQty = req.body.sQty;
    const sTags = req.body.sTags;
    const sProductContent = req.body.sProductContent;
    const sProductSpecification = req.body.sProductSpecification;
    const sBrand = req.body.sBrand;
    const sColor = req.body.sColor;
    const sProductFileName = req.files.originalname;
    const aProductFiles = req.files.file;

    if (!sProductName) {
      const error = createHttpError(400, "All fields are required");
      return next(error);
    }

    let aProductImages = [];

    for (const file of aProductFiles) {
      const coverImageMimeType = file.mimetype.split("/").pop();
      const fileName = file.filename;
      const filePath = path.resolve(
        __dirname,
        "../../../uploads/admin",
        fileName
      );

      try {
        const productImage = await cloudinary.uploader.upload(filePath, {
          public_id: fileName,
          folder: "book-covers",
          resource_type: "auto",
        });
        aProductImages.push(productImage.secure_url);
        await fs.promises.unlink(filePath); // Delete the file after uploading
      } catch (uploadError) {
        console.error("Error uploading to Cloudinary", uploadError);
        return next(createHttpError(500, "Error uploading to Cloudinary"));
      }
    }

    const productSave = new productModel({
      product_name: sProductName,
      category_id: iCategory, // Should be a number
      sub_category_id: iSubCategory, // Should be a number
      original_price: iOriginalPrice, // Provide a default value if not available
      selling_price: iSellingPrice, // Provide a default value if not available
      quantity: sQty,
      label_tags: sTags,
      product_content: sProductContent,
      product_specification: sProductSpecification,
      brand: sBrand,
      colors: sColor,
      images: aProductImages,
      user_id: "665ad869514ad9cc291adced",
      createdAt: new Date(),
      updatedAt: new Date(),
      status: 1,
    });

    await productSave.save();

    res
      .status(201)
      .json({ id: productSave._id, message: "Product added successfully" });
  } catch (error) {
    console.error("Error while adding Product", error);
    next(createHttpError(500, "Error while adding Product"));
  }
};

const updateProduct = async (req, res, next) => {
  try {
    const {
      sProductName,
      iCategory,
      iSubCategory,
      iOriginalPrice,
      iSellingPrice,
      sQty,
      sTags,
      sProductContent,
      sProductSpecification,
      sBrand,
      sColor,
    } = req.body;

    const aProductFiles = req.files.file;

    if (!sProductName || !iCategory || !iSubCategory) {
      return next(createHttpError(400, "All required fields must be provided"));
    }

    let aProductImages = [];

    for (const file of aProductFiles) {
      const fileName = file.filename;
      const filePath = path.resolve(
        __dirname,
        "../../../uploads/admin",
        fileName
      );

      try {
        const productImage = await cloudinary.uploader.upload(filePath, {
          public_id: fileName,
          folder: "book-covers",
          resource_type: "auto",
        });
        aProductImages.push(productImage.secure_url);
        await fs.promises.unlink(filePath);
      } catch (uploadError) {
        console.error("Error uploading to cloudinary", uploadError);
        return next(createHttpError(500, "Error uploading to cloudinary"));
      }
    }

    const productUpdate = {
      product_name: sProductName,
      category_id: iCategory,
      sub_category_id: iSubCategory,
      original_price: iOriginalPrice || 0, // Default to 0 if not provided
      selling_price: iSellingPrice || 0, // Default to 0 if not provided
      quantity: sQty,
      label_tags: sTags,
      product_content: sProductContent,
      product_specification: sProductSpecification,
      brand: sBrand,
      colors: sColor,
      images: aProductImages,
      user_id: "665ad869514ad9cc291adced",
      updatedAt: new Date(),
      status: 1,
    };

    // Ensure you have the product ID from the request
    const { iProductID } = req.params;

    const updatedProduct = await productModel.findByIdAndUpdate(
      iProductID,
      productUpdate,
      {
        new: true,
      }
    );

    if (!updatedProduct) {
      return next(createHttpError(404, "Product not found"));
    }

    res.status(200).json({
      id: updatedProduct._id,
      message: "Product updated successfully",
    });
  } catch (error) {
    console.error("Error while updating product", error);
    next(createHttpError(500, "Error while updating product"));
  }
};

const deleteProduct = async (req, res, next) => {
  const { iProductID } = req.params;
  try {
    const product = await productModel.findOne({ _id: iProductID });

    if (!product) {
      return next(createHttpError(404, "product not found"));
    }

    const imageIds = product.images.map((image) => {
      const imageId = image.split("/").pop().split(".")[0];
      return cloudinary.uploader.destroy(imageId);
    });

    await Promise.all(imageIds);

    const deleteProduct = await productModel.findByIdAndDelete(iProductID);
    if (deleteProduct) {
      res.status(200).json({
        message: "product deleted successfully",
        product: deleteProduct,
      });
    } else {
      res.json({
        message: "product not deleted",
      });
    }
  } catch (error) {
    console.log("Error while deleting product", error);
    next(createHttpError(500, "Error while deleting Products"));
  }
};
const selectProduct = async (req, res, next) => {
  // console.log("data select");
  try {
    // console.log("page1 ", req.query.page);
    // console.log("limit1 ", req.query.limit);

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5;
    const skip = (page - 1) * limit;
    const search = req.query.search || "";

    // console.log("page ", page);
    // console.log("limit ", limit);
    // console.log("skip ", skip);

    const searchQuery = search
      ? { product_name: { $regex: search, $options: "i" } } // Case-insensitive search in category_name field
      : {};
    const totalProducts = await productModel.countDocuments(searchQuery);
    const products = await productModel
      .find(searchQuery)
      .skip(skip)
      .limit(limit);
    if (products.length > 0) {
      res.status(200).json({
        products,
        // totalPages: Math.ceil(totalProducts / limit),
        currentPage: page,
      });
    } else {
      res.send("No products are found");
    }
  } catch (error) {
    console.log("Error while selecting product", error);
    next(createHttpError(500, "Error while fetching Products"));
  }
};
const selectOneProduct = async (req, res, next) => {
  const { iProductID } = req.params;
  try {
    const product = await productModel.findById(iProductID);
    if (product) {
      res.status(200).json({ product });
    } else {
      res.status(404).json({ message: "Product not found" });
    }
  } catch (error) {
    console.log("Error while selecting product by id ", error);
    next(createHttpError(500, "Error while fetching Products for id"));
  }
};

module.exports = {
  addProduct,
  updateProduct,
  deleteProduct,
  selectProduct,
  selectOneProduct,
};
