import asyncHandler from "express-async-handler";
import {
  createServiceCenterService,
  getAllServiceCentersService,
  getServiceCenterByIdService,
  updateServiceCenterService,
  deleteServiceCenterService,
  getServiceCentersStatsService,
} from "../services/serviceCenterService.js";

// -----------------------------
// Create Service Center
// -----------------------------
export const createServiceCenter = asyncHandler(async (req, res) => {
  const serviceCenter = await createServiceCenterService(
    req.body,
    req.user._id,
    req.companyId,
    req.user.role,
  );

  res.status(201).json({
    status: "success",
    data: serviceCenter,
  });
});

// -----------------------------
// Get All Service Centers
// -----------------------------
export const getServiceCenters = asyncHandler(async (req, res) => {
  const result = await getAllServiceCentersService(
    req,
    req.companyId,
    req.user.role,
  );

  res.status(200).json({
    status: "success",
    results: result.results,
    stats: result.stats,
    data: result.data,
    paginationResult: result.paginationResult,
  });
});

// -----------------------------
// Get Single Service Center
// -----------------------------
export const getServiceCenter = asyncHandler(async (req, res) => {
  const serviceCenter = await getServiceCenterByIdService(
    req.params.id,
    req.companyId,
    req.user.role,
  );

  res.status(200).json({
    status: "success",
    data: serviceCenter,
  });
});

// -----------------------------
// Update Service Center
// -----------------------------
export const updateServiceCenter = asyncHandler(async (req, res) => {
  const serviceCenter = await updateServiceCenterService(
    req.params.id,
    req.body,
    req.user._id,
    req.companyId,
    req.user.role,
  );

  res.status(200).json({
    status: "success",
    data: serviceCenter,
  });
});

// -----------------------------
// Delete Service Center
// -----------------------------
export const deleteServiceCenter = asyncHandler(async (req, res) => {
  await deleteServiceCenterService(req.params.id, req.companyId, req.user.role);

  res.status(204).send();
});

// -----------------------------
// Get Service Centers Stats
// -----------------------------
export const getServiceCentersStats = asyncHandler(async (req, res) => {
  const stats = await getServiceCentersStatsService(
    req.companyId,
    req.user.role,
  );

  res.status(200).json({
    status: "success",
    data: stats,
  });
});
