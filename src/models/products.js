const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const productSchema = new Schema(
  {
    product_name: { type: String, required: true },
    category_id: {
      type: Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },
    sub_category_id: {
      type: Schema.Types.ObjectId,
      ref: "admin_sub_categories",
      required: true,
    },
    original_price: { type: Number, required: true },
    selling_price: { type: Number, required: true },
    quantity: { type: Number, required: true },
    label_tags: { type: [String] }, // Changed to array of strings
    product_content: { type: String },
    product_specification: { type: String },
    brand: { type: String },
    colors: { type: String },
    images: { type: [String] }, // Already correct
    user_id: { type: Schema.Types.ObjectId, ref: "users" }, // Changed to ObjectId
    status: { type: Number, required: true },
  },
  { timestamps: true } // Auto-generates createdAt & updatedAt
);

const productModel = mongoose.model("Product", productSchema, "admin_products");
module.exports = productModel;
