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

const normalizeToDateOnly = (input) => {
  if (!input) return new Date().toISOString().split("T")[0];

  if (input instanceof Date) {
    return input.toISOString().split("T")[0];
  }

  return input.split("T")[0];
};

const getDriverWeekPeriod = (inputDate = null) => {
  const dateStr = normalizeToDateOnly(inputDate);

  const [year, month, day] = dateStr.split("-").map(Number);

  // Avoid timezone shifting
  const date = new Date(year, month - 1, day, 12, 0, 0);

  const weekday = date.getDay();
  let lastFriday = new Date(date);
  let nextThursday = new Date(date);

  if (weekday === 5) {
    nextThursday.setDate(lastFriday.getDate() + 6);
  } else if (weekday === 4) {
    lastFriday.setDate(date.getDate() - 6);
  } else {
    const daysSinceFriday = (weekday + 2) % 7;
    lastFriday.setDate(date.getDate() - daysSinceFriday);
    nextThursday.setDate(lastFriday.getDate() + 6);
  }

  const format = (d) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
      d.getDate()
    ).padStart(2, "0")}`;

  return { from: format(lastFriday), to: format(nextThursday) };
};

// Convert "YYYY-MM-DD" → real range for MongoDB
const buildDayRange = (dateString) => {
  const start = new Date(`${dateString}T00:00:00.000Z`);
  const end = new Date(`${dateString}T23:59:59.999Z`);
  return { $gte: start, $lte: end };
};

export const getAllLoadsService = asyncHandler(async (req) => {
  const { status, truckId } = req.query;

  const cacheKey = `driverLoads:${req.user._id}:${JSON.stringify(req.query)}`;

  return await cacheWrapper(
    cacheKey,
    async () => {
      const currentDriver = await driverModel
        .findOne({ user: req.user._id })
        .select("_id");

      if (!currentDriver) {
        throw new ApiError(
          "🛑 This user is not linked to any driver account",
          404
        );
      }

      const { from: lastFriday, to: nextThursday } = getDriverWeekPeriod();

      const dateRange = {
        $gte: new Date(`${lastFriday}T00:00:00.000Z`),
        $lte: new Date(`${nextThursday}T23:59:59.999Z`),
      };

      const filter = {};

      if (truckId && Types.ObjectId.isValid(truckId)) filter.truckId = truckId;

      filter.$or = [
        { status: { $nin: ["delivered", "cancelled"] } },
        { status: { $in: ["delivered", "cancelled"] }, createdAt: dateRange },
      ];

      filter.driverId = currentDriver._id;

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
      `Driver ${currentDriver._id} uploaded ${uploadedDocs.length} docs for Load ${id}`
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
