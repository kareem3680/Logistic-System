import asyncHandler from "express-async-handler";

import customerModel from "../models/customerModel.js";
import ApiError from "../../../utils/apiError.js";
import { sanitizeCustomer } from "../../../utils/sanitizeData.js";
import Logger from "../../../utils/loggerService.js";
const logger = new Logger("customer");

import {
  createService,
  getAllService,
  getSpecificService,
  updateService,
  deleteService,
} from "../../../utils/servicesHandler.js";

import { cacheWrapper, delCache } from "../../../utils/cache.js";

// ===============================
// GET ALL
// ===============================
export const getAllCustomersService = asyncHandler(
  async (req, companyId, role) => {
    if (!companyId) throw new ApiError("🛑 Company context is missing", 403);

    const cacheKey = `all:${JSON.stringify(req.query)}:${companyId}`;

    return await cacheWrapper(
      cacheKey,
      async () => {
        const result = await getAllService(
          customerModel,
          req.query,
          "customer",
          companyId,
          {},
          {},
          role,
        );

        const total = await customerModel.countDocuments({ companyId });
        const shipper = await customerModel.countDocuments({
          companyId,
          type: "shipper",
        });
        const receiver = await customerModel.countDocuments({
          companyId,
          type: "receiver",
        });

        const populatedData = await customerModel.populate(result.data, [
          { path: "createdBy", select: "name" },
          { path: "updatedBy", select: "name" },
        ]);

        await logger.info("Fetched all customers");

        return {
          stats: { total, shipper, receiver },
          data: populatedData.map(sanitizeCustomer),
          results: result.results,
          paginationResult: result.paginationResult,
        };
      },
      undefined,
      { namespace: "customers" },
    );
  },
);

// ===============================
// GET BY ID
// ===============================
export const getCustomerByIdService = asyncHandler(
  async (id, companyId, role) => {
    if (!companyId) throw new ApiError("🛑 Company context is missing", 403);

    const customer = await getSpecificService(
      customerModel,
      id,
      companyId,
      {},
      role,
    );

    const populatedCustomer = await customer.populate([
      { path: "createdBy", select: "name" },
      { path: "updatedBy", select: "name" },
    ]);

    await logger.info("Fetched customer", { id });

    return sanitizeCustomer(populatedCustomer);
  },
);

// ===============================
// CREATE
// ===============================
export const createCustomerService = asyncHandler(
  async (body, userId, companyId, role) => {
    if (!companyId) throw new ApiError("🛑 Company context is missing", 403);

    const { email } = body;

    if (email) {
      const existingCustomer = await customerModel.findOne({
        email,
        companyId,
      });

      if (existingCustomer) {
        await logger.error("Customer creation failed - email already exists", {
          email,
        });
        throw new ApiError("🛑 Email already exists", 400);
      }
    }

    const newCustomer = await createService(
      customerModel,
      {
        ...body,
        createdBy: userId,
        companyId,
      },
      companyId,
      role,
    );

    await delCache("customers:*");

    await logger.info("Customer created", { id: newCustomer._id });

    return sanitizeCustomer(newCustomer);
  },
);

// ===============================
// UPDATE
// ===============================
export const updateCustomerService = asyncHandler(
  async (id, body, userId, companyId, role) => {
    if (!companyId) throw new ApiError("🛑 Company context is missing", 403);

    const { email } = body;

    const customer = await customerModel.findOne({ _id: id, companyId });
    if (!customer) {
      await logger.error("Customer not found", { id });
      throw new ApiError(
        `🛑 Cannot update. No customer found with ID: ${id}`,
        404,
      );
    }

    if (email) {
      const existingCustomer = await customerModel.findOne({
        email,
        companyId,
        _id: { $ne: id },
      });

      if (existingCustomer) {
        await logger.error("Customer update failed - email already exists", {
          email,
        });
        throw new ApiError("🛑 Email already exists", 400);
      }
    }

    const updatedCustomer = await updateService(
      customerModel,
      id,
      { ...body, updatedBy: userId },
      companyId,
      role,
    );

    await delCache("customers:*");

    await logger.info("Customer updated", { id });

    return sanitizeCustomer(updatedCustomer);
  },
);

// ===============================
// DELETE
// ===============================
export const deleteCustomerService = asyncHandler(
  async (id, companyId, role) => {
    if (!companyId) throw new ApiError("🛑 Company context is missing", 403);

    await deleteService(customerModel, id, companyId, role);

    await delCache("customers:*");

    await logger.info("Customer deleted", { id });
  },
);
