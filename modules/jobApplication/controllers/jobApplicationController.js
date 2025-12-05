import asyncHandler from "express-async-handler";
import {
  createJobApplicationService,
  getAllJobApplicationsService,
  updateJobApplicationStatusService,
} from "../services/jobApplicationService.js";

export const createJobApplication = asyncHandler(async (req, res) => {
  const app = await createJobApplicationService(req);
  res.status(201).json({
    message: "Application submitted successfully",
    data: app,
  });
});

export const getAllJobApplications = asyncHandler(async (req, res) => {
  const result = await getAllJobApplicationsService(req);
  res.status(200).json({
    message: "Job applications retrieved successfully",
    results: result.results,
    data: result.data,
    paginationResult: result.paginationResult,
  });
});

export const updateJobApplicationStatus = asyncHandler(async (req, res) => {
  const updated = await updateJobApplicationStatusService(req);
  res.status(200).json({
    message: "Application status updated successfully",
    data: updated,
  });
});
