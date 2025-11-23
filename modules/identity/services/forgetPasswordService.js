import crypto from "crypto";
import asyncHandler from "express-async-handler";

import Logger from "../../../utils/loggerService.js";
import userModel from "../models/userModel.js";
import createToken from "../../../utils/createToken.js";
import sendEmail from "../../../utils/sendEmail.js";
import ApiError from "../../../utils/apiError.js";

const logger = new Logger("forget-password");

export const sendResetCode = asyncHandler(async (email) => {
  const user = await userModel.findOne({ email });
  if (!user) {
    await logger.error("User not found", { email });
    throw new ApiError(`🛑 No user found with this email: ${email}`, 404);
  }

  const now = Date.now();
  const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
  const hashed = crypto.createHash("sha256").update(resetCode).digest("hex");

  user.passwordResetCode = hashed;
  user.passwordResetCodeExpiresAt = Date.now() + 10 * 60 * 1000;
  user.passwordResetCodeVerified = false;
  user.lastResetCodeSentAt = now;
  user.resetCodeRequests.push(now);

  await user.save();

  try {
    await sendEmail({
      email: user.email,
      subject: "Reset your password",
      message: `Hello ${user.name}, your reset code is ${resetCode}. It expires in 10 minutes.`,
    });

    await logger.info("Reset code sent successfully", { email });
    return { email: user.email };
  } catch (err) {
    user.passwordResetCode = undefined;
    user.passwordResetCodeExpiresAt = undefined;
    user.passwordResetCodeVerified = undefined;
    await user.save();

    await logger.error("Failed to send reset email", { email });
    throw new ApiError("🛑 Failed to send reset email", 500);
  }
});

export const resendResetCodeService = asyncHandler(async (email) => {
  const user = await userModel.findOne({ email });
  if (!user) {
    await logger.error("User not found", { email });
    throw new ApiError(`🛑 No user found with this email: ${email}`, 404);
  }

  const now = Date.now();

  if (!user.passwordResetCode || !user.passwordResetCodeExpiresAt) {
    throw new ApiError(
      "⚠️ You haven’t requested a reset code yet. Please request a code first.",
      400
    );
  }

  if (
    user.lastResetCodeSentAt &&
    now - user.lastResetCodeSentAt < 2 * 60 * 1000
  ) {
    const wait = Math.ceil(
      (2 * 60 * 1000 - (now - user.lastResetCodeSentAt)) / 1000
    );
    throw new ApiError(
      `⏳ Please wait ${wait} seconds before requesting a new code`,
      429
    );
  }

  const oneHourAgo = now - 60 * 60 * 1000;
  user.resetCodeRequests =
    user.resetCodeRequests?.filter((t) => t > oneHourAgo) || [];

  if (user.resetCodeRequests.length >= 5) {
    throw new ApiError(
      "🚫 You have reached the limit reset code requests, try again later",
      429
    );
  }

  const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
  const hashed = crypto.createHash("sha256").update(resetCode).digest("hex");

  user.passwordResetCode = hashed;
  user.passwordResetCodeExpiresAt = now + 10 * 60 * 1000;
  user.passwordResetCodeVerified = false;
  user.lastResetCodeSentAt = now;
  user.resetCodeRequests.push(now);

  await user.save();

  try {
    await sendEmail({
      email: user.email,
      subject: "Reset your password (Resent Code)",
      message: `Hello ${user.name}, your new reset code is ${resetCode}. It expires in 10 minutes.`,
    });

    await logger.info("Reset code resent successfully", { email });
    return { email: user.email };
  } catch (err) {
    await logger.error("Failed to resend reset email", {
      email,
      error: err.message,
    });
    throw new ApiError("🛑 Failed to resend reset email", 500);
  }
});

export const verifyResetCode = asyncHandler(async (code) => {
  const hashed = crypto.createHash("sha256").update(code).digest("hex");

  const user = await userModel.findOne({
    passwordResetCode: hashed,
    passwordResetCodeExpiresAt: { $gt: Date.now() },
  });

  if (!user) {
    await logger.error("Invalid or expired reset code");
    throw new ApiError("🛑 Invalid or expired reset code", 401);
  }

  user.passwordResetCodeVerified = true;
  await user.save();

  await logger.info("Reset code verified successfully", { email: user.email });
});

export const resetPassword = asyncHandler(async (email, newPassword) => {
  const user = await userModel.findOne({ email });
  if (!user) {
    await logger.error("User not found during password reset", { email });
    throw new ApiError(`🛑 No user found with this email: ${email}`, 404);
  }

  if (!user.passwordResetCodeVerified) {
    await logger.error("Reset code not verified", { email });
    throw new ApiError("🛑 Reset code is not verified", 400);
  }

  user.password = newPassword;
  user.passwordResetCode = undefined;
  user.passwordResetCodeExpiresAt = undefined;
  user.passwordResetCodeVerified = undefined;
  await user.save();

  const token = createToken(user._id);
  await logger.info("Password reset successful", { email });

  return token;
});
