import asyncHandler from "express-async-handler";
import * as forgetPasswordService from "../services/forgetPasswordService.js";

export const sendResetCode = asyncHandler(async (req, res) => {
  const result = await forgetPasswordService.sendResetCode(req.body.email);
  res.status(200).json({
    message: "Reset code sent to your email",
  });
});

export const resendResetCode = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const result = await forgetPasswordService.resendResetCodeService(email);
  res.status(200).json({
    message: "Reset code resent successfully",
  });
});

export const verifyResetCode = asyncHandler(async (req, res) => {
  await forgetPasswordService.verifyResetCode(req.body.resetCode);
  res.status(200).json({
    message: "Reset code verified successfully",
  });
});

export const resetPassword = asyncHandler(async (req, res) => {
  const { email, newPassword } = req.body;
  const token = await forgetPasswordService.resetPassword(email, newPassword);
  res.status(200).json({
    message: "Password has been reset successfully",
    token,
  });
});
