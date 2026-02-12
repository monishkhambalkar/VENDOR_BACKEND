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

router.post("/add-sub-category", subCategoryController.addSubCategory);

router.patch(
  "/update-sub-category/:subCategoryID",
  subCategoryController.updateSubCategory
);

router.delete(
  "/delete-sub-category/:subCategoryID",
  subCategoryController.deleteSubCategory
);

router.post("/select-sub-category", subCategoryController.selectSubCategory);

router.post(
  "/select-sub-category/:subCategoryID",
  subCategoryController.selectOneSubCategory
);

//select sub category by category
router.post(
  "/select-sub-category-by-category/:categoryID",
  subCategoryController.selectOneSubCategoryByCategory
);

module.exports = router;
