import mongoose, { Schema } from "mongoose";

const maintenanceSchema = new Schema(
  {
    statusPerTruck: [
      {
        truck: {
          type: Schema.Types.ObjectId,
          ref: "Truck",
          required: true,
        },
        status: {
          type: String,
          enum: ["upcoming", "overdue"],
          default: "upcoming",
        },
        nextDueDate: { type: Date, default: null },
        nextDueMile: { type: Number, default: null },
        lastDoneAt: { type: Date, default: null },
        lastDoneMile: { type: Number, default: null },
        lastReminderAt: { type: Date, default: null },
        lastReminderMile: { type: Number, default: null },
      },
    ],

    type: { type: String, required: true, trim: true },
    description: String,

    repeatBy: { type: String, enum: ["time", "mile"] },
    intervalDays: { type: Number, default: null },
    remindBeforeDays: { type: Number, default: null },

    intervalMile: { type: Number, default: null },
    remindBeforeMile: { type: Number, default: null },

    cost: { type: Number, default: 0 },
    notes: { type: String, trim: true },

    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
    updatedBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

const Maintenance = mongoose.model("Maintenance", maintenanceSchema);

export default Maintenance;
