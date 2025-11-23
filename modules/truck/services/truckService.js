import asyncHandler from "express-async-handler";

import truckModel from "../models/truckModel.js";
import driverModel from "../../driver/models/driverModel.js";
import { sanitizeTruck } from "../../../utils/sanitizeData.js";
import ApiError from "../../../utils/apiError.js";
import Logger from "../../../utils/loggerService.js";
const logger = new Logger("truck");

import {
  createService,
  getAllService,
  getSpecificService,
  updateService,
  deleteService,
} from "../../../utils/servicesHandler.js";

import { cacheWrapper, delCache } from "../../../utils/cache.js";

// helper: check driver exists
const checkDriverExists = async (driverId) => {
  const driver = await driverModel.findById(driverId);
  if (!driver) {
    await logger.error("Truck operation failed - driver not found", {
      driverId,
    });
    throw new ApiError(`🛑 Driver not found for ID: ${driverId}`, 404);
  }

  // 🛑 Check if driver is available
  if (driver.status !== "available") {
    await logger.error("Truck operation failed - driver not available", {
      driverId,
      driverStatus: driver.status,
    });
    throw new ApiError("🛑 Driver must be available", 400);
  }

  return driver;
};

export const getAllTrucksService = asyncHandler(async (req) => {
  const cacheKey = `all:${JSON.stringify(req.query)}`;

  return await cacheWrapper(
    cacheKey,
    async () => {
      const result = await getAllService(truckModel, req.query, "truck");

      const filtersForStats = result.finalFilter;

      const total = await truckModel.countDocuments(filtersForStats);
      const available = await truckModel.countDocuments({
        ...filtersForStats,
        status: "available",
      });
      const busy = await truckModel.countDocuments({
        ...filtersForStats,
        status: "busy",
      });
      const inactive = await truckModel.countDocuments({
        ...filtersForStats,
        status: "inactive",
      });

      const populatedData = await truckModel.populate(result.data, [
        { path: "assignedDriver", select: "name driverId" },
        { path: "createdBy", select: "name" },
        { path: "updatedBy", select: "name" },
      ]);

      await logger.info("Fetched all trucks");

      return {
        stats: { total, available, busy, inactive },
        data: populatedData.map(sanitizeTruck),
        results: result.results,
        paginationResult: result.paginationResult,
      };
    },
    undefined,
    { namespace: "trucks" }
  );
});

export const getTruckByIdService = asyncHandler(async (id) => {
  const truck = await getSpecificService(truckModel, id);

  const populatedTruck = await truck.populate([
    { path: "assignedDriver", select: "name driverId" },
    { path: "createdBy", select: "name" },
    { path: "updatedBy", select: "name" },
  ]);

  await logger.info("Fetched truck", { id });
  return sanitizeTruck(populatedTruck);
});

export const createTruckService = asyncHandler(async (body, userId) => {
  const { plateNumber, assignedDriver } = body;

  // 🛑 Check assigned driver
  if (assignedDriver) {
    await checkDriverExists(assignedDriver);
  }

  // 🛑 Check plateNumber uniqueness
  if (plateNumber) {
    const existingTruck = await truckModel.findOne({ plateNumber });
    if (existingTruck) {
      await logger.error(
        "Truck creation failed - plate number already exists",
        {
          plateNumber,
        }
      );
      throw new ApiError(
        `🛑 Plate number '${plateNumber}' is already in use`,
        400
      );
    }
  }

  const newTruck = await createService(truckModel, {
    ...body,
    createdBy: userId,
  });

  await delCache("trucks:*");

  await logger.info("Truck created", { truckId: newTruck.truckId });
  return sanitizeTruck(newTruck);
});

export const updateTruckService = asyncHandler(async (id, body, userId) => {
  const { plateNumber, assignedDriver } = body;

  const truck = await truckModel.findById(id);
  if (!truck) {
    await logger.error("Truck not found", { id });
    throw new ApiError(`🛑 Cannot update. No truck found with ID: ${id}`, 404);
  }

  // 🛑 Check assigned driver
  if (assignedDriver) {
    await checkDriverExists(assignedDriver);
  }

  // 🛑 Check plateNumber uniqueness
  if (plateNumber) {
    const existingTruck = await truckModel.findOne({
      plateNumber,
      _id: { $ne: id },
    });
    if (existingTruck) {
      await logger.error("Truck update failed - plate number already in use", {
        plateNumber,
      });
      throw new ApiError(
        `🛑 Plate number '${plateNumber}' is already in use`,
        400
      );
    }
  }

  const updatedTruck = await updateService(truckModel, id, {
    ...body,
    updatedBy: userId,
  });

  await delCache("trucks:*");

  await logger.info("Truck updated", { id });
  return sanitizeTruck(updatedTruck);
});

export const deleteTruckService = asyncHandler(async (id) => {
  await deleteService(truckModel, id);

  await delCache("trucks:*");

  await logger.info("Truck deleted", { id });
  return;
});
