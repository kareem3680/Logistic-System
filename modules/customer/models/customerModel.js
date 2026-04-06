import mongoose, { Schema, model } from "mongoose";
import pkg from "mongoose-sequence";
const AutoIncrement = pkg(mongoose);

const customerSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, "Customer name is required"],
      minlength: [3, "Too short customer name"],
      maxlength: [50, "Too long customer name"],
      trim: true,
    },
    phone: {
      type: String,
      required: [true, "Phone number is required"],
      trim: true,
    },
    email: {
      type: String,
      lowercase: true,
      unique: [true, "Email must be unique"],
      sparse: true,
    },
    address: {
      type: String,
      required: [true, "address is required"],
    },
    type: {
      type: String,
      enum: ["shipper", "receiver"],
      required: [true, "Customer type is required"],
    },
    feedback: {
      type: String,
      maxlength: [300, "Feedback too long"],
    },
    customerId: {
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
    companyId: {
      type: Schema.Types.ObjectId,
      ref: "Company",
      required: true,
    },
  },
  { timestamps: true },
);

customerSchema.plugin(AutoIncrement, {
  inc_field: "customerId",
  start_seq: 1000,
});

const customerModel = model("Customer", customerSchema);

export default customerModel;
