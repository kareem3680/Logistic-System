import mongoose, { Schema } from "mongoose";

const serviceCenterSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: [3, "Name must be at least 3 characters"],
      maxlength: [100, "Name cannot exceed 100 characters"],
    },

    city: {
      type: String,
      required: true,
      trim: true,
      minlength: [2, "City must be at least 2 characters"],
      maxlength: [50, "City cannot exceed 50 characters"],
    },

    state: {
      type: String,
      required: true,
      trim: true,
      minlength: [2, "State must be at least 2 characters"],
      maxlength: [50, "State cannot exceed 50 characters"],
    },

    address: {
      type: String,
      trim: true,
      minlength: [5, "Address must be at least 5 characters"],
      maxlength: [200, "Address cannot exceed 200 characters"],
    },

    location: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },
      coordinates: {
        type: [Number],
        required: true,
      },
    },

    phone: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      trim: true,
    },

    active: {
      type: Boolean,
      default: true,
    },

    availability: {
      type: String,
      trim: true,
      maxlength: [200, "Availability text cannot exceed 200 characters"],
    },

    services: {
      type: [String],
      default: [],
    },

    notes: {
      type: String,
      trim: true,
      maxlength: [500, "Notes cannot exceed 500 characters"],
    },

    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },

    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
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

// Indexes for better query performance
serviceCenterSchema.index({ name: 1, companyId: 1 });
serviceCenterSchema.index({ city: 1, state: 1, companyId: 1 });
serviceCenterSchema.index({ active: 1, companyId: 1 });
serviceCenterSchema.index({ services: 1, companyId: 1 });
serviceCenterSchema.index({ location: "2dsphere" });

const ServiceCenter = mongoose.model("ServiceCenter", serviceCenterSchema);

export default ServiceCenter;
