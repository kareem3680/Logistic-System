import asyncHandler from "express-async-handler";
import Maintenance from "../models/maintenanceModel.js";
import ServiceCenter from "../models/serviceCenterModel.js";
import Truck from "../../truck/models/truckModel.js";
import ApiError from "../../../utils/apiError.js";
import Logger from "../../../utils/loggerService.js";
import { cacheWrapper, delCache } from "../../../utils/cache.js";
import {
  createService,
  getAllService,
  getSpecificService,
  deleteService,
} from "../../../utils/servicesHandler.js";
import { sanitizeMaintenance } from "../../../utils/sanitizeData.js";
import { createAndSendNotificationService } from "../../notifications/services/notificationService.js";

const logger = new Logger("maintenance");

// Helper functions
function calculateNextDueDate(lastDoneAt, intervalDays) {
  if (!lastDoneAt || !intervalDays) return null;
  const next = new Date(lastDoneAt);
  next.setDate(next.getDate() + intervalDays);
  return next;
}

function calculateNextDueMile(lastDoneMile, intervalMile) {
  if (!lastDoneMile || !intervalMile) return null;
  return lastDoneMile + intervalMile;
}

// Create Maintenance
export const createMaintenanceService = asyncHandler(
  async (body, userId, companyId, role) => {
    // Validate company context
    if (role !== "super-admin" && !companyId) {
      throw new ApiError("🛑 Company context is missing", 403);
    }

    if (body.serviceCenter) {
      const serviceCenterExists = await ServiceCenter.findOne({
        _id: body.serviceCenter,
        ...(role !== "super-admin" ? { companyId } : {}),
      });
      if (!serviceCenterExists) {
        throw new ApiError("Service center not found in your company", 404);
      }
    }

    // Validate trucks belong to same company
    const truckIds = body.statusPerTruck.map((t) => t.truck);
    const trucksExist = await Truck.find({
      _id: { $in: truckIds },
      ...(role !== "super-admin" ? { companyId } : {}),
    });

    if (trucksExist.length !== truckIds.length) {
      throw new ApiError("One or more trucks not found in your company", 404);
    }

    const statusPerTruck = body.statusPerTruck.map((t) => ({
      truck: t.truck,
      status: "upcoming",
      lastDoneAt: t.lastDoneAt || null,
      lastDoneMile: t.lastDoneMile || null,
      nextDueDate: t.lastDoneAt
        ? calculateNextDueDate(t.lastDoneAt, body.intervalDays)
        : null,
      nextDueMile: t.lastDoneMile
        ? calculateNextDueMile(t.lastDoneMile, body.intervalMile)
        : null,
    }));

    const maintenance = await createService(
      Maintenance,
      {
        ...body,
        statusPerTruck,
        createdBy: userId,
        companyId,
      },
      companyId,
      role,
    );

    await maintenance.populate([
      { path: "statusPerTruck.truck", select: "plateNumber totalMileage" },
      { path: "serviceCenter", select: "name" },
      { path: "createdBy", select: "name" },
      { path: "updatedBy", select: "name" },
    ]);

    await delCache("maintenances:*");
    await logger.info("Maintenance created", {
      maintenanceId: maintenance._id,
      companyId,
    });

    await createAndSendNotificationService(
      {
        title: "New Maintenance Scheduled",
        refId: maintenance._id,
        message: `New maintenance created for trucks: ${maintenance.statusPerTruck
          .map((t) => t.truck.plateNumber)
          .join(", ")}`,
        module: "maintenance",
        importance: "medium",
        from: userId,
        toRole: ["admin"],
      },
      userId,
      companyId,
      role,
    );

    return sanitizeMaintenance(maintenance);
  },
);

// Get All Maintenances
export const getAllMaintenancesService = asyncHandler(
  async (req, companyId, role) => {
    // Validate company context
    if (role !== "super-admin" && !companyId) {
      throw new ApiError("🛑 Company context is missing", 403);
    }

    const cacheKey = `all:${JSON.stringify(req.query)}:${companyId}`;

    return await cacheWrapper(
      cacheKey,
      async () => {
        const result = await getAllService(
          Maintenance,
          req.query,
          "maintenance",
          companyId,
          {}, // filter
          {}, // options
          role,
        );

        const populatedData = await Maintenance.populate(result.data, [
          { path: "statusPerTruck.truck", select: "plateNumber totalMileage" },
          { path: "serviceCenter", select: "name" },
          { path: "createdBy", select: "name" },
          { path: "updatedBy", select: "name" },
        ]);

        // Build stats filter with company context
        const statsFilter = {};
        if (role !== "super-admin") {
          statsFilter.companyId = companyId;
        }

        const statsAggregation = await Maintenance.aggregate([
          { $match: statsFilter },
          { $unwind: "$statusPerTruck" },
          {
            $group: {
              _id: null,
              total: { $sum: 1 },
              upcoming: {
                $sum: {
                  $cond: [
                    { $eq: ["$statusPerTruck.status", "upcoming"] },
                    1,
                    0,
                  ],
                },
              },
              overdue: {
                $sum: {
                  $cond: [{ $eq: ["$statusPerTruck.status", "overdue"] }, 1, 0],
                },
              },
            },
          },
        ]);

        const rawStats = statsAggregation[0] || {
          total: 0,
          upcoming: 0,
          overdue: 0,
        };

        const { _id, ...finalStats } = rawStats;

        await logger.info("Fetched all maintenances", { companyId });

        return {
          stats: finalStats,
          data: populatedData.map(sanitizeMaintenance),
          results: result.results,
          paginationResult: result.paginationResult,
        };
      },
      undefined,
      { namespace: "maintenances" },
    );
  },
);

// Get Maintenance By ID
export const getMaintenanceByIdService = asyncHandler(
  async (id, companyId, role) => {
    // Validate company context
    if (role !== "super-admin" && !companyId) {
      throw new ApiError("🛑 Company context is missing", 403);
    }

    return await cacheWrapper(
      `id:${id}:${companyId}`,
      async () => {
        const maintenance = await getSpecificService(
          Maintenance,
          id,
          companyId,
          {},
          role,
        );
        if (!maintenance) throw new ApiError("Maintenance not found", 404);

        const populated = await maintenance.populate([
          { path: "statusPerTruck.truck", select: "plateNumber totalMileage" },
          { path: "serviceCenter", select: "name" },
          { path: "createdBy", select: "name" },
          { path: "updatedBy", select: "name" },
        ]);

        await logger.info("Fetched maintenance", { id, companyId });

        return sanitizeMaintenance(populated);
      },
      undefined,
      { namespace: "maintenances" },
    );
  },
);

// Update Maintenance or Single Truck
export const updateMaintenanceService = asyncHandler(
  async (id, body, userId, companyId, role) => {
    // Validate company context
    if (role !== "super-admin" && !companyId) {
      throw new ApiError("🛑 Company context is missing", 403);
    }

    const maintenance = await getSpecificService(
      Maintenance,
      id,
      companyId,
      {},
      role,
    );
    if (!maintenance)
      throw new ApiError("Maintenance not found in your company", 404);

    let updated = false;

    if (body.serviceCenter !== undefined) {
      if (body.serviceCenter === null) {
        maintenance.serviceCenter = null;
        updated = true;
      } else {
        const serviceCenterExists = await ServiceCenter.findOne({
          _id: body.serviceCenter,
          ...(role !== "super-admin" ? { companyId } : {}),
        });
        if (!serviceCenterExists) {
          throw new ApiError("Service center not found in your company", 404);
        }
        maintenance.serviceCenter = body.serviceCenter;
        updated = true;
      }
    }

    if (Array.isArray(body.statusPerTruck)) {
      for (const truckUpdate of body.statusPerTruck) {
        const truckExists = await Truck.findOne({
          _id: truckUpdate.truck,
          ...(role !== "super-admin" ? { companyId } : {}),
        });
        if (!truckExists) {
          throw new ApiError(
            `Truck with ID ${truckUpdate.truck} not found in your company`,
            404,
          );
        }

        let truckEntry = maintenance.statusPerTruck.find(
          (t) => t.truck.toString() === truckUpdate.truck,
        );

        let isNewTruck = false;

        if (!truckEntry) {
          truckEntry = {
            truck: truckUpdate.truck,
            status: "upcoming",
            lastDoneAt: truckUpdate.lastDoneAt || null,
            lastDoneMile: truckUpdate.lastDoneMile || null,
            nextDueDate: truckUpdate.lastDoneAt
              ? calculateNextDueDate(
                  truckUpdate.lastDoneAt,
                  maintenance.intervalDays,
                )
              : null,
            nextDueMile: truckUpdate.lastDoneMile
              ? calculateNextDueMile(
                  truckUpdate.lastDoneMile,
                  maintenance.intervalMile,
                )
              : null,
          };
          maintenance.statusPerTruck.push(truckEntry);
          isNewTruck = true;
        } else {
          if (truckUpdate.lastDoneAt !== undefined) {
            truckEntry.lastDoneAt = truckUpdate.lastDoneAt;
            if (maintenance.repeatBy === "time") {
              truckEntry.nextDueDate = calculateNextDueDate(
                truckEntry.lastDoneAt,
                maintenance.intervalDays,
              );
            }
          }
          if (truckUpdate.lastDoneMile !== undefined) {
            truckEntry.lastDoneMile = truckUpdate.lastDoneMile;
            if (maintenance.repeatBy === "mile") {
              truckEntry.nextDueMile = calculateNextDueMile(
                truckEntry.lastDoneMile,
                maintenance.intervalMile,
              );
            }
          }
        }

        if (truckEntry.status === "overdue") truckEntry.status = "upcoming";
        updated = true;

        await createAndSendNotificationService(
          {
            title: isNewTruck ? "New Maintenance Added" : "Maintenance Updated",
            refId: maintenance._id,
            message: `Maintenance for truck ${truckExists.plateNumber} has been ${
              isNewTruck ? "added" : "updated"
            }`,
            module: "maintenance",
            importance: "medium",
            from: userId,
            toRole: ["admin"],
          },
          userId,
          companyId,
          role,
        );
      }
    }

    const otherFields = { ...body };
    delete otherFields.statusPerTruck;
    delete otherFields.serviceCenter;

    if (Object.keys(otherFields).length > 0) {
      Object.assign(maintenance, otherFields);

      maintenance.statusPerTruck.forEach((t) => {
        if (maintenance.repeatBy === "time" && t.lastDoneAt) {
          t.nextDueDate = calculateNextDueDate(
            t.lastDoneAt,
            maintenance.intervalDays,
          );
        } else if (maintenance.repeatBy === "mile" && t.lastDoneMile !== null) {
          t.nextDueMile = calculateNextDueMile(
            t.lastDoneMile,
            maintenance.intervalMile,
          );
        }
      });

      updated = true;
    }

    if (updated) {
      maintenance.updatedBy = userId;
      await maintenance.save();
      await delCache("maintenances:*");
      await logger.info("Maintenance updated", {
        id: maintenance._id,
        companyId,
      });
    }

    // Populate & Sanitize
    const populated = await maintenance.populate([
      { path: "statusPerTruck.truck", select: "plateNumber totalMileage" },
      { path: "serviceCenter", select: "name" },
      { path: "createdBy", select: "name" },
      { path: "updatedBy", select: "name" },
    ]);

    return sanitizeMaintenance(populated);
  },
);

// Delete Maintenance
export const deleteMaintenanceService = asyncHandler(
  async (id, companyId, role) => {
    // Validate company context
    if (role !== "super-admin" && !companyId) {
      throw new ApiError("🛑 Company context is missing", 403);
    }

    await deleteService(Maintenance, id, companyId, role);
    await delCache("maintenances:*");
    await logger.info("Maintenance deleted", { id, companyId });
    return;
  },
);

// Cron: Check due maintenances & send reminders
export const checkAndNotifyMaintenancesCron = asyncHandler(async () => {
  try {
    const now = new Date();

    // Get all companies' maintenances (super-admin level)
    const maintenances = await Maintenance.find({
      $or: [
        {
          repeatBy: "time",
          "statusPerTruck.nextDueDate": {
            $lte: new Date(now.getTime() + 1000 * 60 * 60 * 24 * 365),
          },
        },
        { repeatBy: "mile", "statusPerTruck.nextDueMile": { $exists: true } },
      ],
    }).populate("statusPerTruck.truck");

    for (const m of maintenances) {
      let saveNeeded = false;

      for (const t of m.statusPerTruck) {
        const truck = t.truck;
        if (!truck) continue;

        // ---------- Time-based ----------
        if (m.repeatBy === "time" && t.nextDueDate) {
          if (
            m.remindBeforeDays &&
            (!t.lastReminderAt ||
              t.lastReminderAt.toDateString() !== now.toDateString())
          ) {
            const remindDate = new Date(t.nextDueDate);
            remindDate.setDate(remindDate.getDate() - m.remindBeforeDays);

            if (now >= remindDate && now < t.nextDueDate) {
              await createAndSendNotificationService(
                {
                  title: "Maintenance Reminder",
                  refId: m._id,
                  message: `Maintenance for truck ${
                    truck.plateNumber
                  } will be due on ${t.nextDueDate.toDateString()}`,
                  module: "maintenance",
                  importance: "medium",
                  toRole: ["admin"],
                },
                null,
                m.companyId,
                "admin",
              ); // Pass companyId from maintenance
              t.lastReminderAt = now;
              saveNeeded = true;
            }
          }

          if (now >= t.nextDueDate && t.status !== "overdue") {
            t.status = "overdue";
            saveNeeded = true;
            await createAndSendNotificationService(
              {
                title: "Maintenance Overdue",
                refId: m._id,
                message: `Maintenance overdue for truck ${
                  truck.plateNumber
                } at ${t.nextDueDate.toDateString()}`,
                module: "maintenance",
                importance: "high",
                toRole: ["admin"],
              },
              null,
              m.companyId,
              "admin",
            );
          }
        }

        // ---------- Mile-based ----------
        if (m.repeatBy === "mile" && t.nextDueMile !== null) {
          const currentMile = truck.totalMileage ?? 0;

          if (
            m.remindBeforeMile &&
            (t.lastReminderMile === undefined ||
              t.lastReminderMile < currentMile)
          ) {
            const remindMile = t.nextDueMile - m.remindBeforeMile;

            if (currentMile >= remindMile && currentMile < t.nextDueMile) {
              await createAndSendNotificationService(
                {
                  title: "Maintenance Reminder (Miles)",
                  refId: m._id,
                  message: `Maintenance for truck ${truck.plateNumber} will be due at ${t.nextDueMile} miles`,
                  module: "maintenance",
                  importance: "medium",
                  toRole: ["admin"],
                },
                null,
                m.companyId,
                "admin",
              );

              t.lastReminderMile = currentMile;
              saveNeeded = true;
            }
          }

          if (currentMile >= t.nextDueMile && t.status !== "overdue") {
            t.status = "overdue";
            saveNeeded = true;
            await createAndSendNotificationService(
              {
                title: "Maintenance Overdue (Miles)",
                refId: m._id,
                message: `Maintenance overdue for truck ${truck.plateNumber} at ${t.nextDueMile} miles`,
                module: "maintenance",
                importance: "high",
                toRole: ["admin"],
              },
              null,
              m.companyId,
              "admin",
            );
          }
        }
      }

      if (saveNeeded) await m.save();
    }

    await logger.info("Cron: Checked due maintenances & sent reminders", {
      count: maintenances.length,
    });
  } catch (error) {
    await logger.error("Cron: Error checking due maintenances", { error });
  }
});
