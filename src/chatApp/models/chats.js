const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const ChatSchema = new Schema(
  {
    _id: { type: Schema.Types.ObjectId, auto: true }, // Auto-generates ObjectId
    chatName: { type: String, required: true },
    isGroupChat: { type: Boolean, default: false },
    participants: [
      { type: Schema.Types.ObjectId, ref: "Users", required: true },
    ], // Array of user ObjectIds
    lastMessage: { type: Schema.Types.ObjectId, ref: "Messages" }, // References a message document
  },
  { timestamps: true }
);

const chat = mongoose.model("Chat", ChatSchema, "chats");
module.exports = chat;
