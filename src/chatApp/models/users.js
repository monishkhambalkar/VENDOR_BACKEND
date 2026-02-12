const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const UsersSchema = new Schema({
  _id: { type: Schema.Types.ObjectId, auto: true }, // Auto-generates ObjectId
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  profilePicture: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});
const user = mongoose.model("Users", UsersSchema, "chat_user");
module.exports = user;
