import asyncHandler from "express-async-handler";
import { Types } from "mongoose";

import timeOffModel from "../models/timeOffModel.js";
import driverModel from "../../driver/models/driverModel.js";
import { getAllService } from "../../../utils/servicesHandler.js";
import { sanitizeTimeOff } from "../../../utils/sanitizeData.js";
import { createAndSendNotificationService } from "../../notifications/services/notificationService.js";
import Logger from "../../../utils/loggerService.js";
import ApiError from "../../../utils/apiError.js";
import { cacheWrapper, delCache } from "../../../utils/cache.js";

const logger = new Logger("timeOff");

// ============================================================
// CREATE TIME-OFF
// ============================================================
export const createTimeOffService = asyncHandler(
  async (req, companyId, role) => {
    // Validate company context
    if (role !== "super-admin" && !companyId) {
      throw new ApiError("🛑 Company context is missing", 403);
    }

    const { from, to, reason } = req.body;
    const userId = req.user._id;

    const currentDriver = await driverModel
      .findOne({ user: userId, companyId })
      .select("_id name");
    if (!currentDriver)
      throw new ApiError(
        "🛑 This user is not linked to any driver account in your company",
        404,
      );

    const fromDate = new Date(from);
    const toDate = new Date(to);

    if (fromDate > toDate)
      throw new ApiError("🛑 'From' date cannot be after 'To' date", 400);

    const diffDays =
      Math.floor((toDate - fromDate) / (1000 * 60 * 60 * 24)) + 1;

    if (diffDays > 3)
      throw new ApiError("🛑 TimeOff request cannot exceed 3 days", 400);

    const newTimeOff = await timeOffModel.create({
      driver: currentDriver._id,
      from,
      to,
      reason,
      companyId,
    });

    // Notification to admins
    await createAndSendNotificationService(
      {
        title: "New TimeOff Request",
        refId: newTimeOff._id,
        message: `Driver ${currentDriver.name} submitted a time off request.`,
        module: "drivers",
        importance: "medium",
        from: userId,
        toRole: ["admin"],
      },
      userId,
      companyId,
      role,
    );

    await delCache(`timeOff:*${companyId}*`);
    await logger.info(
      `TimeOff created | Driver: ${currentDriver._id} | TimeOffID: ${newTimeOff._id} | Company: ${companyId}`,
    );

    return sanitizeTimeOff(newTimeOff);
  },
);

// ============================================================
// GET ALL TIME-OFFS (Admin)
// ============================================================
export const getAllTimeOffService = asyncHandler(
  async (req, companyId, role) => {
    // Validate company context
    if (role !== "super-admin" && !companyId) {
      throw new ApiError("🛑 Company context is missing", 403);
    }

    const { status, driver } = req.query;

    const cacheKey = `timeOff:all:${JSON.stringify(req.query)}:${companyId}`;

    return await cacheWrapper(
      cacheKey,
      async () => {
        const filter = { companyId };
        if (status) filter.status = status;
        if (driver && Types.ObjectId.isValid(driver)) filter.driver = driver;

        const result = await getAllService(
          timeOffModel,
          req.query,
          "timeOff",
          companyId,
          filter,
          {
            populate: [
              { path: "driver", select: "driverId name phone user" },
              { path: "approvedBy", select: "jobId name" },
              { path: "rejectedBy", select: "jobId name" },
            ],
          },
          role,
        );

        // Stats for this company only
        const total = await timeOffModel.countDocuments({
          companyId,
          ...filter,
        });
        const pending = await timeOffModel.countDocuments({
          companyId,
          ...filter,
          status: "pending",
        });
        const approved = await timeOffModel.countDocuments({
          companyId,
          ...filter,
          status: "approved",
        });
        const rejected = await timeOffModel.countDocuments({
          companyId,
          ...filter,
          status: "rejected",
        });
        const cancelled = await timeOffModel.countDocuments({
          companyId,
          ...filter,
          status: "cancelled",
        });

        await logger.info(
          `TimeOffs retrieved | Results: ${result.results} | Company: ${companyId}`,
        );

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
      { namespace: "timeOff" },
    );
  },
);

// ============================================================
// GET MY TIME-OFFS (Driver)
// ============================================================
export const getMyTimeOffService = asyncHandler(
  async (req, companyId, role) => {
    // Validate company context
    if (role !== "super-admin" && !companyId) {
      throw new ApiError("🛑 Company context is missing", 403);
    }

    const userId = req.user._id;
    const cacheKey = `timeOff:driver:${userId}:${JSON.stringify(req.query)}:${companyId}`;

    return await cacheWrapper(
      cacheKey,
      async () => {
        const currentDriver = await driverModel
          .findOne({ user: userId, companyId })
          .select("_id");
        if (!currentDriver)
          throw new ApiError(
            "🛑 This user is not linked to any driver account in your company",
            404,
          );

        // Build filter for this driver
        const filter = {
          driver: currentDriver._id,
          status: { $ne: "cancelled" },
          companyId,
        };

        // Use service handler
        const result = await getAllService(
          timeOffModel,
          req.query,
          "timeOff",
          companyId,
          filter,
          {
            populate: [
              { path: "driver", select: "driverId name phone user" },
              { path: "approvedBy", select: "jobId name" },
              { path: "rejectedBy", select: "jobId name" },
            ],
          },
          role,
        );

        // Log
        await logger.info(
          `Driver ${currentDriver._id} - TimeOffs retrieved | Results: ${result.results} | Company: ${companyId}`,
        );

        // Return sanitized data
        return {
          message: "Your TimeOffs retrieved successfully",
          results: result.results,
          data: result.data.map(sanitizeTimeOff),
          paginationResult: result.paginationResult,
        };
      },
      undefined,
      { namespace: "timeOff" },
    );
  },
);

// ============================================================
// UPDATE TIME-OFF STATUS (Admin Approve / Reject)
// ============================================================
export const updateTimeOffStatusService = asyncHandler(
  async (req, companyId, role) => {
    // Validate company context
    if (role !== "super-admin" && !companyId) {
      throw new ApiError("🛑 Company context is missing", 403);
    }

    const { id } = req.params;
    const { status } = req.body;
    const userId = req.user._id;

    if (!["approved", "rejected"].includes(status))
      throw new ApiError(
        "🛑 Status must be either 'approved' or 'rejected'",
        400,
      );

    const timeOff = await timeOffModel
      .findOne({ _id: id, companyId })
      .populate("driver", "name user");
    if (!timeOff)
      throw new ApiError("🛑 TimeOff request not found in your company", 404);

    // Prevent changing cancelled requests
    if (timeOff.status === "cancelled") {
      throw new ApiError(
        "🛑 You cannot change the status of a cancelled TimeOff request",
        400,
      );
    }

    timeOff.status = status;
    timeOff.adminNote = req.body.adminNote || undefined;

    if (status === "approved") timeOff.approvedBy = userId;
    if (status === "rejected") timeOff.rejectedBy = userId;

    await timeOff.save();
    await delCache(`timeOff:*${companyId}*`);

    // Notification to driver
    if (timeOff.driver?.user) {
      await createAndSendNotificationService(
        {
          title: `TimeOff ${status}`,
          refId: timeOff.driver._id,
          message: `Your TimeOff request has been ${status}.`,
          module: "drivers",
          importance: "high",
          from: userId,
          toUser: [timeOff.driver.user],
        },
        userId,
        companyId,
        role,
      );
    }

    await logger.info(
      `TimeOff ${status} | TimeOffID: ${timeOff._id} | Company: ${companyId}`,
    );
    return sanitizeTimeOff(timeOff);
  },
);

// ============================================================
// Cancel TIME-OFF (Driver)
// ============================================================
export const cancelTimeOffService = asyncHandler(
  async (req, companyId, role) => {
    // Validate company context
    if (role !== "super-admin" && !companyId) {
      throw new ApiError("🛑 Company context is missing", 403);
    }

    const { id } = req.params;
    const userId = req.user._id;

    // Find current driver in same company
    const currentDriver = await driverModel
      .findOne({ user: userId, companyId })
      .select("_id name");
    if (!currentDriver)
      throw new ApiError(
        "🛑 This user is not linked to any driver account in your company",
        404,
      );

    // Find TimeOff request in same company
    const timeOff = await timeOffModel.findOne({ _id: id, companyId });
    if (!timeOff)
      throw new ApiError("🛑 TimeOff request not found in your company", 404);

    // Check ownership
    if (timeOff.driver.toString() !== currentDriver._id.toString()) {
      throw new ApiError(
        "🛑 You can only cancel your own TimeOff requests",
        403,
      );
    }

    // Check status: only pending can be cancelled
    if (timeOff.status !== "pending") {
      throw new ApiError(
        "🛑 Only pending TimeOff requests can be cancelled",
        400,
      );
    }

    // Update status
    timeOff.status = "cancelled";
    timeOff.cancelledAt = new Date();
    await timeOff.save();

    // Clear cache
    await delCache(`timeOff:*${companyId}*`);

    // Notify admins
    await createAndSendNotificationService(
      {
        title: "TimeOff Cancelled",
        refId: timeOff._id,
        message: `Driver ${currentDriver.name} cancelled their TimeOff request`,
        module: "drivers",
        importance: "high",
        from: userId,
        toRole: ["admin"],
      },
      userId,
      companyId,
      role,
    );

    // Log
    await logger.info(
      `Driver ${currentDriver._id} cancelled TimeOff ${timeOff._id} | Company: ${companyId}`,
    );

    return timeOff;
  },
);

// ============================================================
// CHECK TIME-OFF REMINDERS (1 DAY LEFT & END TODAY)
// ============================================================
export const checkAndNotifyTimeOffsCron = async () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  // 🔹 Approved TimeOffs only - get all companies
  const timeOffs = await timeOffModel
    .find({
      status: "approved",
      to: { $gte: today },
    })
    .populate("driver");

  // Group by company for notifications
  for (const timeOff of timeOffs) {
    const toDate = new Date(timeOff.to);
    toDate.setHours(0, 0, 0, 0);
    const companyId = timeOff.companyId;

    // ⏰ 1 day remaining
    if (toDate.getTime() === tomorrow.getTime()) {
      await createAndSendNotificationService(
        {
          title: "TimeOff Ending Tomorrow",
          refId: timeOff._id,
          message: `TimeOff for driver ${timeOff.driver.name} (${timeOff.driver.driverId}) will end tomorrow.`,
          module: "drivers",
          importance: "medium",
          toRole: ["employee", "admin"],
        },
        null,
        companyId,
        "admin",
      );

      await logger.info(
        `TimeOff reminder (1 day left) | TimeOffID: ${timeOff._id} | Company: ${companyId}`,
      );
    }

    // ⛔ Ends today
    if (toDate.getTime() === today.getTime()) {
      await createAndSendNotificationService(
        {
          title: "TimeOff Ends Today",
          refId: timeOff._id,
          message: `TimeOff for driver ${timeOff.driver.name} (${timeOff.driver.driverId}) ends today.`,
          module: "drivers",
          importance: "high",
          toRole: ["employee", "admin"],
        },
        null,
        companyId,
        "admin",
      );

      await logger.info(
        `TimeOff reminder (ends today) | TimeOffID: ${timeOff._id} | Company: ${companyId}`,
      );
    }
  }
};
