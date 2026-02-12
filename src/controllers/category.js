const createHttpError = require("http-errors");
const categoryModel = require("../models/category");
const { query } = require("express");

const addCategory = async (req, res, next) => {
  const { sNameAddCategory } = req.body; // Destructure to get 'name' directly

  console.log(categoryModel)

  if (!sNameAddCategory) {
    const error = createHttpError(400, "All fields are required");
    return next(error);
  }
  try {
    const category = new categoryModel({
      category_name: sNameAddCategory,
      user_id: "665ad869514ad9cc291adced",
      createdAt: new Date(),
      updatedAt: new Date(),
      status: 1,
    });
    await category.save();
    res.status(201).json({ message: "Category added successfully" });
  } catch (error) {
    next(createHttpError(500, "Error while creating category"));
  }
};

const updateCategory = async (req, res, next) => {
  const { iUpdateCategoryID, sUpdateCategoryName } = req.body;

  if (!sUpdateCategoryName) {
    const error = createHttpError(400, "All fields are required");
    return next(error);
  }
  try {
    const updatedCategory = await categoryModel.findByIdAndUpdate(
      iUpdateCategoryID,
      { category_name: sUpdateCategoryName },
      { new: true, runValidators: true }
    );
    if (!updateCategory) {
      return next(createHttpError(404, "Category not Found"));
    }
    res.status(200).json({
      message: "Category update successfully",
      category: updatedCategory,
    });
  } catch (error) {
    next(createHttpError(500, "error while updating category"));
  }
};

const deleteCategory = async (req, res, next) => {
  const { categoryID } = req.params;

  try {
    const deletedCategory = await categoryModel.findByIdAndDelete(categoryID);
    if (!deletedCategory) {
      return next(createHttpError(404, "Category not found"));
    }
    res.status(200).json({
      message: "Category deleted successfully",
      category: deleteCategory,
    });
  } catch (error) {
    next(createHttpError(500, "Error while deleting category"));
  }
};

const selectCategory = async (req, res, next) => {
  try {
  
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const search = req.query.search || "";

    const searchQuery = search
      ? { category_name: { $regex: search, $options: "i" } } // Case-insensitive search in category_name field
      : {};
    const totalCategories = await categoryModel.countDocuments(searchQuery);
    const categories = await categoryModel
      .find(searchQuery)
      .skip(skip)
      .limit(limit);

    console.log(categories);

    // console.log("Query Explanation:", JSON.stringify(categories, null, 2));

    res.status(200).json({
      categories,
      totalPages: Math.ceil(totalCategories / limit),
      currentPage: page,
    });
  } catch (error) {
    console.error(error); // Log the error for debugging
    next(createHttpError(500, "Error while fetching categories"));
  }
};

const selectOneCategory = async (req, res, next) => {
  const { categoryID } = req.params;

  try {
    const category = await categoryModel.findById(categoryID);
    if (!category) {
      return next(createHttpError(404, "category not found"));
    }
    res.status(200).json(category);
  } catch (error) {
    next(createHttpError(500, "Error while retrieving category"));
  }
};

module.exports = {
  addCategory,
  updateCategory,
  deleteCategory,
  selectCategory,
  selectOneCategory,
};
