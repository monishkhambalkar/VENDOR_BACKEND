const cloudinary = require("../config/cloudinary");
const path = require("node:path");
const fs = require("node:fs");
const createHttpError = require("http-errors");
const productModel = require("../models/products");
const redisClient = require("../config/redis");


// ======================
// CACHE CLEAR HELPER
// ======================

const clearProductsCache = async () => {
  try {
    const keys = await redisClient.keys("products:*");
    const singleKeys = await redisClient.keys("product:*");

    const allKeys = [...keys, ...singleKeys];

    if (allKeys.length) {
      await redisClient.del(allKeys);
      console.log("🧹 Product cache cleared");
    }
  } catch (err) {
    console.log("Cache clear error", err);
  }
};

const clearVendorProductsCache = async (vendorId) => {
  const keys = await redisClient.keys(`products:${vendorId}:*`);

  if (keys.length) {
    await redisClient.del(keys);
    console.log("Vendor product cache cleared");
  }
};


// ======================
// ADD PRODUCT
// ======================

const addProduct = async (req, res, next) => {
  try {

    const { sProductName } = req.body;
    const aProductFiles = req.files.file;
    const userId = req.params.vendorId;

    if (!sProductName) {
      return next(createHttpError(400, "All fields required"));
    }

    let aProductImages = [];

    for (const file of aProductFiles) {
      const filePath = path.resolve(
        __dirname,
        "../../../uploads/admin",
        file.filename
      );

      const productImage = await cloudinary.uploader.upload(filePath, {
        public_id: file.filename,
        folder: "book-covers",
        resource_type: "auto",
      });

      aProductImages.push(productImage.secure_url);
      await fs.promises.unlink(filePath);
    }

    const productSave = await productModel.create({
      product_name: req.body.sProductName,
      category_id: req.body.iCategory,
      sub_category_id: req.body.iSubCategory,
      original_price: req.body.iOriginalPrice,
      selling_price: req.body.iSellingPrice,
      quantity: req.body.sQty,
      label_tags: req.body.sTags,
      product_content: req.body.sProductContent,
      product_specification: req.body.sProductSpecification,
      brand: req.body.sBrand,
      colors: req.body.sColor,
      images: aProductImages,
      user_id: userId,
      status: 1,
    });

    await clearVendorProductsCache(userId);

    res.status(201).json({
      id: productSave._id,
      message: "Product added successfully",
    });

  } catch (err) {
    next(createHttpError(500, "Error adding product"));
  }
};


// ======================
// SELECT PRODUCTS (LIST)
// ======================
const selectProduct = async (req, res, next) => {
  try {

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5;
    const skip = (page - 1) * limit;
    const search = req.query.search || "";
    const vendorId = req.user.id;

    console.time("MongoDB");

    const searchQuery = search
      ? { product_name: { $regex: search, $options: "i" } }
      : {};

    const totalProducts = await productModel.countDocuments({
      user_id: vendorId,
      ...searchQuery,
    });

    const products = await productModel
      .find({
        user_id: vendorId,
        ...searchQuery,
      })
      .skip(skip)
      .limit(limit);

    const responseData = {
      products,
      currentPage: page,
      totalPages: Math.ceil(totalProducts / limit),
    };

    console.log("CHECK BEFORE REDIS")

    // SAVE CACHE
    await redisClient.set(
      req.cacheKey,
      JSON.stringify(responseData),
      { EX: 3600 }
    );

    
    console.log("CHECK AFTER REDIS")

    console.log("🧠 Data from MongoDB");

    console.timeEnd("MongoDB");

    res.status(200).json(responseData);

  } catch (err) {
    next(err);
  }
};

// ======================
// SELECT ONE PRODUCT
// ======================
const selectOneProduct = async (req, res, next) => {
  try {

    const { iProductID } = req.params;

    const product = await productModel.findById(iProductID);

    if (!product) {
      return next(createHttpError(404, "Product not found"));
    }

    await redisClient.set(
      req.cacheKey,
      JSON.stringify({ product }),
      { EX: 3600 }
    );

    res.status(200).json({ product });

  } catch (err) {
    next(createHttpError(500, "Error fetching product"));
  }
};


// ======================
// UPDATE PRODUCT
// ======================
const updateProduct = async (req, res, next) => {
  try {

    const { iProductID } = req.params;

    // console.log(req.body); return false;

    const updateData = {
    product_name: req.body.sProductName,
    category_id: req.body.iCategory,
    sub_category_id: req.body.iSubCategory,
    original_price: Number(req.body.iOriginalPrice),
    selling_price: Number(req.body.iSellingPrice),
    quantity: Number(req.body.sQty),
    label_tags: req.body.sTags ? [req.body.sTags] : [],
    product_content: req.body.sProductContent,
    product_specification: req.body.sProductSpecification,
    brand: req.body.sBrand,
    colors: req.body.sColor,
    images: req.body.file ? [req.body.file] : []
  };

    const updatedProduct = await productModel.findByIdAndUpdate(
      iProductID,
      { $set: updateData },
      {
        new: true,
        runValidators: true
      }
    );

    if (!updatedProduct) {
      return next(createHttpError(404, "Product not found"));
    }

    await clearVendorProductsCache(req.user.id);

    res.status(200).json({
      message: "Product updated successfully",
      id: updatedProduct._id,
    });

  } catch (err){
    console.error("REAL ERROR:", err);
    next(createHttpError(500, err.message));
  }
};


// ======================
// DELETE PRODUCT
// ======================
const deleteProduct = async (req, res, next) => {
  try {

    const { iProductID } = req.params;

    const deleted = await productModel.findByIdAndDelete(iProductID);

    if (!deleted) {
      return next(createHttpError(404, "Product not found"));
    }

    await clearVendorProductsCache(req.user.id);

    res.json({ message: "Product deleted" });

  } catch {
    next(createHttpError(500, "Delete error"));
  }
};

module.exports = {
  addProduct,
  updateProduct,
  deleteProduct,
  selectProduct,
  selectOneProduct,
};
