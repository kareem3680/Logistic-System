import asyncHandler from "express-async-handler";

import userModel from "../../identity/models/userModel.js";
import driverModel from "../models/driverModel.js";
import truckModel from "../../truck/models/truckModel.js";
import ApiError from "../../../utils/apiError.js";
import { sanitizeDriver } from "../../../utils/sanitizeData.js";
import {
  createService,
  getAllService,
  getSpecificService,
  updateService,
  deleteService,
} from "../../../utils/servicesHandler.js";
import Logger from "../../../utils/loggerService.js";
import { cacheWrapper, delCache } from "../../../utils/cache.js";
const logger = new Logger("driver");

export const createDriverService = asyncHandler(async (body, userId) => {
  const { email, assignedTruck, licenseNumber, user } = body;

  // Check for email duplication
  if (email) {
    const existingEmail = await driverModel.findOne({ email });
    if (existingEmail) {
      await logger.error("Driver creation failed - email already exists", {
        email,
      });
      throw new ApiError("🛑 Email already exists", 400);
    }
  }

  // Check for licenseNumber duplication
  if (licenseNumber) {
    const existingLicense = await driverModel.findOne({ licenseNumber });
    if (existingLicense) {
      await logger.error(
        "Driver creation failed - licenseNumber already exists",
        {
          licenseNumber,
        }
      );
      throw new ApiError("🛑 License number already exists", 400);
    }
  }

  // Check if user exists and has driver role
  if (user) {
    const userExists = await userModel.findById(user);
    if (!userExists) {
      await logger.error("Driver creation failed - user not found", {
        user,
      });
      throw new ApiError("🛑 User not found", 404);
    }

    if (userExists.role !== "driver") {
      await logger.error("Driver creation failed - user role is not driver", {
        user: userExists._id,
        role: userExists.role,
      });
      throw new ApiError(
        "🛑 User role must be 'driver' to create driver profile",
        400
      );
    }

    const existingDriver = await driverModel.findOne({ user: userExists._id });
    if (existingDriver) {
      await logger.error(
        "Driver creation failed - user already has driver profile",
        {
          user: userExists._id,
          existingDriverId: existingDriver._id,
        }
      );
      throw new ApiError("🛑 User already has a driver profile", 400);
    }
  }

  // Check if assignedTruck exists (and validate id)
  if (assignedTruck) {
    const truckExists = await truckModel.findById(assignedTruck);
    if (!truckExists) {
      await logger.error("Driver creation failed - truck not found", {
        assignedTruck,
      });
      throw new ApiError("🛑 Assigned truck not found", 404);
    }

    // Check if truck is available
    if (truckExists.status !== "available") {
      await logger.error("Driver creation failed - truck is not available", {
        assignedTruck,
        truckStatus: truckExists.status,
      });
      throw new ApiError("🛑 Assigned truck must be available", 400);
    }
  }

  const newDriver = await createService(driverModel, {
    ...body,
    createdBy: userId,
  });

  await delCache("drivers:*");

  await logger.info("Driver created", { driverId: newDriver._id });
  return sanitizeDriver(newDriver);
});

export const getAllDriversService = asyncHandler(async (req) => {
  const cacheKey = `all:${JSON.stringify(req.query)}`;

  return await cacheWrapper(
    cacheKey,
    async () => {
      const result = await getAllService(driverModel, req.query, "driver");

      const filtersForStats = result.finalFilter;

      const total = await driverModel.countDocuments(filtersForStats);
      const available = await driverModel.countDocuments({
        ...filtersForStats,
        status: "available",
      });
      const busy = await driverModel.countDocuments({
        ...filtersForStats,
        status: "busy",
      });
      const inactive = await driverModel.countDocuments({
        ...filtersForStats,
        status: "inactive",
      });

      const populatedData = await driverModel.populate(result.data, [
        { path: "createdBy", select: "name" },
        { path: "updatedBy", select: "name" },
        { path: "assignedTruck", select: "plateNumber" },
      ]);

      const sanitizedData = populatedData.map((driver) =>
        sanitizeDriver(driver)
      );

      await logger.info("Fetched all drivers");

      return {
        stats: { total, available, busy, inactive },
        results: result.results,
        paginationResult: result.paginationResult,
        data: sanitizedData,
      };
    },
    undefined,
    { namespace: "drivers" }
  );
});

export const getDriverByIdService = asyncHandler(async (id) => {
  return await cacheWrapper(
    `id:${id}`,
    async () => {
      const driver = await getSpecificService(driverModel, id);

      const populatedDriver = await driver.populate([
        { path: "createdBy", select: "name" },
        { path: "updatedBy", select: "name" },
        { path: "assignedTruck", select: "plateNumber" },
      ]);

      await logger.info("Fetched driver", { id });
      return sanitizeDriver(populatedDriver);
    },
    undefined,
    { namespace: "drivers" }
  );
});

export const updateDriverService = asyncHandler(async (id, body, userId) => {
  const { email, assignedTruck, licenseNumber, user } = body;

  const driver = await driverModel.findById(id);
  if (!driver) {
    await logger.error("Driver not found", { id });
    throw new ApiError(`🛑 Cannot update. No driver found with ID: ${id}`, 404);
  }

  // Check email uniqueness
  if (email) {
    const existingEmail = await driverModel.findOne({ email });
    if (
      existingEmail &&
      existingEmail._id.toString() !== driver._id.toString()
    ) {
      await logger.error("Email already in use", { email });
      throw new ApiError("🛑 Email already exists", 400);
    }
  }

  // Check for licenseNumber duplication
  if (licenseNumber) {
    const existingLicense = await driverModel.findOne({ licenseNumber });
    if (existingLicense) {
      await logger.error(
        "Driver creation failed - licenseNumber already exists",
        {
          licenseNumber,
        }
      );
      throw new ApiError("🛑 License number already exists", 400);
    }
  }

  // Check if user exists and has driver role
  if (user) {
    const userExists = await userModel.findById(user);
    if (!userExists) {
      await logger.error("Driver creation failed - user not found", {
        user,
      });
      throw new ApiError("🛑 User not found", 404);
    }

    if (userExists.role !== "driver") {
      await logger.error("Driver creation failed - user role is not driver", {
        user: userExists._id,
        role: userExists.role,
      });
      throw new ApiError(
        "🛑 User role must be 'driver' to create driver profile",
        400
      );
    }

    const existingDriver = await driverModel.findOne({ user: userExists._id });
    if (existingDriver) {
      await logger.error(
        "Driver creation failed - user already has driver profile",
        {
          user: userExists._id,
          existingDriverId: existingDriver._id,
        }
      );
      throw new ApiError("🛑 User already has a driver profile", 400);
    }
  }

  // Check if assignedTruck exists (and validate id)
  if (assignedTruck) {
    const truckExists = await truckModel.findById(assignedTruck);
    if (!truckExists) {
      await logger.error("Driver creation failed - truck not found", {
        assignedTruck,
      });
      throw new ApiError("🛑 Assigned truck not found", 404);
    }

    // Check if truck is available
    if (truckExists.status !== "available") {
      await logger.error("Driver creation failed - truck is not available", {
        assignedTruck,
        truckStatus: truckExists.status,
      });
      throw new ApiError("🛑 Assigned truck must be available", 400);
    }
  }

  const updatedDriver = await updateService(driverModel, id, {
    ...body,
    updatedBy: userId,
  });

  await delCache("drivers:*");

  await logger.info("Driver updated", { id });
  return sanitizeDriver(updatedDriver);
});

export const deleteDriverService = asyncHandler(async (id) => {
  await deleteService(driverModel, id);

  await delCache("drivers:*");

  await logger.info("Driver deleted", { id });
  return;
});
