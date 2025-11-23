import { Schema, model } from "mongoose";

const settingSchema = new Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    value: {
      type: Number,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const SettingModel = model("Setting", settingSchema);

export default SettingModel;
