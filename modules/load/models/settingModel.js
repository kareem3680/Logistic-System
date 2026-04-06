import { Schema, model } from "mongoose";

const settingSchema = new Schema(
  {
    key: {
      type: String,
      required: true,
      trim: true,
    },
    value: {
      type: Number,
      required: true,
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

// Compound unique index: each key must be unique per company
settingSchema.index({ key: 1, companyId: 1 }, { unique: true });

const SettingModel = model("Setting", settingSchema);

export default SettingModel;
