import asyncHandler from "express-async-handler";
import { getDriverPaycheckService } from "../services/payCheckService.js";

export const getDriverPaycheck = asyncHandler(async (req, res) => {
  const paycheck = await getDriverPaycheckService(req);
  res.status(200).json({
    message: "Driver paycheck retrieved successfully",
    data: paycheck,
  });
});
