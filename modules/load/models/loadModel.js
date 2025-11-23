import { Schema, model } from "mongoose";

const commentSchema = new Schema(
  {
    text: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ["dispatcher", "driver"],
      required: true,
    },
    addedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

const loadSchema = new Schema(
  {
    origin: {
      address: { type: String, required: true, trim: true },
    },

    DHO: {
      address: { type: String, required: true, trim: true },
    },

    destination: [
      {
        address: { type: String, required: true, trim: true },
      },
    ],

    pickupAt: {
      type: Date,
      required: [true, "pickupAt is required"],
    },

    completedAt: {
      type: Date,
      required: [true, "completedAt is required"],
    },

    arrivalAtShipper: {
      type: Date,
    },

    arrivalAtReceiver: {
      type: Date,
    },

    leftShipper: {
      type: Date,
    },

    leftReceiver: {
      type: Date,
    },

    deliveredAt: {
      type: Date,
    },

    cancelledAt: {
      type: Date,
    },

    documents: [
      {
        fileId: String,
        viewLink: String,
        downloadLink: String,
      },
    ],

    documentsForDriver: [
      {
        fileId: String,
        viewLink: String,
        downloadLink: String,
      },
    ],

    loadId: {
      type: String,
      unique: true,
      required: [true, "loadId is required"],
    },

    driverId: {
      type: Schema.Types.ObjectId,
      ref: "Driver",
      required: true,
    },

    truckId: {
      type: Schema.Types.ObjectId,
      ref: "Truck",
      required: true,
    },

    truckType: {
      type: String,
      required: [true, "Truck type is required"],
      enum: ["van", "reefer"],
      lowercase: true,
      trim: true,
    },

    truckTemp: {
      type: Number,
      default: null,
    },

    distanceMiles: {
      type: Number,
      required: true,
      min: [0, "Distance must be positive"],
    },

    pricePerMile: {
      type: Number,
      required: true,
      min: [0.01, "Price per mile must be positive"],
    },

    totalPrice: {
      type: Number,
      required: true,
      min: [0, "Total price must be positive"],
    },

    currency: {
      type: String,
      enum: ["USD", "EUR", "EGP", "GBP", "SAR"],
      default: "USD",
    },

    feesNumber: {
      type: String,
    },

    status: {
      type: String,
      enum: ["pending", "in_transit", "delivered", "cancelled"],
      default: "pending",
    },

    comments: [commentSchema],

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

commentSchema.index({ createdAt: -1 });

const LoadModel = model("Load", loadSchema);

export default LoadModel;
