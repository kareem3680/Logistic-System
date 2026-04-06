import asyncHandler from "express-async-handler";
import ServiceCenter from "../models/serviceCenterModel.js";
import ApiError from "../../../utils/apiError.js";
import Logger from "../../../utils/loggerService.js";
import { cacheWrapper, delCache } from "../../../utils/cache.js";
import {
  createService,
  getAllService,
  getSpecificService,
  deleteService,
} from "../../../utils/servicesHandler.js";
import { sanitizeServiceCenter } from "../../../utils/sanitizeData.js";
import { createAndSendNotificationService } from "../../notifications/services/notificationService.js";

const logger = new Logger("service-center");

// -----------------------------
// Create Service Center
// -----------------------------
export const createServiceCenterService = asyncHandler(
  async (body, userId, companyId, role) => {
    // Validate company context
    if (role !== "super-admin" && !companyId) {
      throw new ApiError("🛑 Company context is missing", 403);
    }

    if (!body.location || !body.location.coordinates) {
      throw new ApiError("Location with coordinates is required", 400);
    }

    const serviceCenter = await createService(
      ServiceCenter,
      {
        ...body,
        createdBy: userId,
        companyId,
      },
      companyId,
      role,
    );

    // Populate
    await serviceCenter.populate([
      { path: "createdBy", select: "name" },
      { path: "updatedBy", select: "name" },
    ]);

    await delCache(`service-centers:*${companyId}*`);

    await logger.info("Service center created", {
      serviceCenterId: serviceCenter._id,
      companyId,
    });

    await createAndSendNotificationService(
      {
        title: "New Service Center Added",
        refId: serviceCenter._id,
        message: `New service center created: ${serviceCenter.name}`,
        module: "service-center",
        importance: "medium",
        from: userId,
        toRole: ["admin"],
      },
      userId,
      companyId,
      role,
    );

    return sanitizeServiceCenter(serviceCenter);
  },
);

// -----------------------------
// Get All Service Centers
// -----------------------------
export const getAllServiceCentersService = asyncHandler(
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
          ServiceCenter,
          req.query,
          "service-center",
          companyId,
          {}, // filter
          {}, // options
          role,
        );

        const populatedData = await ServiceCenter.populate(result.data, [
          { path: "createdBy", select: "name" },
          { path: "updatedBy", select: "name" },
        ]);

        // Build stats filter with company context
        const statsFilter = {};
        if (role !== "super-admin") {
          statsFilter.companyId = companyId;
        }

        const statsAggregation = await ServiceCenter.aggregate([
          { $match: statsFilter },
          {
            $group: {
              _id: null,
              total: { $sum: 1 },
              active: {
                $sum: {
                  $cond: [{ $eq: ["$active", true] }, 1, 0],
                },
              },
              inactive: {
                $sum: {
                  $cond: [{ $eq: ["$active", false] }, 1, 0],
                },
              },
            },
          },
        ]);

        const rawStats = statsAggregation[0] || {
          total: 0,
          active: 0,
          inactive: 0,
        };

        const { _id, ...finalStats } = rawStats;

        await logger.info("Fetched all service centers", { companyId });

        return {
          stats: finalStats,
          data: populatedData.map(sanitizeServiceCenter),
          results: result.results,
          paginationResult: result.paginationResult,
        };
      },
      undefined,
      { namespace: "service-centers" },
    );
  },
);

// -----------------------------
// Get Service Center By ID
// -----------------------------
export const getServiceCenterByIdService = asyncHandler(
  async (id, companyId, role) => {
    // Validate company context
    if (role !== "super-admin" && !companyId) {
      throw new ApiError("🛑 Company context is missing", 403);
    }

    return await cacheWrapper(
      `id:${id}:${companyId}`,
      async () => {
        const serviceCenter = await getSpecificService(
          ServiceCenter,
          id,
          companyId,
          {},
          role,
        );
        if (!serviceCenter)
          throw new ApiError("Service center not found in your company", 404);

        const populated = await serviceCenter.populate([
          { path: "createdBy", select: "name" },
          { path: "updatedBy", select: "name" },
        ]);

        await logger.info("Fetched service center", { id, companyId });

        return sanitizeServiceCenter(populated);
      },
      undefined,
      { namespace: "service-centers" },
    );
  },
);

// -----------------------------
// Update Service Center
// -----------------------------
export const updateServiceCenterService = asyncHandler(
  async (id, body, userId, companyId, role) => {
    // Validate company context
    if (role !== "super-admin" && !companyId) {
      throw new ApiError("🛑 Company context is missing", 403);
    }

    const serviceCenter = await getSpecificService(
      ServiceCenter,
      id,
      companyId,
      {},
      role,
    );
    if (!serviceCenter)
      throw new ApiError("Service center not found in your company", 404);

    let updated = false;

    const updatableFields = [
      "name",
      "city",
      "state",
      "address",
      "location",
      "phone",
      "email",
      "active",
      "availability",
      "services",
      "notes",
    ];

    updatableFields.forEach((field) => {
      if (body[field] !== undefined) {
        serviceCenter[field] = body[field];
        updated = true;
      }
    });

    if (updated) {
      serviceCenter.updatedBy = userId;
      await serviceCenter.save();
      await delCache(`service-centers:*${companyId}*`);
      await logger.info("Service center updated", {
        id: serviceCenter._id,
        companyId,
      });

      await createAndSendNotificationService(
        {
          title: "Service Center Updated",
          refId: serviceCenter._id,
          message: `Service center updated: ${serviceCenter.name}`,
          module: "service-center",
          importance: "medium",
          from: userId,
          toRole: ["admin"],
        },
        userId,
        companyId,
        role,
      );
    }

    // Populate & Sanitize
    const populated = await serviceCenter.populate([
      { path: "createdBy", select: "name" },
      { path: "updatedBy", select: "name" },
    ]);

    return sanitizeServiceCenter(populated);
  },
);

// -----------------------------
// Delete Service Center
// -----------------------------
export const deleteServiceCenterService = asyncHandler(
  async (id, companyId, role) => {
    // Validate company context
    if (role !== "super-admin" && !companyId) {
      throw new ApiError("🛑 Company context is missing", 403);
    }

    await deleteService(ServiceCenter, id, companyId, role);
    await delCache(`service-centers:*${companyId}*`);
    await logger.info("Service center deleted", { id, companyId });
    return;
  },
);

// -----------------------------
// Get Service Centers Stats
// -----------------------------
export const getServiceCentersStatsService = asyncHandler(
  async (companyId, role) => {
    // Validate company context
    if (role !== "super-admin" && !companyId) {
      throw new ApiError("🛑 Company context is missing", 403);
    }

    const cacheKey = `stats:all:${companyId}`;

    return await cacheWrapper(
      cacheKey,
      async () => {
        const matchFilter = {};
        if (role !== "super-admin") {
          matchFilter.companyId = companyId;
        }

        const stats = await ServiceCenter.aggregate([
          { $match: matchFilter },
          {
            $group: {
              _id: null,
              total: { $sum: 1 },
              active: { $sum: { $cond: [{ $eq: ["$active", true] }, 1, 0] } },
              inactive: {
                $sum: { $cond: [{ $eq: ["$active", false] }, 1, 0] },
              },
              byCity: { $push: "$city" },
              servicesCount: {
                $sum: { $size: { $ifNull: ["$services", []] } },
              },
            },
          },
          {
            $project: {
              _id: 0,
              total: 1,
              active: 1,
              inactive: 1,
              uniqueCities: { $size: { $setUnion: ["$byCity", []] } },
              avgServicesPerCenter: {
                $cond: [
                  { $eq: ["$total", 0] },
                  0,
                  { $divide: ["$servicesCount", "$total"] },
                ],
              },
            },
          },
        ]);

        const result = stats[0] || {
          total: 0,
          active: 0,
          inactive: 0,
          uniqueCities: 0,
          avgServicesPerCenter: 0,
        };

        await logger.info("Fetched service centers stats", { companyId });

        return result;
      },
      undefined,
      { namespace: "service-centers", ttl: 300 },
    );
  },
);
