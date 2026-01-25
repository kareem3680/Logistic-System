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
  },
  {
    timestamps: true,
  }
);

// Index for finding user's conversations
conversationSchema.index({ members: 1, updatedAt: -1 });

export default model("Conversation", conversationSchema);
