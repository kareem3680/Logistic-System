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
      enum: [
        "system",
        "loads",
        "trucks",
        "drivers",
        "identity",
        "maintenance",
        "chat",
        "service-center",
      ],
      default: "system",
    },
    importance: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "low",
    },
    from: {
      type: Schema.ObjectId,
      ref: "User",
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
    companyId: {
      type: Schema.Types.ObjectId,
      ref: "Company",
      required: true,
      index: true,
    },
  },
  { timestamps: true },
);

const notificationModel = model("Notification", notificationSchema);

export default notificationModel;
