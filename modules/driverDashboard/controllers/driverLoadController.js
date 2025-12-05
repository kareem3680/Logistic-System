import asyncHandler from "express-async-handler";
import {
  getAllLoadsService,
  addDriverDocumentsService,
} from "../services/driverLoadService.js";

export const getAllLoads = asyncHandler(async (req, res) => {
  const result = await getAllLoadsService(req);

  res.status(200).json({
    message: "Loads retrieved successfully",
    results: result.results,
    period: result.period,
    data: result.data,
    paginationResult: result.paginationResult,
  });
});

export const addDriverDocuments = asyncHandler(async (req, res) => {
  const result = await addDriverDocumentsService(req);
  res.status(200).json({
    message: "Driver documents uploaded successfully",
    data: result,
  });
});
