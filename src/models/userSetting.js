const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const userSchema = new Schema({
  full_name: { type: String, required: true },
  mobile: { type: Number, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  city: { type: String, required: false },
  state: { type: String, required: false },
  country: { type: String, required: false },
  address: { type: String, required: false },
  company_name: { type: String, required: false },
  gst_number: { type: String, required: false },
  bank_account: { type: Number, required: false },
  pickup_address: { type: String, required: false },
  images: { type: [String], required: false },
  user_id: { type: String, required: false },
  createdAt: { type: Date, required: false },
  updatedAt: { type: Date, required: false },
  status: { type: Number, required: true },
});

const userSetting = mongoose.model("admin_user_profile", userSchema);
module.exports = userSetting;
