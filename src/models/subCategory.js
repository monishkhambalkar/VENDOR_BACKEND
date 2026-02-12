const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const subcategorySchema = new Schema({
  category_id: { type: String, required: true },
  category_name: { type: String, required: true },
  sub_category_name: { type: String, required: true },
  user_id: { type: String, required: false },
  createdAt: { type: Date, required: false },
  updatedAt: { type: Date, required: false },
  status: { type: Number, required: true },
});

const subCategory = mongoose.model("admin_sub_categories", subcategorySchema);
module.exports = subCategory;
