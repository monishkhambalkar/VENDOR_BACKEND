const express = require("express");
const path = require("node:path");
const multer = require("multer");
const authenticate = require("../middlewares/authenticate");

const productController = ({
  addProduct,
  updateProduct,
  deleteProduct,
  selectProduct,
  selectOneProduct,
} = require("../controllers/product"));

const productRouter = express.Router();

const upload = multer({
  dest: path.resolve(__dirname, "../../../uploads/admin"),
  limits: { fileSize: 3e7 },
});

productRouter.post(
  "/add-product",
  authenticate,
  upload.fields([{ name: "file", maxCount: 3 }]),
  productController.addProduct
);

productRouter.patch(
  "/update-product/:iProductID",
  upload.fields([{ name: "file", maxCount: 3 }]),
  productController.updateProduct
);

productRouter.delete(
  "/delete-product/:iProductID",
  productController.deleteProduct
);

productRouter.post("/select-product", productController.selectProduct);

productRouter.post(
  "/select-product/:iProductID",
  productController.selectOneProduct
);

module.exports = productRouter;
