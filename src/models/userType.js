const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const UserTypeSchema = new Schema({
  user_type: { type: Number, require: true },
  user_id: { type: Number, require: true },
  createdAt: { type: Date, required: false },
  updatedAt: { type: Date, required: false },
  status: { type: Number, required: true },
});

const userType = mongoose.model("admin_user_types", UserTypeSchema);
module.exports = userType;
