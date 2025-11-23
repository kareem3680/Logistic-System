import asyncHandler from "express-async-handler";
import customerModel from "../models/customerModel.js";
import ApiError from "../../../utils/apiError.js";
import { sanitizeCustomer } from "../../../utils/sanitizeData.js";
import {
  createService,
  getAllService,
  getSpecificService,
  updateService,
  deleteService,
} from "../../../utils/servicesHandler.js";
import Logger from "../../../utils/loggerService.js";
import { cacheWrapper, delCache } from "../../../utils/cache.js";

const logger = new Logger("customer");

export const createCustomerService = asyncHandler(async (body, userId) => {
  const { email } = body;

  if (email) {
    const existingEmail = await customerModel.findOne({ email });
    if (existingEmail) {
      await logger.error("Customer creation failed - email already exists", {
        email,
      });
      throw new ApiError("🛑 Email already exists", 400);
    }
  }

  const newCustomer = await createService(customerModel, {
    ...body,
    createdBy: userId,
  });

  await delCache("customers:*");

  await logger.info("Customer created", { id: newCustomer._id });
  return sanitizeCustomer(newCustomer);
});

export const getAllCustomersService = asyncHandler(async (req) => {
  const cacheKey = `all:${JSON.stringify(req.query)}`;

  return await cacheWrapper(
    cacheKey,
    async () => {
      const result = await getAllService(customerModel, req.query, "customer");

      const filtersForStats = result.finalFilter;

      const total = await customerModel.countDocuments(filtersForStats);
      const shipper = await customerModel.countDocuments({
        ...filtersForStats,
        type: "shipper",
      });
      const receiver = await customerModel.countDocuments({
        ...filtersForStats,
        type: "receiver",
      });

      const populatedData = await customerModel.populate(result.data, [
        { path: "createdBy", select: "name" },
        { path: "updatedBy", select: "name" },
      ]);

      const sanitizedData = populatedData.map((customer) =>
        sanitizeCustomer(customer)
      );

      await logger.info("Fetched all customers");

      return {
        stats: { total, shipper, receiver },
        results: result.results,
        paginationResult: result.paginationResult,
        data: sanitizedData,
      };
    },
    undefined,
    { namespace: "customers" }
  );
});

export const getCustomerByIdService = asyncHandler(async (id) => {
  const customer = await getSpecificService(customerModel, id, {
    populate: [
      { path: "createdBy", select: "name" },
      { path: "updatedBy", select: "name" },
    ],
  });

  await logger.info("Fetched customer", { id });
  return sanitizeCustomer(customer);
});

export const updateCustomerService = asyncHandler(async (id, body, userId) => {
  const { email } = body;

  const customer = await customerModel.findById(id);
  if (!customer) {
    await logger.error("Customer not found", { id });
    throw new ApiError(
      `🛑 Cannot update. No customer found with ID: ${id}`,
      404
    );
  }

  if (email) {
    const existingEmail = await customerModel.findOne({ email });
    if (
      existingEmail &&
      existingEmail._id.toString() !== customer._id.toString()
    ) {
      await logger.error("Email already in use", { email });
      throw new ApiError("🛑 Email already exists", 400);
    }
  }

  const updatedCustomer = await updateService(customerModel, id, {
    ...body,
    updatedBy: userId,
  });

  await delCache("customers:*");

  await logger.info("Customer updated", { id });
  return sanitizeCustomer(updatedCustomer);
});

export const deleteCustomerService = asyncHandler(async (id) => {
  await deleteService(customerModel, id);

  await delCache("customers:*");

  await logger.info("Customer deleted", { id });
  return;
});
