import { hash } from "bcryptjs";
import mongoose, { Schema, model } from "mongoose";
import pkg from "mongoose-sequence";
const AutoIncrement = pkg(mongoose);

const userSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, "name is required"],
      minlength: [3, "Too short name"],
      maxlength: [30, "Too long name"],
    },
    email: {
      type: String,
      required: [true, "email is required"],
      unique: [true, "email must be unique"],
      lowercase: true,
    },
    phone: {
      type: String,
    },
    password: {
      type: String,
      minlength: [5, "Password must be at least 5 character"],
    },
    changedPasswordAt: {
      type: Date,
    },
    passwordResetCode: {
      type: String,
    },
    passwordResetCodeExpiresAt: {
      type: Date,
    },
    passwordResetCodeVerified: {
      type: Boolean,
    },
    lastResetCodeSentAt: { type: Date },
    resetCodeRequests: { type: [Date], default: [] },
    active: {
      type: Boolean,
      default: true,
    },
    role: {
      type: String,
      enum: ["admin", "employee", "driver"],
      default: "employee",
    },
    position: {
      type: String,
    },
    jobId: {
      type: Number,
      unique: true,
    },
    hireDate: {
      type: Date,
      default: Date.now,
    },
    fcmTokens: {
      type: [String],
      default: [],
    },
  },
  { timestamps: true }
);

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await hash(this.password, 8);
  next();
});

userSchema.plugin(AutoIncrement, { inc_field: "jobId", start_seq: 100 });

const userModel = model("User", userSchema);

export default userModel;
