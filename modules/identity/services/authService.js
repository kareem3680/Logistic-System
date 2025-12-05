import { compare } from "bcryptjs";
import asyncHandler from "express-async-handler";

import sendEmail from "../../../utils/sendEmail.js";
import userModel from "../models/userModel.js";
import createToken from "../../../utils/createToken.js";
import { sanitizeUser } from "../../../utils/sanitizeData.js";
import { verifyToken } from "../../../utils/verifyToken.js";
import ApiError from "../../../utils/apiError.js";
import Logger from "../../../utils/loggerService.js";
const logger = new Logger("auth");

// Register user
export const registerUser = asyncHandler(async (userData, req) => {
  const existingUser = await userModel.findOne({ email: userData.email });
  if (existingUser) {
    await logger.error("Registration failed - email already exists", {
      email: userData.email,
    });
    throw new ApiError("🛑 Email already in use", 400);
  }

  const user = await userModel.create(userData);
  const token = createToken(user._id);

  sendEmail({
    email: user.email,
    subject: "Welcome to Styles Dispatch",
    message:
      "Your account has been successfully created!\nThank you for joining us.",
  }).catch((err) =>
    logger.error("Email sending failed", { error: err.message })
  );

  await logger.info("User registered successfully", { email: user.email });
  return { user: sanitizeUser(user), token };
});

// Login user
export const loginUser = asyncHandler(async (email, password) => {
  const user = await userModel.findOne({ email }).select("+password");
  if (!user) {
    await logger.error("Login failed - user not found", { email });
    throw new ApiError("🛑 Invalid email or password", 401);
  }

  if (user.active === false) {
    await logger.error("Login failed - account deactivated", { email });
    throw new ApiError(
      "🛑 Your account has been deactivated. Please contact support.",
      403
    );
  }

  const isMatch = await compare(password, user.password);
  if (!isMatch) {
    await logger.error("Login failed - incorrect password", { email });
    throw new ApiError("🛑 Invalid email or password", 401);
  }

  const token = createToken(user._id);
  await logger.info("User logged in successfully", { email });
  return { user: sanitizeUser(user), token };
});

// Protect route
export const protect = asyncHandler(async (req) => {
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  const user = await verifyToken(token);
  return user;
});

// Role-based authorization
export const allowedTo = asyncHandler(async (user, roles) => {
  if (!roles.includes(user.role)) {
    throw new ApiError("🚫 You are not authorized to access this route", 403);
  }
});
