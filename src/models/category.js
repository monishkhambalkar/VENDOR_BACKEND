const mongoose = require("mongoose");
mongoose.set("debug", true);
const Schema = mongoose.Schema;

const categorySchema = new Schema(
  {
    category_name: { type: String, required: true },
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
    }, // Reference to User
    status: { type: Number, required: true },
  },
  { timestamps: true } // Automatically creates createdAt & updatedAt
);

const category = mongoose.model("Category", categorySchema, "admin_categories");
module.exports = category;
