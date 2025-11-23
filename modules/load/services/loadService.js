import asyncHandler from "express-async-handler";
import { startSession, Types } from "mongoose";

import loadModel from "../models/loadModel.js";
import driverModel from "../../driver/models/driverModel.js";
import truckModel from "../../truck/models/truckModel.js";
import ApiError from "../../../utils/apiError.js";
import { sanitizeLoad } from "../../../utils/sanitizeData.js";
import { getAllService } from "../../../utils/servicesHandler.js";
import { createAndSendNotificationService } from "../../../modules/notifications/services/notificationService.js";
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
export const createLoadService = asyncHandler(async (req) => {
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
      const existingLoad = await loadModel.findOne({ loadId }).session(session);
      if (existingLoad) {
        throw new ApiError("⚠️ This Load ID already exists.", 400);
      }

      const driver = await driverModel.findOneAndUpdate(
        { _id: driverId, status: "available" },
        { status: "busy", assignedTruck: truckId, updatedBy: userId },
        { new: true, session }
      );
      if (!driver) throw new ApiError("⚠️ Driver not available.", 400);

      const truck = await truckModel.findOneAndUpdate(
        { _id: truckId, status: "available" },
        { status: "busy", assignedDriver: driverId, updatedBy: userId },
        { new: true, session }
      );
      if (!truck) throw new ApiError("⚠️ Truck not available.", 400);

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
          },
        ],
        { session }
      );

      if (driver.user) {
        notificationPayload = {
          title: "🎯 New Load Assigned",
          refId: newLoad._id,
          message: `You have been assigned to a new load: ${newLoad.loadId}.`,
          module: "loads",
          importance: "high",
          from: "system",
          toUser: [driver.user],
          toRole: ["admin"],
        };
      }

      await delCache("loads:*");
      await delCache("trucks:*");
      await delCache("drivers:*");

      await logger.info(`New load created | LoadID: ${newLoad._id}`);
      return sanitizeLoad(newLoad);
    });

    if (notificationPayload) {
      try {
        await createAndSendNotificationService(notificationPayload);
      } catch (notifyErr) {
        logger.error(`Failed to send notification: ${notifyErr.message}`);
      }
    }

    return result;
  } catch (error) {
    await safeCleanup(uploadedDocs);
    logger.error(`createLoadService failed: ${error}`);
    throw error;
  } finally {
    session.endSession();
  }
});

// ============================================================
// UPDATE LOAD
// ============================================================
export const updateLoadService = asyncHandler(async (req) => {
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
        .findById(id)
        .populate({ path: "driverId", select: "user" })
        .session(session);

      if (!load) throw new ApiError("⚠️ Load not found", 404);

      if (req.files?.documents?.length) {
        newDocs = await uploadToDrive(req.files.documents);
        if (!newDocs.length)
          throw new ApiError("🛑 Failed to upload new documents", 500);

        if (load.documents?.length) {
          deleteFromDrive(load.documents.map((d) => d.fileId)).catch((err) =>
            logger.error(`Failed to delete old documents for load ${id}`)
          );
        }

        updates.documents = newDocs;
      }

      Object.entries(updates).forEach(([key, val]) => (load[key] = val));
      load.updatedBy = userId;

      await load.save({ session });

      // ------------ NEW NOTIFICATION ------------
      if (load.driverId?.user) {
        notificationPayload = {
          title: "✏️ Load Updated",
          refId: load._id,
          message: `Your load ${load.loadId} has been updated.`,
          module: "loads",
          importance: "medium",
          from: "system",
          toUser: [load.driverId.user],
          toRole: ["admin"],
        };
      }
      // -------------------------------------------

      await delCache("loads:*");
      await delCache("trucks:*");
      await delCache("drivers:*");

      await logger.info(`Load updated | ID: ${load._id} | By: ${userId}`);
      return sanitizeLoad(load);
    });

    if (notificationPayload) {
      try {
        await createAndSendNotificationService(notificationPayload);
      } catch (notifyErr) {
        logger.error(`Failed to send notification: ${notifyErr.message}`);
      }
    }

    return result;
  } catch (error) {
    await safeCleanup(newDocs);
    logger.error(`updateLoadService failed: ${error}`);
    throw error;
  } finally {
    session.endSession();
  }
});

// ============================================================
// UPDATE STATUS
// ============================================================
export const updateLoadStatusService = asyncHandler(async (req) => {
  const { id } = req.params;
  const { status, deliveredAt } = req.body;
  const userId = req.user._id;

  let notificationPayload = null;
  const session = await startSession();

  try {
    const result = await session.withTransaction(async () => {
      const load = await loadModel
        .findById(id)
        .populate({ path: "driverId", select: "user" })
        .session(session);

      if (!load) throw new ApiError("🛑 Load not found", 404);

      if (load.status === "delivered" || load.status === "cancelled") {
        throw new ApiError(
          "🚫 Cannot update status. Load is already delivered or cancelled.",
          400
        );
      }

      let finalDeliveredAt = null;
      let cancelledAt = null;

      if (status === "delivered" || status === "cancelled") {
        const driverPromise = load.driverId
          ? driverModel.findByIdAndUpdate(
              load.driverId,
              { status: "available", assignedTruck: null, updatedBy: userId },
              { session }
            )
          : null;

        const truckPromise = load.truckId
          ? truckModel.findByIdAndUpdate(
              load.truckId,
              { status: "available", assignedDriver: null, updatedBy: userId },
              { session }
            )
          : null;

        await Promise.all([driverPromise, truckPromise]);

        if (status === "delivered") finalDeliveredAt = deliveredAt || null;
        if (status === "cancelled") cancelledAt = new Date();
      }

      const updatedLoad = await loadModel.findByIdAndUpdate(
        id,
        {
          status,
          updatedBy: userId,
          deliveredAt: finalDeliveredAt,
          cancelledAt,
        },
        { new: true, session }
      );

      if (!updatedLoad)
        throw new ApiError("⚠️ Failed to update load status", 400);

      // ------------ NEW NOTIFICATION ------------
      if (load.driverId?.user) {
        notificationPayload = {
          title: "📦 Load Status Updated",
          refId: updatedLoad._id,
          message: `Your load ${updatedLoad.loadId} status changed to: ${status}.`,
          module: "loads",
          importance: "high",
          from: "system",
          toUser: [load.driverId.user],
          toRole: ["admin"],
        };
      }
      // -------------------------------------------
      await delCache("loads:*");
      await delCache("trucks:*");
      await delCache("drivers:*");

      await logger.info(
        `Load status updated | ${updatedLoad.loadId} -> ${status}`
      );
      return sanitizeLoad(updatedLoad);
    });

    if (notificationPayload) {
      try {
        await createAndSendNotificationService(notificationPayload);
      } catch (notifyErr) {
        logger.error(`Failed to send notification: ${notifyErr.message}`);
      }
    }

    return result;
  } catch (err) {
    logger.error(`updateLoadStatusService failed: ${err}`);
    throw err;
  } finally {
    session.endSession();
  }
});

// ============================================================
// GET ALL LOADS
// ============================================================
export const getAllLoadsService = asyncHandler(async (req) => {
  const { status, driverId, truckId, from, to } = req.query;
  const filter = {};

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

  const cacheKey = `all:${JSON.stringify(req.query)}`;

  return await cacheWrapper(
    cacheKey,
    async () => {
      const result = await getAllService(loadModel, req.query, "load", filter, {
        populate: [
          { path: "driverId", select: "driverId name phone user" },
          { path: "truckId", select: "truckId model plateNumber" },
          { path: "createdBy", select: "name jobId" },
          { path: "updatedBy", select: "name jobId" },
          { path: "comments.addedBy", select: "name jobId" },
          { path: "comments.updatedBy", select: "name jobId" },
        ],
      });

      const filtersForStats = result.finalFilter;

      const total = await loadModel.countDocuments(filtersForStats);
      const pending = await loadModel.countDocuments({
        ...filtersForStats,
        status: "pending",
      });
      const inTransit = await loadModel.countDocuments({
        ...filtersForStats,
        status: "in_transit",
      });
      const delivered = await loadModel.countDocuments({
        ...filtersForStats,
        status: "delivered",
      });
      const cancelled = await loadModel.countDocuments({
        ...filtersForStats,
        status: "cancelled",
      });

      await logger.info(`Loaded ${result.results} loads`);

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
    { namespace: "loads" }
  );
});
