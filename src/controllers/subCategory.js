const createHttpError = require("http-errors");
const subCategoryModel = require("../models/subCategory");

const addSubCategory = async (req, res, next) => {
  const { iCategoryIDForAdd, sNameAddSubCategory } = req.body;

  if (!iCategoryIDForAdd || !sNameAddSubCategory) {
    const error = createHttpError(400, "all fields are required");
    return next(error);
  }
  try {
    const subCategory = new subCategoryModel({
      category_id: iCategoryIDForAdd,
      category_name: "test",
      sub_category_name: sNameAddSubCategory,
      user_id: "665ad869514ad9cc291adced",
      createdAt: new Date(),
      updatedAt: new Date(),
      status: 1,
    });
    await subCategory.save();
    res.status(201).json({
      message: "sub category added successfully",
    });
  } catch (error) {
    console.log(error);
    next(createHttpError(500, "Error while adding sub category"));
  }
};
const updateSubCategory = async (req, res, next) => {
  const { iUpdateSubCategoryID, iUpdateCategoryID, sUpdateSubCategoryName } =
    req.body;

  if (!iUpdateSubCategoryID || !sUpdateSubCategoryName) {
    const error = createHttpError(400, "all fields are required");
    return next(error);
  }
  try {
    const updateSubCategory = await subCategoryModel.findByIdAndUpdate(
      iUpdateSubCategoryID,
      {
        category_id: iUpdateCategoryID,
        sub_category_name: sUpdateSubCategoryName,
      },
      { new: true, runValidators: true }
    );
    if (!updateSubCategory) {
      return next(createHttpError(404, "sub category not found"));
    }
    res.status(200).json({
      message: "sub category updated successfully",
      subCategory: updateSubCategory,
    });
  } catch (error) {
    next(createHttpError(500, "Error while updating sub category"));
  }
};

const deleteSubCategory = async (req, res, next) => {
  const { subCategoryID } = req.params;
  try {
    const deleteSubCategory = await subCategoryModel.findByIdAndDelete(
      subCategoryID
    );
    if (!deleteSubCategory) {
      return next(createHttpError(404, "sub category not found"));
    }
    res.status(200).json({
      message: "sub category deleted successfully ",
      subCategory: deleteSubCategory,
    });
  } catch (error) {
    next(createHttpError(500, "Error while deleting sub category"));
  }
};

const selectSubCategory = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const search = req.query.search || "";

    const searchQuery = search
      ? { sub_category_name: { $regex: search, $options: "i" } }
      : {};

    const totalSubCategories = await subCategoryModel.countDocuments();
    const subCategories = await subCategoryModel
      .find(searchQuery)
      .skip(skip)
      .limit(limit);
    if (!subCategories) {
      return next(createHttpError(404, "categories not found"));
    } else {
      res.status(200).json({
        subCategories,
        totalPages: Math.ceil(totalSubCategories / limit),
        currentPage: page,
      });
    }
  } catch (error) {
    next(
      createHttpError(500, "Error while fetching sub categories by category")
    );
  }
};
const selectOneSubCategory = async (req, res, next) => {
  const { subCategoryID } = req.params;
  try {
    const subCategories = await subCategoryModel.findById(subCategoryID);
    console.log(subCategories);
    if (!subCategories) {
      return next(createHttpError(404, "categories not found"));
    }
    res.status(200).json(subCategories);
  } catch (error) {
    next(createHttpError(500, "Error while retrieving sub category"));
  }
};

//select sub category by category
const selectOneSubCategoryByCategory = async (req, res, next) => {
  const { categoryID } = req.params;
  try {
    const subCategories = await subCategoryModel
      .find({
        category_id: categoryID,
        status: 1,
      })
      .select("_id sub_category_name");
    if (!subCategories) {
      return next(createHttpError(404, "sub categories not found"));
    }
    res.status(200).json(subCategories);
  } catch (error) {
    next(createHttpError(500, "Error while retrieving sub category"));
  }
};

module.exports = {
  addSubCategory,
  updateSubCategory,
  deleteSubCategory,
  selectSubCategory,
  selectOneSubCategory,
  selectOneSubCategoryByCategory,
};
