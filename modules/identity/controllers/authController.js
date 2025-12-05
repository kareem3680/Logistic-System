import asyncHandler from "express-async-handler";
import * as authService from "../services/authService.js";

export const signUp = asyncHandler(async (req, res) => {
  const result = await authService.registerUser(req.body, req);
  res.status(201).json({
    message: "User registered successfully",
    data: result.user,
    token: result.token,
  });
});

export const logIn = asyncHandler(async (req, res) => {
  const result = await authService.loginUser(req.body.email, req.body.password);
  res.status(200).json({
    message: "Logged in successfully",
    data: result.user,
    token: result.token,
  });
});

export const protect = asyncHandler(async (req, res, next) => {
  const user = await authService.protect(req);
  req.user = user;
  next();
});

export const allowedTo = (...roles) =>
  asyncHandler(async (req, res, next) => {
    await authService.allowedTo(req.user, roles);
    next();
  });
