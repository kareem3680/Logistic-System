import asyncHandler from "express-async-handler";
import {
  createMaintenanceService,
  getAllMaintenancesService,
  getMaintenanceByIdService,
  updateMaintenanceService,
  deleteMaintenanceService,
} from "../services/maintenanceService.js";

// -----------------------------
// Create Maintenance
// -----------------------------
export const createMaintenance = asyncHandler(async (req, res) => {
  const maintenance = await createMaintenanceService(req.body, req.user._id);

  res.status(201).json({
    status: "success",
    data: maintenance,
  });
});

// -----------------------------
// Get All Maintenances
// -----------------------------
export const getMaintenances = asyncHandler(async (req, res) => {
  const result = await getAllMaintenancesService(req);

  res.status(200).json({
    status: "success",
    results: result.results,
    stats: result.stats,
    data: result.data,
    paginationResult: result.paginationResult,
  });
});

// -----------------------------
// Get Single Maintenance
// -----------------------------
export const getMaintenance = asyncHandler(async (req, res) => {
  const maintenance = await getMaintenanceByIdService(req.params.id);

  res.status(200).json({
    status: "success",
    data: maintenance,
  });
});

// -----------------------------
// Update Maintenance
// -----------------------------
export const updateMaintenance = asyncHandler(async (req, res) => {
  const maintenance = await updateMaintenanceService(
    req.params.id,
    req.body,
    req.user._id
  );

  res.status(200).json({
    status: "success",
    data: maintenance,
  });
});

// -----------------------------
// Delete Maintenance
// -----------------------------
export const deleteMaintenance = asyncHandler(async (req, res) => {
  await deleteMaintenanceService(req.params.id);

  res.status(204).send();
});
