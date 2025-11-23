import mongoose, { Schema, model } from "mongoose";
import pkg from "mongoose-sequence";
const AutoIncrement = pkg(mongoose);

const driverSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, "Driver name is required"],
      minlength: [3, "Too short driver name"],
      maxlength: [30, "Too long driver name"],
      trim: true,
    },
    email: {
      type: String,
      lowercase: true,
      unique: [true, "Email must be unique"],
    },
    phone: {
      type: String,
      required: [true, "Phone number is required"],
    },
    licenseNumber: {
      type: String,
      required: [true, "License number is required"],
      unique: [true, "licenseNumber must be unique"],
    },
    status: {
      type: String,
      enum: ["available", "inactive", "busy"],
      default: "available",
    },
    pricePerMile: {
      type: Number,
      required: true,
      min: [0.01, "Price per mile must be positive"],
    },
    currency: {
      type: String,
      enum: ["USD", "EUR", "EGP", "GBP", "SAR"],
      default: "USD",
    },
    assignedTruck: {
      type: Schema.ObjectId,
      ref: "Truck",
    },
    driverId: {
      type: Number,
      unique: true,
    },
    hireDate: {
      type: Date,
      default: Date.now,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    user: {
      type: Schema.ObjectId,
      required: [true, "accountId is required"],
      ref: "User",
    },
  },
  { timestamps: true }
);

driverSchema.plugin(AutoIncrement, { inc_field: "driverId", start_seq: 500 });

const driverModel = model("Driver", driverSchema);

export default driverModel;
