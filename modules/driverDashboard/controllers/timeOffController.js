import asyncHandler from "express-async-handler";
import {
  createTimeOffService,
  getAllTimeOffService,
  getMyTimeOffService,
  updateTimeOffStatusService,
  cancelTimeOffService,
} from "../services/timeOffService.js";

export const createTimeOff = asyncHandler(async (req, res) => {
  const timeOff = await createTimeOffService(req);

  res.status(201).json({
    message: "TimeOff request created successfully",
    data: timeOff,
  });
});

export const getAllTimeOff = asyncHandler(async (req, res) => {
  const result = await getAllTimeOffService(req);

  res.status(200).json({
    message: result.message,
    stats: result.stats,
    results: result.results,
    data: result.data,
    paginationResult: result.paginationResult,
  });
});

export const getMyTimeOff = asyncHandler(async (req, res) => {
  const result = await getMyTimeOffService(req);

  res.status(200).json({
    message: result.message,
    results: result.results,
    data: result.data,
    paginationResult: result.paginationResult,
  });
});

export const updateTimeOffStatus = asyncHandler(async (req, res) => {
  const timeOff = await updateTimeOffStatusService(req);

  res.status(200).json({
    message: `TimeOff request ${timeOff.status} successfully`,
    data: timeOff,
  });
});

export const cancelTimeOff = asyncHandler(async (req, res) => {
  const timeOff = await cancelTimeOffService(req);

  res.status(200).json({
    message: "TimeOff request cancelled successfully",
    data: timeOff,
  });
});
