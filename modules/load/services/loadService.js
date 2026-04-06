import asyncHandler from "express-async-handler";
import { startSession, Types } from "mongoose";

import loadModel from "../models/loadModel.js";
import driverModel from "../../driver/models/driverModel.js";
import truckModel from "../../truck/models/truckModel.js";
import ApiError from "../../../utils/apiError.js";
import { sanitizeLoad } from "../../../utils/sanitizeData.js";
import { getAllService } from "../../../utils/servicesHandler.js";
import { createAndSendNotificationService } from "../../notifications/services/notificationService.js";
import Logger from "../../../utils/loggerService.js";
import { uploadToDrive, deleteFromDrive } from "../../../utils/googleDrive.js";
import { cacheWrapper, delCache } from "../../../utils/cache.js";

const logger = new Logger("load");

// Helper for cleanup if upload failed
const safeCleanup = async (uploadedDocs) => {
  if (!uploadedDocs?.length) return;
  try {
    await deleteFromDrive(uploadedDocs.map((doc) => doc.fileId));
  } catch (cleanupErr) {
    logger.error(`Cleanup failed: ${cleanupErr.message}`);
  }
};

// ============================================================
// CREATE LOAD
// ============================================================
export const createLoadService = asyncHandler(async (req, companyId, role) => {
  // Validate company context
  if (role !== "super-admin" && !companyId) {
    throw new ApiError("🛑 Company context is missing", 403);
  }

  const {
    origin,
    destination,
    DHO,
    pickupAt,
    completedAt,
    loadId,
    driverId,
    truckId,
    truckType,
    truckTemp,
    distanceMiles,
    pricePerMile,
    totalPrice,
    currency,
    feesNumber,
  } = req.body;

  const userId = req.user._id;
  let uploadedDocs = [];
  let notificationPayload = null;

  if (req.files?.documents?.length) {
    uploadedDocs = await uploadToDrive(req.files.documents);
  }

  const session = await startSession();

  try {
    const result = await session.withTransaction(async () => {
      // Check if loadId exists in this company
      const existingLoad = await loadModel
        .findOne({
          loadId,
          companyId,
        })
        .session(session);
      if (existingLoad) {
        throw new ApiError(
          "🛑 This Load ID already exists in your company.",
          400,
        );
      }

      // Verify driver belongs to this company and is available
      const driver = await driverModel.findOneAndUpdate(
        { _id: driverId, companyId, status: "available" },
        { status: "busy", assignedTruck: truckId, updatedBy: userId },
        { new: true, session },
      );
      if (!driver)
        throw new ApiError("🛑 Driver not available in your company.", 400);

      // Verify truck belongs to this company and is available
      const truck = await truckModel.findOneAndUpdate(
        { _id: truckId, companyId, status: "available" },
        { status: "busy", assignedDriver: driverId, updatedBy: userId },
        { new: true, session },
      );
      if (!truck)
        throw new ApiError("🛑 Truck not available in your company.", 400);

      const [newLoad] = await loadModel.create(
        [
          {
            origin,
            destination,
            DHO,
            pickupAt,
            completedAt,
            loadId,
            driverId: driver._id,
            truckId: truck._id,
            truckType,
            truckTemp: truckType === "reefer" ? truckTemp : null,
            distanceMiles,
            pricePerMile,
            totalPrice,
            currency,
            feesNumber,
            documents: uploadedDocs,
            createdBy: userId,
            companyId,
          },
        ],
        { session },
      );

      if (driver.user) {
        notificationPayload = {
          title: "New Load Assigned",
          refId: newLoad._id,
          message: `You have been assigned to a new load: ${newLoad.loadId}.`,
          module: "loads",
          importance: "high",
          toUser: [driver.user],
          toRole: ["admin"],
        };
      }

      await delCache(`loads:*${companyId}*`);
      await delCache(`trucks:*${companyId}*`);
      await delCache(`drivers:*${companyId}*`);

      await logger.info(
        `New load created | LoadID: ${newLoad._id} | Company: ${companyId}`,
      );
      return sanitizeLoad(newLoad);
    });

    if (notificationPayload) {
      try {
        await createAndSendNotificationService(
          notificationPayload,
          userId,
          companyId,
          role,
        );
      } catch (notifyErr) {
        logger.error(`Failed to send notification: ${notifyErr.message}`);
      }
    }

    return result;
  } catch (error) {
    await safeCleanup(uploadedDocs);
    logger.error(`createLoadService failed: ${error} | Company: ${companyId}`);
    throw error;
  } finally {
    session.endSession();
  }
});

// ============================================================
// UPDATE LOAD
// ============================================================
export const updateLoadService = asyncHandler(async (req, companyId, role) => {
  // Validate company context
  if (role !== "super-admin" && !companyId) {
    throw new ApiError("🛑 Company context is missing", 403);
  }

  const { id } = req.params;
  const updates = req.body;
  const userId = req.user._id;
  let newDocs = [];
  let notificationPayload = null;

  const restrictedFields = [
    "driverId",
    "truckId",
    "status",
    "deliveredAt",
    "cancelledAt",
  ];

  for (const field of restrictedFields) {
    if (Object.prototype.hasOwnProperty.call(updates, field)) {
      throw new ApiError(`🛑 You cannot modify '${field}' field.`, 400);
    }
  }

  const session = await startSession();

  try {
    const result = await session.withTransaction(async () => {
      const load = await loadModel
        .findOne({ _id: id, companyId })
        .populate({ path: "driverId", select: "user" })
        .session(session);

      if (!load) throw new ApiError("🛑 Load not found in your company", 404);

      if (req.files?.documents?.length) {
        newDocs = await uploadToDrive(req.files.documents);
        if (!newDocs.length)
          throw new ApiError("🛑 Failed to upload new documents", 500);

        updates.documents = [...(load.documents || []), ...newDocs];
      }

      Object.entries(updates).forEach(([key, val]) => (load[key] = val));
      load.updatedBy = userId;

      await load.save({ session });

      // ------------ NEW NOTIFICATION ------------
      if (load.driverId?.user) {
        notificationPayload = {
          title: "Load Updated",
          refId: load._id,
          message: `Your load ${load.loadId} has been updated.`,
          module: "loads",
          importance: "medium",
          toUser: [load.driverId.user],
          toRole: ["admin"],
        };
      }
      // -------------------------------------------

      await delCache(`loads:*${companyId}*`);
      await delCache(`trucks:*${companyId}*`);
      await delCache(`drivers:*${companyId}*`);

      await logger.info(
        `Load updated | ID: ${load._id} | By: ${userId} | Company: ${companyId}`,
      );
      return sanitizeLoad(load);
    });

    if (notificationPayload) {
      try {
        await createAndSendNotificationService(
          notificationPayload,
          userId,
          companyId,
          role,
        );
      } catch (notifyErr) {
        logger.error(`Failed to send notification: ${notifyErr.message}`);
      }
    }

    return result;
  } catch (error) {
    await safeCleanup(newDocs);
    logger.error(`updateLoadService failed: ${error} | Company: ${companyId}`);
    throw error;
  } finally {
    session.endSession();
  }
});

// ============================================================
// UPDATE STATUS
// ============================================================
export const updateLoadStatusService = asyncHandler(
  async (req, companyId, role) => {
    // Validate company context
    if (role !== "super-admin" && !companyId) {
      throw new ApiError("🛑 Company context is missing", 403);
    }

    const { id } = req.params;
    const { status, deliveredAt } = req.body;
    const userId = req.user._id;

    let notificationPayload = null;
    const session = await startSession();

    try {
      const result = await session.withTransaction(async () => {
        const load = await loadModel
          .findOne({ _id: id, companyId })
          .populate({ path: "driverId", select: "user" })
          .session(session);

        if (!load) throw new ApiError("🛑 Load not found in your company", 404);

        if (load.status === "delivered" || load.status === "cancelled") {
          throw new ApiError(
            "🚫 Cannot update status. Load is already delivered or cancelled.",
            400,
          );
        }

        let finalDeliveredAt = null;
        let cancelledAt = null;

        let truckPromise = null;
        let driverPromise = null;

        if (status === "delivered" || status === "cancelled") {
          // ---------------------------
          // Update Driver
          // ---------------------------
          if (load.driverId) {
            driverPromise = driverModel.findOneAndUpdate(
              { _id: load.driverId, companyId },
              { status: "available", assignedTruck: null, updatedBy: userId },
              { session },
            );
          }

          // ---------------------------
          // Update Truck
          // ---------------------------
          if (load.truckId) {
            const updateTruckData = {
              status: "available",
              assignedDriver: null,
              updatedBy: userId,
            };

            // totalMileage
            if (status === "delivered") {
              const loadMileage = load.distanceMiles || 0;
              updateTruckData.$inc = { totalMileage: loadMileage };
            }

            truckPromise = truckModel.findOneAndUpdate(
              { _id: load.truckId, companyId },
              updateTruckData,
              { session },
            );
          }

          await Promise.all([driverPromise, truckPromise]);

          if (status === "delivered") finalDeliveredAt = deliveredAt || null;
          if (status === "cancelled") cancelledAt = new Date();
        }

        const updatedLoad = await loadModel.findOneAndUpdate(
          { _id: id, companyId },
          {
            status,
            updatedBy: userId,
            deliveredAt: finalDeliveredAt,
            cancelledAt,
          },
          { new: true, session },
        );

        if (!updatedLoad)
          throw new ApiError("🛑 Failed to update load status", 400);

        // ------------ NEW NOTIFICATION ------------
        if (load.driverId?.user) {
          notificationPayload = {
            title: "Load Status Updated",
            refId: updatedLoad._id,
            message: `Your load ${updatedLoad.loadId} status changed to: ${status}.`,
            module: "loads",
            importance: "high",
            toUser: [load.driverId.user],
            toRole: ["admin"],
          };
        }
        // -------------------------------------------

        await delCache(`loads:*${companyId}*`);
        await delCache(`trucks:*${companyId}*`);
        await delCache(`drivers:*${companyId}*`);

        await logger.info(
          `Load status updated | ${updatedLoad.loadId} -> ${status} | Company: ${companyId}`,
        );

        return sanitizeLoad(updatedLoad);
      });

      if (notificationPayload) {
        try {
          await createAndSendNotificationService(
            notificationPayload,
            userId,
            companyId,
            role,
          );
        } catch (notifyErr) {
          logger.error(`Failed to send notification: ${notifyErr.message}`);
        }
      }

      return result;
    } catch (err) {
      logger.error(
        `updateLoadStatusService failed: ${err} | Company: ${companyId}`,
      );
      throw err;
    } finally {
      session.endSession();
    }
  },
);

// ============================================================
// GET ALL LOADS
// ============================================================
export const getAllLoadsService = asyncHandler(async (req, companyId, role) => {
  // Validate company context
  if (role !== "super-admin" && !companyId) {
    throw new ApiError("🛑 Company context is missing", 403);
  }

  const { status, driverId, truckId, from, to } = req.query;
  const filter = { companyId };

  if (status) filter.status = status;
  if (driverId && Types.ObjectId.isValid(driverId)) filter.driverId = driverId;
  if (truckId && Types.ObjectId.isValid(truckId)) filter.truckId = truckId;

  if (from || to) {
    filter.createdAt = {};
    if (from) filter.createdAt.$gte = new Date(from);
    if (to) {
      const endOfDay = new Date(to);
      endOfDay.setHours(23, 59, 59, 999);
      filter.createdAt.$lte = endOfDay;
    }
  }

  const cacheKey = `all:${JSON.stringify(req.query)}:${companyId}`;

  return await cacheWrapper(
    cacheKey,
    async () => {
      const result = await getAllService(
        loadModel,
        req.query,
        "load",
        companyId,
        filter,
        {
          populate: [
            { path: "driverId", select: "driverId name phone user" },
            { path: "truckId", select: "truckId model plateNumber" },
            { path: "createdBy", select: "name jobId" },
            { path: "updatedBy", select: "name jobId" },
            { path: "comments.addedBy", select: "name jobId" },
            { path: "comments.updatedBy", select: "name jobId" },
          ],
        },
        role,
      );

      // Stats for this company only
      const statsFilter = { companyId, ...filter };

      const total = await loadModel.countDocuments(statsFilter);
      const pending = await loadModel.countDocuments({
        ...statsFilter,
        status: "pending",
      });
      const inTransit = await loadModel.countDocuments({
        ...statsFilter,
        status: "in_transit",
      });
      const delivered = await loadModel.countDocuments({
        ...statsFilter,
        status: "delivered",
      });
      const cancelled = await loadModel.countDocuments({
        ...statsFilter,
        status: "cancelled",
      });

      await logger.info(
        `Loaded ${result.results} loads | Company: ${companyId}`,
      );

      return {
        stats: {
          total,
          pending,
          inTransit,
          delivered,
          cancelled,
        },
        data: result.data.map(sanitizeLoad),
        results: result.results,
        paginationResult: result.paginationResult,
      };
    },
    undefined,
    { namespace: "loads" },
  );
});
