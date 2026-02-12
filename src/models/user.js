const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const loginSchema = new Schema({
  username: { type: String, required: true, lowercase: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: false },
  user_type: { type: String, required: false },
  refreshToken: { type: String },
  createdAt: {
    type: Date,
    required: false,
  },
  updatedAt: { type: Date, required: false },
  status: { type: Number, required: true },
});

const user = mongoose.model("admin_user_logins", loginSchema);
module.exports = user;
