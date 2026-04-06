import mongoose, { Schema, model } from "mongoose";
import pkg from "mongoose-sequence";
const AutoIncrement = pkg(mongoose);

const driverSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 3,
      maxlength: 30,
    },
    email: { type: String, lowercase: true, unique: true },
    phone: { type: String, required: true },
    licenseNumber: { type: String, required: true, unique: true },
    status: {
      type: String,
      enum: ["available", "inactive", "busy"],
      default: "available",
    },
    toggle: { type: Boolean, default: false },
    pricePerMile: { type: Number, required: true, min: 0.01 },
    currency: {
      type: String,
      enum: ["USD", "EUR", "EGP", "GBP", "SAR"],
      default: "USD",
    },
    documents: [
      {
        fileId: String,
        viewLink: String,
        downloadLink: String,
        uploadedAt: Date,
      },
    ],
    assignedTruck: { type: Schema.Types.ObjectId, ref: "Truck" },
    driverId: { type: Number, unique: true },
    hireDate: { type: Date, default: Date.now },
    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
    updatedBy: { type: Schema.Types.ObjectId, ref: "User" },
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    companyId: { type: Schema.Types.ObjectId, ref: "Company", required: true },
  },
  { timestamps: true },
);

driverSchema.plugin(AutoIncrement, { inc_field: "driverId", start_seq: 500 });

const driverModel = model("Driver", driverSchema);
export default driverModel;
