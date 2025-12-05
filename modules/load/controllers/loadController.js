import asyncHandler from "express-async-handler";
import {
  createLoadService,
  updateLoadService,
  updateLoadStatusService,
  getAllLoadsService,
} from "../services/loadService.js";

export const createLoad = asyncHandler(async (req, res) => {
  const load = await createLoadService(req);

  res.status(201).json({
    message: "Load created successfully",
    data: load,
  });
});

export const updateLoadController = asyncHandler(async (req, res, next) => {
  const updatedLoad = await updateLoadService(req);
  res.status(200).json({
    message: "Load updated successfully",
    status: "success",
    data: updatedLoad,
  });
});

export const updateLoadStatus = asyncHandler(async (req, res) => {
  const updatedLoad = await updateLoadStatusService(req);

  res.status(200).json({
    message: "Load status updated successfully",
    data: updatedLoad,
  });
});

export const getAllLoads = asyncHandler(async (req, res) => {
  const result = await getAllLoadsService(req);

  res.status(200).json({
    message: "Loads retrieved successfully",
    stats: result.stats,
    data: result.data,
    results: result.results,
    paginationResult: result.paginationResult,
  });
});
