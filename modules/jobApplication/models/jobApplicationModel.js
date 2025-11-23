import { Schema, model } from "mongoose";

const jobApplicationSchema = new Schema(
  {
    fullName: {
      type: String,
      required: [true, "Full name is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      lowercase: true,
      trim: true,
    },
    phone: {
      type: String,
      required: [true, "Phone number is required"],
      trim: true,
    },
    jobTitle: {
      type: String,
      required: [true, "Job title is required"],
      trim: true,
    },
    location: {
      type: String,
      required: [true, "Location is required"],
      trim: true,
    },
    experienceYears: {
      type: Number,
      default: 0,
      min: [0, "Experience years cannot be negative"],
    },
    skills: {
      type: [String],
      default: [],
    },
    cvLink: {
      type: String,
      required: [true, "CV Google Drive link is required"],
      trim: true,
    },
    notes: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ["pending", "reviewed", "accepted", "rejected"],
      default: "pending",
    },
    reviewedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

const JobApplicationModel = model("JobApplication", jobApplicationSchema);
export default JobApplicationModel;
