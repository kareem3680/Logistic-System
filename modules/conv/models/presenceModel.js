import { Schema, model } from "mongoose";

const presenceSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", unique: true },
    online: { type: Boolean, default: false },
    socketId: { type: String },
    lastSeen: { type: Date },
  },
  { timestamps: true }
);

export default model("Presence", presenceSchema);
