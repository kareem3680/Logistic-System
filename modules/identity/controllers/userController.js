import asyncHandler from "express-async-handler";

import {
  getMyDataService,
  updateMyDataService,
} from "../services/userService.js";

export const getMyData = asyncHandler(async (req, res) => {
  const user = await getMyDataService(req.user._id);
  res.status(200).json({
    status: "success",
    message: "User data retrieved successfully",
    data: user,
  });
});

export const updateMyData = asyncHandler(async (req, res) => {
  const updatedUser = await updateMyDataService(req.user._id, req.body);
  res.status(200).json({
    status: "success",
    message: "User data updated successfully",
    data: updatedUser,
  });
});
