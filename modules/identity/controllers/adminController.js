import asyncHandler from "express-async-handler";

import {
  createUserService,
  getUsersService,
  getSpecificUserService,
  updateUserRoleService,
  deactivateUserService,
  activateUserService,
} from "../services/adminService.js";

export const createUser = asyncHandler(async (req, res) => {
  const data = await createUserService(req.body);
  res.status(201).json({
    message: "User created successfully",
    data,
  });
});

export const getUsers = asyncHandler(async (req, res) => {
  const response = await getUsersService(req);
  res.status(200).json({
    message: "Users fetched successfully",
    ...response,
  });
});

export const getSpecificUser = asyncHandler(async (req, res) => {
  const data = await getSpecificUserService(req.params.id);
  res.status(200).json({
    message: "User retrieved successfully",
    data,
  });
});

export const updateUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const data = await updateUserRoleService(id, req.body.role);
  res.status(200).json({
    message: "User role updated successfully",
    data,
  });
});

export const activateUser = asyncHandler(async (req, res) => {
  await activateUserService(req.params.id);
  res.status(202).json({
    message: "User activated successfully",
  });
});

export const deactivateUser = asyncHandler(async (req, res) => {
  await deactivateUserService(req.params.id);
  res.status(202).json({
    message: "User deactivated successfully",
  });
});
