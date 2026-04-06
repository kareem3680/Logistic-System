import asyncHandler from "express-async-handler";

import sendEmail from "../../../utils/sendEmail.js";
import userModel from "../models/userModel.js";
import driverModel from "../../driver/models/driverModel.js";
import { sanitizeUser } from "../../../utils/sanitizeData.js";
import ApiError from "../../../utils/apiError.js";
import {
  createService,
  getAllService,
  getSpecificService,
  updateService,
} from "../../../utils/servicesHandler.js";
import { delCache } from "../../../utils/cache.js";
import Logger from "../../../utils/loggerService.js";

const logger = new Logger("admin");

/**
 * ==============================
 * CREATE USER
 * ==============================
 */
export const createUserService = asyncHandler(async (req) => {
  const { role, companyId: bodyCompanyId, ...rest } = req.body;

  if (role === "super-admin") {
    throw new ApiError("🚫 You cannot assign super-admin role", 403);
  }

  let companyIdToUse;

  if (req.user.role === "super-admin") {
    if (!bodyCompanyId) {
      throw new ApiError("Company ID is required for super-admin", 400);
    }
    companyIdToUse = bodyCompanyId;
  } else {
    if (!req.companyId) {
      throw new ApiError("Company context is required", 403);
    }
    companyIdToUse = req.companyId;
  }

  const existingUser = await userModel.findOne({
    email: rest.email,
    companyId: companyIdToUse,
  });

  if (existingUser) {
    throw new ApiError("🛑 Email already exists for this company", 400);
  }

  const newUser = await createService(
    userModel,
    { ...rest, role },
    companyIdToUse,
  );

  sendEmail({
    email: newUser.email,
    subject: "Welcome to Styles Dispatch",
    message:
      "Your account has been successfully created!\nThank you for joining us.",
  }).catch((err) =>
    logger.error("Email sending failed", { error: err.message }),
  );

  await delCache("companies:*");

  await logger.info("User created", {
    userId: newUser._id,
    companyId: companyIdToUse,
    createdBy: req.user._id,
  });

  return sanitizeUser(newUser);
});

/**
 * ==============================
 * GET ALL USERS
 * ==============================
 */
export const getUsersService = asyncHandler(async (req) => {
  const result = await getAllService(
    userModel,
    req.query,
    "user",
    req.companyId,
  );

  const filters = { companyId: req.companyId };

  const total = await userModel.countDocuments(filters);
  const drivers = await userModel.countDocuments({
    ...filters,
    role: "driver",
  });
  const admins = await userModel.countDocuments({
    ...filters,
    role: "admin",
  });
  const employee = await userModel.countDocuments({
    ...filters,
    role: "employee",
  });

  await logger.info("Fetched all users", {
    companyId: req.companyId,
  });

  return {
    stats: { total, drivers, admins, employee },
    data: result.data.map(sanitizeUser),
    results: result.results,
    paginationResult: result.paginationResult,
  };
});

/**
 * ==============================
 * GET SPECIFIC USER
 * ==============================
 */
export const getSpecificUserService = asyncHandler(async (id, companyId) => {
  const user = await getSpecificService(userModel, id, companyId);

  await logger.info("Fetched user", { id, companyId });
  return sanitizeUser(user);
});

/**
 * ==============================
 * UPDATE USER ROLE
 * ==============================
 */
export const updateUserRoleService = asyncHandler(
  async (id, role, companyId) => {
    if (!role) {
      throw new ApiError("🛑 Role is required", 400);
    }

    const user = await userModel.findOne({ _id: id, companyId });
    if (!user) {
      throw new ApiError("🛑 User not found for this company", 404);
    }

    user.role = role;
    await user.save();

    await logger.info("User role updated", { id, role, companyId });
    return sanitizeUser(user);
  },
);

/**
 * ==============================
 * DEACTIVATE USER
 * ==============================
 */
export const deactivateUserService = asyncHandler(async (id, companyId) => {
  const user = await userModel.findOneAndUpdate(
    { _id: id, companyId },
    { active: false },
    { new: true },
  );

  if (!user) {
    throw new ApiError("🛑 User not found for this company", 404);
  }

  if (user.role === "driver") {
    await driverModel.findOneAndUpdate(
      { user: user._id, companyId },
      { status: "inactive" },
    );
    await delCache(`drivers:${companyId}:*`);
  }

  await logger.info("User deactivated", { id, companyId });
  return;
});

/**
 * ==============================
 * ACTIVATE USER
 * ==============================
 */
export const activateUserService = asyncHandler(async (id, companyId) => {
  const user = await userModel.findOneAndUpdate(
    { _id: id, companyId },
    { active: true },
    { new: true },
  );

  if (!user) {
    throw new ApiError("🛑 User not found for this company", 404);
  }

  if (user.role === "driver") {
    await driverModel.findOneAndUpdate(
      { user: user._id, companyId },
      { status: "available" },
    );
    await delCache(`drivers:${companyId}:*`);
  }

  await logger.info("User activated", { id, companyId });
  return;
});
