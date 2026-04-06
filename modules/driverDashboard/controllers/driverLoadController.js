import asyncHandler from "express-async-handler";
import {
  getAllLoadsService,
  addDriverDocumentsService,
  updateLoadAppointmentService,
} from "../services/driverLoadService.js";

export const getAllLoads = asyncHandler(async (req, res) => {
  const result = await getAllLoadsService(req, req.companyId, req.user.role);

  res.status(200).json({
    message: "Loads retrieved successfully",
    results: result.results,
    period: result.period,
    data: result.data,
    paginationResult: result.paginationResult,
  });
});

export const addDriverDocuments = asyncHandler(async (req, res) => {
  const result = await addDriverDocumentsService(
    req,
    req.companyId,
    req.user.role,
  );

  res.status(200).json({
    message: "Driver documents uploaded successfully",
    status: "success",
    data: result,
  });
});

export const updateLoadAppointment = asyncHandler(async (req, res) => {
  await updateLoadAppointmentService(req, req.companyId, req.user.role);

  res.status(200).json({
    message: "Load appointment updated successfully",
    status: "success",
  });
});
