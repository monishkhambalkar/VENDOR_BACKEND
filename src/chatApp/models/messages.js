const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const MessageSchema = new Schema(
  {
    _id: { type: Schema.Types.ObjectId, auto: true }, // Auto-generates ObjectId
    chatId: { type: Schema.Types.ObjectId, ref: "Chat", required: true }, // References a Chat
    senderId: { type: Schema.Types.ObjectId, ref: "Users", required: true }, // References a User
    messageType: {
      type: String,
      enum: ["text", "image", "video", "audio", "pdf", "document"],
      required: true,
    }, // Restricts values to valid types
    content: { type: String }, // Used when messageType is "text"
    file: {
      type: {
        type: String,
        enum: ["image", "video", "audio", "pdf", "document"],
      },
      url: { type: String }, // File URL
      size: { type: Number }, // File size in bytes
      mimeType: { type: String }, // MIME type of the file
    },
  },
  { timestamps: true }
);

const message = mongoose.model("Message", MessageSchema, "messages");
module.exports = message;
