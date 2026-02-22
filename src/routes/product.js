const express = require("express");
const path = require("node:path");
const multer = require("multer");
const authenticate = require("../middlewares/authenticate");
const redisCache = require("../middlewares/redisCache");

const productController = require("../controllers/product");

const productRouter = express.Router();

const upload = multer({
  dest: path.resolve(__dirname, "../../../uploads/admin"),
  limits: { fileSize: 3e7 },
});


// ADD
productRouter.post(
  "/add-product/:vendorId",
  authenticate,
  upload.fields([{ name: "file", maxCount: 3 }]),
  productController.addProduct
);


// UPDATE
productRouter.patch(
  "/update-product/:iProductID",
  upload.fields([{ name: "file", maxCount: 3 }]),
  productController.updateProduct
);


// DELETE
productRouter.delete(
  "/delete-product/:iProductID",
  productController.deleteProduct
);


// SELECT LIST (CACHED)
productRouter.post(
  "/select-product",
  authenticate,
  redisCache(
    (req) =>
      `products:${req.user.id}:${req.query.page || 1}:${
        req.query.limit || 5
      }:${req.query.search || ""}`
  ),
  productController.selectProduct
);


// SELECT SINGLE (CACHED)
productRouter.post(
  "/select-product/:iProductID",
  redisCache((req) => `product:${req.params.iProductID}`),
  productController.selectOneProduct
);

module.exports = productRouter;
