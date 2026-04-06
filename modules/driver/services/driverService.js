import asyncHandler from "express-async-handler";
import userModel from "../../identity/models/userModel.js";
import truckModel from "../../truck/models/truckModel.js";
import driverModel from "../models/driverModel.js";
import ApiError from "../../../utils/apiError.js";
import Logger from "../../../utils/loggerService.js";
import { cacheWrapper, delCache } from "../../../utils/cache.js";
import { uploadToDrive, deleteFromDrive } from "../../../utils/googleDrive.js";
import { sanitizeDriver } from "../../../utils/sanitizeData.js";
import {
  createService,
  getAllService,
  getSpecificService,
  updateService,
  deleteService,
} from "../../../utils/servicesHandler.js";

const logger = new Logger("driver");

// -----------------------------
// CREATE DRIVER
// -----------------------------
export const createDriverService = asyncHandler(
  async (body, userId, companyId, role) => {
    if (!companyId) throw new ApiError("🛑 Company context is missing", 403);

    const { email, licenseNumber, user, assignedTruck } = body;

    if (email && (await driverModel.findOne({ email, companyId })))
      throw new ApiError("🛑 Email already exists", 400);
    if (
      licenseNumber &&
      (await driverModel.findOne({ licenseNumber, companyId }))
    )
      throw new ApiError("🛑 License number already exists", 400);

    if (user) {
      const userExists = await userModel.findOne({ _id: user, companyId });
      if (!userExists) throw new ApiError("🛑 User not found", 404);
      if (userExists.role !== "driver")
        throw new ApiError("🛑 User role must be 'driver'", 400);
      if (await driverModel.findOne({ user, companyId }))
        throw new ApiError("🛑 User already has a driver profile", 400);
    }

    if (assignedTruck) {
      const truck = await truckModel.findOne({ _id: assignedTruck, companyId });
      if (!truck) throw new ApiError("🛑 Assigned truck not found", 404);
      if (truck.status !== "available")
        throw new ApiError("🛑 Assigned truck must be available", 400);
    }

    const newDriver = await createService(
      driverModel,
      {
        ...body,
        createdBy: userId,
        companyId,
      },
      companyId,
      role,
    );

    await delCache("drivers:*");
    await logger.info("Driver created", { driverId: newDriver._id });

    return sanitizeDriver(newDriver);
  },
);

// -----------------------------
// GET ALL DRIVERS
// -----------------------------
export const getAllDriversService = asyncHandler(
  async (req, companyId, role) => {
    if (!companyId) throw new ApiError("🛑 Company context is missing", 403);

    const cacheKey = `all:${JSON.stringify(req.query)}:${companyId}`;
    return await cacheWrapper(
      cacheKey,
      async () => {
        const result = await getAllService(
          driverModel,
          req.query,
          "driver",
          companyId,
          {}, // filter
          {}, // options
          role,
        );

        const total = await driverModel.countDocuments({ companyId });
        const available = await driverModel.countDocuments({
          companyId,
          status: "available",
        });
        const busy = await driverModel.countDocuments({
          companyId,
          status: "busy",
        });
        const inactive = await driverModel.countDocuments({
          companyId,
          status: "inactive",
        });

        const populatedData = await driverModel.populate(result.data, [
          { path: "createdBy", select: "name" },
          { path: "updatedBy", select: "name" },
          { path: "assignedTruck", select: "plateNumber" },
        ]);

        return {
          stats: { total, available, busy, inactive },
          results: result.results,
          paginationResult: result.paginationResult,
          data: populatedData.map(sanitizeDriver),
        };
      },
      undefined,
      { namespace: "drivers" },
    );
  },
);

// -----------------------------
// GET DRIVER BY ID
// -----------------------------
export const getDriverByIdService = asyncHandler(
  async (id, companyId, role) => {
    if (!companyId) throw new ApiError("🛑 Company context is missing", 403);

    return await cacheWrapper(
      `id:${id}:${companyId}`,
      async () => {
        const driver = await getSpecificService(
          driverModel,
          id,
          companyId,
          {},
          role,
        );

        const populatedDriver = await driver.populate([
          { path: "createdBy", select: "name" },
          { path: "updatedBy", select: "name" },
          { path: "assignedTruck", select: "plateNumber" },
        ]);

        return sanitizeDriver(populatedDriver);
      },
      undefined,
      { namespace: "drivers" },
    );
  },
);

// -----------------------------
// UPDATE DRIVER
// -----------------------------
export const updateDriverService = asyncHandler(
  async (id, body, userId, files, companyId, role) => {
    if (!companyId) throw new ApiError("🛑 Company context is missing", 403);

    const driver = await driverModel.findOne({ _id: id, companyId });
    if (!driver) throw new ApiError("🛑 Driver not found", 404);

    if (
      body.email &&
      (await driverModel.findOne({
        email: body.email,
        companyId,
        _id: { $ne: id },
      }))
    )
      throw new ApiError("🛑 Email already exists", 400);
    if (
      body.licenseNumber &&
      (await driverModel.findOne({
        licenseNumber: body.licenseNumber,
        companyId,
        _id: { $ne: id },
      }))
    )
      throw new ApiError("🛑 License number already exists", 400);

    if (body.user) {
      const userExists = await userModel.findOne({ _id: body.user, companyId });
      if (!userExists) throw new ApiError("🛑 User not found", 404);
      if (userExists.role !== "driver")
        throw new ApiError("🛑 User role must be 'driver'", 400);
      if (
        await driverModel.findOne({
          user: body.user,
          companyId,
          _id: { $ne: id },
        })
      )
        throw new ApiError("🛑 User already has a driver profile", 400);
    }

    if (body.assignedTruck) {
      const truck = await truckModel.findOne({
        _id: body.assignedTruck,
        companyId,
      });
      if (!truck) throw new ApiError("🛑 Assigned truck not found", 404);
      if (truck.status !== "available")
        throw new ApiError("🛑 Assigned truck must be available", 400);
    }

    // ================= FILE UPLOAD =================
    let uploadedDocs = [];

    try {
      if (files?.documents?.length) {
        uploadedDocs = await uploadToDrive(files.documents);

        driver.documents = [
          ...(driver.documents || []),
          ...uploadedDocs.map((doc) => ({
            fileId: doc.fileId,
            viewLink: doc.viewLink,
            downloadLink: doc.downloadLink,
            uploadedAt: new Date(),
          })),
        ];
      }

      const updatedDriver = await updateService(
        driverModel,
        id,
        { ...body, documents: driver.documents, updatedBy: userId },
        companyId,
        role,
      );

      await delCache("drivers:*");
      await logger.info("Driver updated", { driverId: updatedDriver._id });

      return sanitizeDriver(updatedDriver);
    } catch (err) {
      // cleanup if DB failed after upload
      if (uploadedDocs.length) {
        try {
          await deleteFromDrive(uploadedDocs.map((d) => d.fileId));
        } catch (cleanupErr) {
          logger.error(`Cleanup failed: ${cleanupErr.message}`);
        }
      }

      throw err;
    }
  },
);

// -----------------------------
// DELETE DRIVER
// -----------------------------
export const deleteDriverService = asyncHandler(async (id, companyId, role) => {
  if (!companyId) throw new ApiError("🛑 Company context is missing", 403);

  await deleteService(driverModel, id, companyId, role);
  await delCache("drivers:*");
  await logger.info("Driver deleted", { driverId: id });
});
