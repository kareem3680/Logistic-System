import mongoose, { Schema, model, Types } from "mongoose";
import pkg from "mongoose-sequence";
const AutoIncrement = pkg(mongoose);

const timeOffSchema = new Schema(
  {
    requestId: {
      type: Number,
      unique: true,
    },
    driver: {
      type: Types.ObjectId,
      ref: "Driver",
      required: true,
    },
    from: {
      type: Date,
      required: true,
    },
    to: {
      type: Date,
      required: true,
    },
    reason: {
      type: String,
      trim: true,
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "cancelled"],
      default: "pending",
    },
    approvedBy: {
      type: Types.ObjectId,
      ref: "User",
    },
    rejectedBy: {
      type: Types.ObjectId,
      ref: "User",
    },
    adminNote: {
      type: String,
      trim: true,
    },
    cancelledAt: {
      type: Date,
    },
    companyId: {
      type: Types.ObjectId,
      ref: "Company",
      required: true,
      index: true,
    },
  },
  { timestamps: true },
);

timeOffSchema.plugin(AutoIncrement, { inc_field: "requestId", start_seq: 100 });

// Compound indexes
timeOffSchema.index({ companyId: 1, driver: 1 });
timeOffSchema.index({ companyId: 1, status: 1 });
timeOffSchema.index({ companyId: 1, from: 1, to: 1 });

const timeOffModel = model("TimeOff", timeOffSchema);

export default timeOffModel;
