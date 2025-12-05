import asyncHandler from "express-async-handler";
import {
  getAllDriversService,
  getDriverByIdService,
  createDriverService,
  updateDriverService,
  deleteDriverService,
} from "../services/driverService.js";

export const getDrivers = asyncHandler(async (req, res) => {
  const drivers = await getAllDriversService(req);
  res.status(200).json({
    message: "Drivers fetched successfully",
    stats: drivers.stats,
    data: drivers.data,
    results: drivers.results,
    paginationResult: drivers.paginationResult,
  });
});

export const getDriver = asyncHandler(async (req, res) => {
  const driver = await getDriverByIdService(req.params.id);
  res.status(200).json({
    message: "Driver fetched successfully",
    data: driver,
  });
});

export const createDriver = asyncHandler(async (req, res) => {
  const driver = await createDriverService(req.body, req.user._id);
  res.status(201).json({
    message: "Driver created successfully",
    data: driver,
  });
});

export const updateDriver = asyncHandler(async (req, res) => {
  const driver = await updateDriverService(
    req.params.id,
    req.body,
    req.user._id
  );
  res.status(200).json({
    message: "Driver updated successfully",
    data: driver,
  });
});

export const deleteDriver = asyncHandler(async (req, res) => {
  const driver = await deleteDriverService(req.params.id, req.user._id);
  res.status(200).json({
    message: "Driver deleted successfully",
    data: driver,
  });
});
