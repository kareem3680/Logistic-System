import asyncHandler from "express-async-handler";
import { Types } from "mongoose";

import timeOffModel from "../models/timeOffModel.js";
import driverModel from "../../driver/models/driverModel.js";
import { getAllService } from "../../../utils/servicesHandler.js";
import { sanitizeTimeOff } from "../../../utils/sanitizeData.js";
import { createAndSendNotificationService } from "../../../modules/notifications/services/notificationService.js";
import Logger from "../../../utils/loggerService.js";
import ApiError from "../../../utils/apiError.js";
import { cacheWrapper, delCache } from "../../../utils/cache.js";

const logger = new Logger("timeOff");

// ============================================================
// CREATE TIME-OFF
// ============================================================
export const createTimeOffService = asyncHandler(async (req) => {
  const { from, to, reason } = req.body;
  const userId = req.user._id;

  const currentDriver = await driverModel
    .findOne({ user: userId })
    .select("_id name");
  if (!currentDriver)
    throw new ApiError("🛑 This user is not linked to any driver account", 404);

  const fromDate = new Date(from);
  const toDate = new Date(to);

  if (fromDate > toDate)
    throw new ApiError("🛑 'From' date cannot be after 'To' date", 400);

  const diffDays = Math.floor((toDate - fromDate) / (1000 * 60 * 60 * 24)) + 1;

  if (diffDays > 3)
    throw new ApiError("🛑 TimeOff request cannot exceed 3 days", 400);

  const newTimeOff = await timeOffModel.create({
    driver: currentDriver._id,
    from,
    to,
    reason,
  });

  // Notification to admins
  await createAndSendNotificationService({
    title: "New TimeOff Request",
    refId: newTimeOff._id,
    message: `Driver ${currentDriver.name} submitted a time off request.`,
    module: "drivers",
    importance: "medium",
    from: userId,
    toRole: ["admin"],
  });

  await delCache("timeOff:*");
  await logger.info(
    `TimeOff created | Driver: ${currentDriver._id} | TimeOffID: ${newTimeOff._id}`
  );

  return sanitizeTimeOff(newTimeOff);
});

// ============================================================
// GET ALL TIME-OFFS (Admin)
// ============================================================
export const getAllTimeOffService = asyncHandler(async (req) => {
  const { status, driver } = req.query;

  const cacheKey = `timeOff:${JSON.stringify(req.query)}`;

  return await cacheWrapper(
    cacheKey,
    async () => {
      const filter = {};
      if (status) filter.status = status;
      if (driver && Types.ObjectId.isValid(driver)) filter.driver = driver;

      const result = await getAllService(
        timeOffModel,
        req.query,
        "timeOff",
        filter,
        {
          populate: [
            { path: "driver", select: "driverId name phone user" },
            { path: "approvedBy", select: "jobId name" },
            { path: "rejectedBy", select: "jobId name" },
          ],
        }
      );

      const finalFilter = result.finalFilter;

      const total = await timeOffModel.countDocuments(finalFilter);
      const pending = await timeOffModel.countDocuments({
        ...finalFilter,
        status: "pending",
      });
      const approved = await timeOffModel.countDocuments({
        ...finalFilter,
        status: "approved",
      });
      const rejected = await timeOffModel.countDocuments({
        ...finalFilter,
        status: "rejected",
      });
      const cancelled = await timeOffModel.countDocuments({
        ...finalFilter,
        status: "cancelled",
      });

      await logger.info(`TimeOffs retrieved | Results: ${result.results}`);

      return {
        stats: {
          total,
          pending,
          approved,
          rejected,
          cancelled,
        },
        message: "TimeOffs retrieved successfully",
        results: result.results,
        data: result.data.map(sanitizeTimeOff),
        paginationResult: result.paginationResult,
      };
    },
    undefined,
    { namespace: "timeOff" }
  );
});

// ============================================================
// GET MY TIME-OFFS (Driver)
// ============================================================
export const getMyTimeOffService = asyncHandler(async (req) => {
  const userId = req.user._id;
  const cacheKey = `timeOff:driver:${userId}:${JSON.stringify(req.query)}`;

  return await cacheWrapper(
    cacheKey,
    async () => {
      const currentDriver = await driverModel
        .findOne({ user: userId })
        .select("_id");
      if (!currentDriver)
        throw new ApiError(
          "🛑 This user is not linked to any driver account",
          404
        );

      // 1) Build filter for this driver
      const filter = {
        driver: currentDriver._id,
        status: { $ne: "cancelled" },
      };

      // 2) Use service handler
      const result = await getAllService(
        timeOffModel,
        req.query,
        "timeOff",
        filter,
        {
          populate: [
            { path: "driver", select: "driverId name phone user" },
            { path: "approvedBy", select: "jobId name" },
            { path: "rejectedBy", select: "jobId name" },
          ],
        }
      );

      // 3) Log
      await logger.info(
        `Driver ${currentDriver._id} - TimeOffs retrieved | Results: ${result.results}`
      );

      // 4) Return sanitized data
      return {
        message: "Your TimeOffs retrieved successfully",
        results: result.results,
        data: result.data.map(sanitizeTimeOff),
        paginationResult: result.paginationResult,
      };
    },
    undefined,
    { namespace: "timeOff" }
  );
});

// ============================================================
// UPDATE TIME-OFF STATUS (Admin Approve / Reject)
// ============================================================
export const updateTimeOffStatusService = asyncHandler(async (req) => {
  const { id } = req.params;
  const { status } = req.body;
  const userId = req.user._id;

  if (!["approved", "rejected"].includes(status))
    throw new ApiError(
      "🛑 Status must be either 'approved' or 'rejected'",
      400
    );

  const timeOff = await timeOffModel
    .findById(id)
    .populate("driver", "name user");
  if (!timeOff) throw new ApiError("🛑 TimeOff request not found", 404);

  // Prevent changing cancelled requests
  if (timeOff.status === "cancelled") {
    throw new ApiError(
      "🛑 You cannot change the status of a cancelled TimeOff request",
      400
    );
  }

  timeOff.status = status;
  timeOff.adminNote = req.body.adminNote || undefined;

  if (status === "approved") timeOff.approvedBy = userId;
  if (status === "rejected") timeOff.rejectedBy = userId;

  await timeOff.save();
  await delCache("timeOff:*");

  // Notification to driver
  if (timeOff.driver?.user) {
    await createAndSendNotificationService({
      title: `TimeOff ${status}`,
      refId: timeOff.driver._id,
      message: `Your TimeOff request has been ${status}.`,
      module: "drivers",
      importance: "high",
      from: userId,
      toUser: [timeOff.driver.user],
    });
  }

  await logger.info(`TimeOff ${status} | TimeOffID: ${timeOff._id}`);
  return sanitizeTimeOff(timeOff);
});

// ============================================================
// Cancel TIME-OFF (Driver)
// ============================================================
export const cancelTimeOffService = asyncHandler(async (req) => {
  const { id } = req.params;
  const userId = req.user._id;

  // 1) Find current driver
  const currentDriver = await driverModel
    .findOne({ user: userId })
    .select("_id name");
  if (!currentDriver)
    throw new ApiError("🛑 This user is not linked to any driver account", 404);

  // 2) Find TimeOff request
  const timeOff = await timeOffModel.findById(id);
  if (!timeOff) throw new ApiError("🛑 TimeOff request not found", 404);

  // 3) Check ownership
  if (timeOff.driver.toString() !== currentDriver._id.toString()) {
    throw new ApiError("🛑 You can only cancel your own TimeOff requests", 403);
  }

  // 4) Check status: only pending can be cancelled
  if (timeOff.status !== "pending") {
    throw new ApiError(
      "🛑 Only pending TimeOff requests can be cancelled",
      400
    );
  }

  // 5) Update status
  timeOff.status = "cancelled";
  timeOff.cancelledAt = new Date();
  await timeOff.save();

  // 6) Clear cache
  await delCache("timeOff:*");

  // 7) Notify admins
  await createAndSendNotificationService({
    title: "TimeOff Cancelled",
    refId: timeOff._id,
    message: `Driver ${currentDriver.name} cancelled their TimeOff request`,
    module: "drivers",
    importance: "high",
    from: userId,
    toRole: ["admin"],
  });

  // 8) Log
  await logger.info(
    `Driver ${currentDriver._id} cancelled TimeOff ${timeOff._id}`
  );

  return timeOff;
});
