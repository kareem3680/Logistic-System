import mongoose from "mongoose";

const paletteSchema = new mongoose.Schema(
  {
    mode: {
      type: String,
    },
    customName: {
      type: String,
    },
    title: {
      type: String,
    },
    active: {
      type: Boolean,
      default: false,
    },
    background: {
      default: { type: String },
      paper: { type: String },
    },
    primary: {
      main: { type: String },
      contrastText: { type: String },
    },
    secondary: {
      main: { type: String },
      contrastText: { type: String },
    },
    text: {
      primary: { type: String },
      secondary: { type: String },
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
      index: true,
    },
  },
  { timestamps: true },
);

// Compound index for unique active palette per company
paletteSchema.index({ companyId: 1, active: 1 });

const paletteModel = mongoose.model("Palette", paletteSchema);

export default paletteModel;
