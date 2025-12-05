import mongoose, { Schema, model as _model } from "mongoose";
import pkg from "mongoose-sequence";
const AutoIncrement = pkg(mongoose);

const truckSchema = new Schema(
  {
    plateNumber: {
      type: String,
      required: [true, "Truck plate number is required"],
      unique: true,
      trim: true,
    },
    model: {
      type: String,
      required: [true, "Truck model is required"],
      trim: true,
    },
    source: {
      type: String,
      required: [true, "Truck source is required"],
      enum: ["company", "other"],
      lowercase: true,
      trim: true,
    },
    type: {
      type: String,
      required: [true, "Truck type is required"],
      enum: ["van", "reefer"],
      lowercase: true,
      trim: true,
    },
    year: {
      type: Number,
      required: [true, "Truck manufacturing year is required"],
      min: [2010, "Year must be after 2010"],
      max: [
        new Date().getFullYear() + 1,
        "Year must be a between 2010 and next year",
      ],
    },
    capacity: {
      type: Number,
      required: [true, "Truck capacity is required"],
    },

    fuelPerMile: {
      type: Number,
      required: [true, "fuelPerMile is required"],
    },

    totalMileage: {
      type: Number,
      default: 0,
    },

    status: {
      type: String,
      enum: ["available", "inactive", "busy"],
      default: "available",
    },
    assignedDriver: {
      type: Schema.Types.ObjectId,
      ref: "Driver",
    },
    truckId: {
      type: Number,
      unique: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

truckSchema.plugin(AutoIncrement, { inc_field: "truckId", start_seq: 1000 });

const TruckModel = _model("Truck", truckSchema);

export default TruckModel;
