import asyncHandler from "express-async-handler";

import { updateMyPasswordService } from "../services/updatePasswordService.js";

export const updateMyPassword = asyncHandler(async (req, res, next) => {
  const { currentPassword, newPassword } = req.body;
  const userId = req.user._id;

  const { user, token } = await updateMyPasswordService(
    userId,
    currentPassword,
    newPassword
  );

  res.status(200).json({
    status: "success",
    message: "Password updated successfully",
    data: user,
    token,
  });
});
