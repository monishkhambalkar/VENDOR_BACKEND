const express = require("express");
// const addCategory = require("../controllers/category");

const categoryController = ({
  addCategory,
  updateCategory,
  deleteCategory,
  selectCategory,
  selectOneCategory,
} = require("../controllers/category"));

const router = express.Router();

// Add Category

/**
 * @swagger
 * /admin/api/category/add-category:
 *   post:
 *     summary: Add new category
 *     tags:
 *       - Category
 *     parameters:
 *       - in: query
 *         name: categoryName
 *         required: true
 *         schema:
 *           type: string
 *         example: Electronics
 *     responses:
 *       200:
 *         description: Category added successfully
 */

router.post("/add-category", categoryController.addCategory);

/**
 * @swagger
 * /admin/api/category/update-category/{categoryID}:
 *   patch:
 *     summary: Update category
 *     tags:
 *       - Category
 *     parameters:
 *       - in: path
 *         name: categoryID
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Category updated
 */
router.patch("/update-category/:categoryID", categoryController.updateCategory);


/**
 * @swagger
 * /admin/api/category/delete-category/{categoryID}:
 *   delete:
 *     summary: Delete category
 *     tags:
 *       - Category
 *     parameters:
 *       - in: path
 *         name: categoryID
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Category deleted
 */
router.delete(
  "/delete-category/:categoryID",
  categoryController.deleteCategory
);

/**
 * @swagger
 * /admin/api/category/select-category:
 *   post:
 *     summary: Get all categories
 *     tags:
 *       - Category
 *     responses:
 *       200:
 *         description: Category list fetched
 */
router.post("/select-category", categoryController.selectCategory);

/**
 * @swagger
 * /admin/api/category/select-category/{categoryID}:
 *   post:
 *     summary: Get category by ID
 *     tags:
 *       - Category
 *     parameters:
 *       - in: path
 *         name: categoryID
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Category fetched successfully
 */
router.post(
  "/select-category/:categoryID",
  categoryController.selectOneCategory
);

module.exports = router;
