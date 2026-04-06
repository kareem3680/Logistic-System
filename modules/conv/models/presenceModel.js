import { Schema, model } from "mongoose";

const presenceSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      unique: true,
      required: true,
      index: true,
    },
    online: {
      type: Boolean,
      default: false,
      index: true,
    },
    lastSeen: {
      type: Date,
      index: true,
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

// Index for querying online users in a company
presenceSchema.index({ companyId: 1, online: 1, lastSeen: -1 });

export default model("Presence", presenceSchema);
