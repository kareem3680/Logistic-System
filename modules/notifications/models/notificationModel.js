import { Schema, model } from "mongoose";

const notificationSchema = new Schema(
  {
    title: {
      type: String,
      required: [true, "Notification title is required"],
      trim: true,
    },
    refId: {
      type: Schema.ObjectId,
    },
    message: {
      type: String,
      required: [true, "Notification message is required"],
    },
    module: {
      type: String,
      enum: ["system", "loads", "trucks", "drivers", "identity"],
      default: "system",
    },
    importance: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "low",
    },
    from: {
      type: String,
      default: "system",
    },
    toRole: {
      type: [String],
    },
    toUser: {
      type: [Schema.ObjectId],
      ref: "User",
    },
    status: {
      type: String,
      enum: ["unread", "read"],
      default: "unread",
    },
  },
  { timestamps: true }
);

const notificationModel = model("Notification", notificationSchema);

export default notificationModel;
