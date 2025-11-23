import asyncHandler from "express-async-handler";
import {
  getAllTrucksService,
  getTruckByIdService,
  createTruckService,
  updateTruckService,
  deleteTruckService,
} from "../services/truckService.js";

export const getTrucks = asyncHandler(async (req, res) => {
  const trucks = await getAllTrucksService(req);
  res.status(200).json({
    message: "📦 Trucks fetched successfully",
    stats: trucks.stats,
    data: trucks.data,
    results: trucks.length,
    paginationResult: trucks.paginationResult,
  });
});

export const getTruck = asyncHandler(async (req, res) => {
  const truck = await getTruckByIdService(req.params.id);
  res.status(200).json({
    message: "🔎 Truck fetched successfully",
    data: truck,
  });
});

export const createTruck = asyncHandler(async (req, res) => {
  const truck = await createTruckService(req.body, req.user._id);
  res.status(201).json({
    message: "🆕 Truck created successfully",
    data: truck,
  });
});

export const updateTruck = asyncHandler(async (req, res) => {
  const truck = await updateTruckService(req.params.id, req.body, req.user._id);
  res.status(200).json({
    message: "✏️ Truck updated successfully",
    data: truck,
  });
});

export const deleteTruck = asyncHandler(async (req, res) => {
  const truck = await deleteTruckService(req.params.id, req.user._id);
  res.status(200).json({
    message: "🗑️ Truck deleted successfully",
    data: truck,
  });
});
