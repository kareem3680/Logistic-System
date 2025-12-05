import asyncHandler from "express-async-handler";
import { Types } from "mongoose";

import loadModel from "../../load/models/loadModel.js";
import driverModel from "../../driver/models/driverModel.js";
import { sanitizeDriverLoad } from "../../../utils/sanitizeData.js";
import { getAllService } from "../../../utils/servicesHandler.js";
import { createAndSendNotificationService } from "../../../modules/notifications/services/notificationService.js";
import Logger from "../../../utils/loggerService.js";
import ApiError from "../../../utils/apiError.js";
import { uploadToDrive, deleteFromDrive } from "../../../utils/googleDrive.js";
import { cacheWrapper, delCache } from "../../../utils/cache.js";

const logger = new Logger("load");

const getDriverWeekPeriod = (date = new Date()) => {
  const day = date.getDay();
  let lastFriday = new Date(date);
  let nextThursday = new Date(date);

  if (day === 5) {
    nextThursday.setDate(lastFriday.getDate() + 6);
  } else if (day === 4) {
    lastFriday.setDate(date.getDate() - 6);
  } else {
    const daysSinceFriday = (day + 2) % 7;
    lastFriday.setDate(date.getDate() - daysSinceFriday);
    nextThursday.setDate(lastFriday.getDate() + 6);
  }

  const formatDate = (d) => d.toISOString().split("T")[0];

  return { from: formatDate(lastFriday), to: formatDate(nextThursday) };
};

export const getAllLoadsService = asyncHandler(async (req) => {
  const { status, truckId } = req.query;

  const cacheKey = `driverLoads:${req.user._id}:${JSON.stringify(req.query)}`;

  return await cacheWrapper(
    cacheKey,
    async () => {
      const filter = {};

      const currentDriver = await driverModel
        .findOne({ user: req.user._id })
        .select("_id");

      if (!currentDriver) {
        throw new ApiError(
          "🛑 This user is not linked to any driver account",
          404
        );
      }

      filter.driverId = currentDriver._id;

      const { from: lastFriday, to: nextThursday } = getDriverWeekPeriod();

      filter.createdAt = { $gte: lastFriday, $lte: nextThursday };

      if (status) filter.status = status;
      if (truckId && Types.ObjectId.isValid(truckId)) filter.truckId = truckId;

      const result = await getAllService(loadModel, req.query, "load", filter, {
        populate: [{ path: "truckId", select: "type model" }],
      });

      await logger.info(
        `Driver ${currentDriver._id} - Loads retrieved successfully (${result.results} results)`
      );

      const data = result.data.map((l) => sanitizeDriverLoad(l));

      return {
        message: "Loads retrieved successfully",
        results: result.results,
        period: {
          from: lastFriday,
          to: nextThursday,
        },
        data,
        paginationResult: result.paginationResult,
      };
    },
    undefined,
    { namespace: "loads" }
  );
});

export const addDriverDocumentsService = asyncHandler(async (req) => {
  const { id } = req.params;
  const userId = req.user._id;

  // 1) Get current driver linked to this user
  const currentDriver = await driverModel
    .findOne({ user: userId })
    .select("_id name");
  if (!currentDriver)
    throw new ApiError("🛑 This user is not linked to any driver account", 404);

  // 2) Find load assigned to this driver
  const load = await loadModel.findOne({
    _id: req.params.id,
    driverId: currentDriver._id,
  });

  if (!load)
    throw new ApiError("🛑 Load not found or not assigned to this driver", 404);

  // 3) Check for uploaded files
  if (!req.files?.documentsForDriver?.length)
    throw new ApiError("🛑 Please upload at least one document (PDF)", 400);

  let uploadedDocs = [];

  try {
    // 4) Upload to Google Drive
    uploadedDocs = await uploadToDrive(req.files.documentsForDriver);

    // 5) Attach to load
    load.documentsForDriver = [
      ...(load.documentsForDriver || []),
      ...uploadedDocs.map((doc) => ({
        fileId: doc.fileId,
        viewLink: doc.viewLink,
        downloadLink: doc.downloadLink,
        uploadedAt: new Date(),
      })),
    ];

    load.updatedBy = userId;
    await load.save();
    await delCache("loads:*");

    // 6) Send Notifications to admins and employees
    await createAndSendNotificationService({
      title: "Driver Uploaded Documents",
      refId: load._id,
      message: `Driver ${currentDriver.name} uploaded ${uploadedDocs.length} documents for Load: ${load.loadId}.`,
      module: "loads",
      importance: "medium",
      from: userId,
      toRole: ["admin", "employee"],
    });

    await logger.info(
      `📄 Driver ${currentDriver._id} uploaded ${uploadedDocs.length} docs for Load ${id}`
    );

    return sanitizeDriverLoad(load);
  } catch (err) {
    // 7) Cleanup on failure
    if (uploadedDocs?.length) {
      try {
        await deleteFromDrive(uploadedDocs.map((d) => d.fileId));
      } catch (cleanupErr) {
        logger.error(
          `Cleanup failed after upload error: ${cleanupErr.message}`
        );
      }
    }
    logger.error(`addDriverDocumentsService failed: ${err.message}`);
    throw new ApiError("🛑 Failed to upload driver documents", 500);
  }
});
