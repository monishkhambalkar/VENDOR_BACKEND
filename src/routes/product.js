const express = require("express");
const path = require("node:path");
const multer = require("multer");
const authenticate = require("../middlewares/authenticate");
const redisCache = require("../middlewares/redisCache");
const cacheInvalidator = require("../middlewares/cacheInvalidator");
const productController = require("../controllers/product");

const productRouter = express.Router();

const upload = multer({
  dest: path.resolve(__dirname, "../../../uploads/admin"),
  limits: { fileSize: 3e7 },
});

const vendorProductsKey = (req) =>
  req.user?.id
    ? `products:${req.user.id}:${req.query.page || 1}:${
        req.query.limit || 5
      }:${req.query.search || ""}`
    : null;

const singleProductKey = (req) =>
  `product:${req.params.iProductID}`;

// ADD
productRouter.post(
  "/add-product/:vendorId",
  authenticate,
  upload.fields([{ name: "file", maxCount: 3 }]),
  cacheInvalidator(vendorProductsKey), // 🔥 AUTO CLEAR
  productController.addProduct
);

// UPDATE
productRouter.patch(
  "/update-product/:iProductID",
  authenticate, // 🔥 REQUIRED
  upload.fields([{ name: "file", maxCount: 3 }]),
  cacheInvalidator(vendorProductsKey), // 🔥 AUTO CLEAR
  cacheInvalidator(singleProductKey),  // 🔥 CLEAR SINGLE CACHE
  productController.updateProduct
);

// DELETE
productRouter.delete(
  "/delete-product/:iProductID",
  authenticate, // 🔥 REQUIRED
  cacheInvalidator(vendorProductsKey),
  cacheInvalidator(singleProductKey),
  productController.deleteProduct
);

// SELECT LIST (CACHED)
// productRouter.post(
//   "/select-product",
//   authenticate,
//   redisCache(
//     (req) =>
//       `products:${req.user.id}:${req.query.page || 1}:${
//         req.query.limit || 5
//       }:${req.query.search || ""}`
//   ),
//   productController.selectProduct
// );

productRouter.post(
  "/select-product",
  authenticate,
  redisCache(vendorProductsKey),
  productController.selectProduct
);

// SELECT SINGLE (CACHED)
productRouter.post(
  "/select-product/:iProductID",
  redisCache(singleProductKey),
  productController.selectOneProduct
);

module.exports = productRouter;
