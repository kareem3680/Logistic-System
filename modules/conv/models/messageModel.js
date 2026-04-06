import { Schema, model } from "mongoose";

const messageSchema = new Schema(
  {
    conversationId: {
      type: Schema.Types.ObjectId,
      ref: "Conversation",
      required: true,
      index: true,
    },
    sender: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    text: {
      type: String,
      required: true,
      maxlength: 10000,
    },
    seen: {
      type: Boolean,
      default: false,
      index: true,
    },
    sequenceNumber: {
      type: Number,
      required: true,
    },
    companyId: {
      type: Schema.Types.ObjectId,
      ref: "Company",
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
  },
);

// Compound index for ordering messages by sequence
messageSchema.index(
  { conversationId: 1, sequenceNumber: 1, companyId: 1 },
  { unique: true },
);

// Index for seen status queries
messageSchema.index({ conversationId: 1, seen: 1, sender: 1, companyId: 1 });

export default model("Message", messageSchema);
