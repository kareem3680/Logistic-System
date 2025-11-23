import asyncHandler from "express-async-handler";
import {
  getDriverLoadSummaryService,
  getTruckSummaryService,
  getAllTrucksSummaryService,
} from "../services/summaryService.js";

export const getDriverLoadSummary = asyncHandler(async (req, res) => {
  const summary = await getDriverLoadSummaryService(req);
  res.status(200).json({
    message: "📊 Driver load summary retrieved successfully",
    data: summary,
  });
});

export const getTruckSummary = asyncHandler(async (req, res, next) => {
  const data = await getTruckSummaryService(req);
  res.status(200).json({
    status: "success",
    message: "📊 Truck load summary retrieved successfully",
    data,
  });
});

export const getAllTrucksSummary = asyncHandler(async (req, res, next) => {
  const data = await getAllTrucksSummaryService(req);
  res.status(200).json({
    status: "success",
    message: "📊 Trucks load summary retrieved successfully",
    data,
  });
});
