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
  },
  { timestamps: true }
);

const paletteModel = mongoose.model("Palette", paletteSchema);

export default paletteModel;
