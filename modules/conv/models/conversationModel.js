import { Schema, model } from "mongoose";

const conversationSchema = new Schema(
  {
    members: {
      type: [{ type: Schema.Types.ObjectId, ref: "User", required: true }],
      validate: {
        validator: function (v) {
          return v && v.length >= 2;
        },
        message: "Conversation must have at least 2 members",
      },
      index: true,
    },
    lastMessage: {
      text: String,
      sender: { type: Schema.Types.ObjectId, ref: "User" },
      createdAt: Date,
    },
    messageSequence: {
      type: Number,
      default: 0,
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

// Index for finding user's conversations in a company
conversationSchema.index({ members: 1, companyId: 1, updatedAt: -1 });

export default model("Conversation", conversationSchema);
