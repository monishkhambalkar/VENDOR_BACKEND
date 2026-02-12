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
router.post("/add-category", categoryController.addCategory);

router.patch("/update-category/:categoryID", categoryController.updateCategory);

router.delete(
  "/delete-category/:categoryID",
  categoryController.deleteCategory
);

router.post("/select-category", categoryController.selectCategory);

router.post(
  "/select-category/:categoryID",
  categoryController.selectOneCategory
);

module.exports = router;
