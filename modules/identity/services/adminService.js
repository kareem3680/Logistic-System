import asyncHandler from "express-async-handler";

import sendEmail from "../../../utils/sendEmail.js";
import userModel from "../models/userModel.js";
import { sanitizeUser } from "../../../utils/sanitizeData.js";
import ApiError from "../../../utils/apiError.js";
import {
  createService,
  getAllService,
  getSpecificService,
} from "../../../utils/servicesHandler.js";
import Logger from "../../../utils/loggerService.js";
const logger = new Logger("admin");

export const createUserService = asyncHandler(async (body) => {
  const { ...rest } = body;

  const existingUser = await userModel.findOne({ email: rest.email });

  if (existingUser) {
    await logger.error("User creation failed - email already exists", {
      email: rest.email,
    });
    throw new ApiError("🛑 Email already exists", 400);
  }

  const newUser = await createService(userModel, rest);

  sendEmail({
    email: newUser.email,
    subject: "Welcome to Styles Dispatch",
    message:
      "Your account has been successfully created!\nThank you for joining us.",
  }).catch((err) =>
    logger.error("Email sending failed", { error: err.message })
  );

  await logger.info("User created", { userId: newUser._id });
  return sanitizeUser(newUser);
});

export const getUsersService = asyncHandler(async (req) => {
  const result = await getAllService(userModel, req.query, "user");

  const filtersForStats = result.finalFilter;

  const total = await userModel.countDocuments(filtersForStats);
  const drivers = await userModel.countDocuments({
    ...filtersForStats,
    role: "driver",
  });
  const admins = await userModel.countDocuments({
    ...filtersForStats,
    role: "admin",
  });
  const employee = await userModel.countDocuments({
    ...filtersForStats,
    role: "employee",
  });

  await logger.info("Fetched all users");

  return {
    stats: { total, drivers, admins, employee },
    data: result.data.map(sanitizeUser),
    results: result.results,
    paginationResult: result.paginationResult,
  };
});

export const getSpecificUserService = asyncHandler(async (id) => {
  const user = await getSpecificService(userModel, id);
  await logger.info("Fetched user", { id });
  return sanitizeUser(user);
});

export const updateUserRoleService = asyncHandler(
  async (id, role, body = {}) => {
    if (!role) {
      await logger.error("Role is missing", { id });
      throw new ApiError("🛑 Role is required to update the user", 400);
    }

    const user = await userModel.findById(id);
    if (!user) {
      await logger.error("User to update not found", { id });
      throw new ApiError(`🛑 Cannot update. No user found with ID: ${id}`, 404);
    }

    if (body.email) {
      const existingEmail = await userModel.findOne({ email: body.email });
      if (
        existingEmail &&
        existingEmail._id.toString() !== user._id.toString()
      ) {
        await logger.error("Email already in use", { email: body.email });
        throw new ApiError("🛑 E-Mail already exists", 400);
      }
      user.email = body.email;
    }

    user.role = role;
    await user.save();

    await logger.info("User role updated", { id, role });
    return sanitizeUser(user);
  }
);

export const deactivateUserService = asyncHandler(async (id) => {
  const user = await userModel.findByIdAndUpdate(
    id,
    { active: false },
    { new: true }
  );

  if (!user) {
    throw new Error("User not found");
  }

  await logger.info("User deactivated", { id });
  return user;
});

export const activateUserService = asyncHandler(async (id) => {
  const user = await userModel.findByIdAndUpdate(
    id,
    { active: true },
    { new: true }
  );

  if (!user) {
    throw new Error("User not found");
  }

  await logger.info("User activated", { id });
  return user;
});
