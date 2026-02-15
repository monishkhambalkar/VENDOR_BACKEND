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

/**
 * @swagger
 * /admin/api/product/add-product:
 *   post:
 *     summary: Add product
 *     tags:
 *       - Product
 *     responses:
 *       200:
 *         description: Product added
 */
productRouter.post(
  "/add-product",
  authenticate,
  upload.fields([{ name: "file", maxCount: 3 }]),
  productController.addProduct
);

/**
 * @swagger
 * /admin/api/product/update-product/{iProductID}:
 *   patch:
 *     summary: Update product
 *     tags:
 *       - Product
 *     parameters:
 *       - in: path
 *         name: iProductID
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Product updated
 */
productRouter.patch(
  "/update-product/:iProductID",
  upload.fields([{ name: "file", maxCount: 3 }]),
  productController.updateProduct
);

/**
 * @swagger
 * /admin/api/product/delete-product/{iProductID}:
 *   delete:
 *     summary: Delete product
 *     tags:
 *       - Product
 *     parameters:
 *       - in: path
 *         name: iProductID
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Product deleted
 */
productRouter.delete(
  "/delete-product/:iProductID",
  productController.deleteProduct
);

/**
 * @swagger
 * /admin/api/product/select-product:
 *   post:
 *     summary: Get all products
 *     tags:
 *       - Product
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: number
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Products fetched
 */
productRouter.post("/select-product", productController.selectProduct);

/**
 * @swagger
 * /admin/api/product/select-product/{iProductID}:
 *   post:
 *     summary: Get product by ID
 *     tags:
 *       - Product
 *     parameters:
 *       - in: path
 *         name: iProductID
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Product fetched
 */
productRouter.post(
  "/select-product/:iProductID",
  productController.selectOneProduct
);

module.exports = productRouter;
