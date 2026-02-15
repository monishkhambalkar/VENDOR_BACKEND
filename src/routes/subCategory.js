const express = require("express");

const subCategoryController = ({
  addSubCategory,
  updateSubCategory,
  deleteSubCategory,
  selectSubCategory,
  selectOneSubCategory,
  selectOneSubCategoryByCategory,
} = require("../controllers/subCategory"));

const router = express.Router();

/**
 * @swagger
 * /admin/api/subCategory/add-sub-category:
 *   post:
 *     summary: Add new sub category
 *     tags:
 *       - Sub Category
 *     parameters:
 *       - in: query
 *         name: subCategoryName
 *         required: true
 *         schema:
 *           type: string
 *         example: Mobile Phones
 *       - in: query
 *         name: categoryID
 *         required: true
 *         schema:
 *           type: string
 *         example: 1234567890abcdef12345678
 *     responses:
 *       200:
 *         description: Sub category added successfully
 */
router.post("/add-sub-category", subCategoryController.addSubCategory);

/**
 * @swagger
 * /admin/api/subCategory/update-sub-category/{subCategoryID}:
 *   patch:
 *     summary: Update sub category
 *     tags:
 *       - Sub Category
 *     parameters:
 *       - in: path
 *         name: subCategoryID
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Sub category updated
 */
router.patch(
  "/update-sub-category/:subCategoryID",
  subCategoryController.updateSubCategory
);

/**
 * @swagger
 * /admin/api/subCategory/delete-sub-category/{subCategoryID}:
 *   delete:
 *     summary: Delete sub category
 *     tags:
 *       - Sub Category
 *     parameters:
 *       - in: path
 *         name: subCategoryID
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Sub category deleted successfully
 */
router.delete(
  "/delete-sub-category/:subCategoryID",
  subCategoryController.deleteSubCategory
);

/**
 * @swagger
 * /admin/api/subCategory/select-sub-category:
 *   post:
 *     summary: Select sub category
 *     tags:
 *       - Sub Category
 *     responses:
 *       200:
 *         description: Sub category selected successfully
 */
router.post("/select-sub-category", subCategoryController.selectSubCategory);

/**
 * @swagger
 * /admin/api/subCategory/select-sub-category/{subCategoryID}:
 *   post:
 *     summary: Get sub category by ID
 *     tags:
 *       - Sub Category
 *     parameters:
 *       - in: path
 *         name: subCategoryID
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Sub category fetched successfully
 */
router.post(
  "/select-sub-category/:subCategoryID",
  subCategoryController.selectOneSubCategory
);

/**
 * @swagger
 * /admin/api/subCategory/select-sub-category-by-category/{categoryID}:
 *   post:
 *     summary: Get sub category by category ID
 *     tags:
 *       - Sub Category
 */
//select sub category by category
router.post(
  "/select-sub-category-by-category/:categoryID",
  subCategoryController.selectOneSubCategoryByCategory
);

module.exports = router;
