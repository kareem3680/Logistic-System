import { Router } from "express";
const router = Router();

import {
  getUsers,
  createUser,
  getSpecificUser,
  updateUser,
  deactivateUser,
  activateUser,
} from "../controllers/adminController.js";

import {
  createUserValidator,
  getUserValidator,
  updateUserValidator,
  deactivateUserValidator,
  activateUserValidator,
} from "../validators/adminValidator.js";

import { protect, allowedTo } from "../controllers/authController.js";

// -----------------------------
// Middleware
// -----------------------------
const setCompanyContext = (req, res, next) => {
  if (req.user.role !== "super-admin") {
    if (!req.user.companyId) {
      return res.status(403).json({ message: "🛑 Company context is missing" });
    }
    req.companyId = req.user.companyId;
  }
  next();
};

// -----------------------------
// Routes
// -----------------------------
router
  .route("/")
  .get(
    protect,
    allowedTo("super-admin", "admin", "employee"),
    setCompanyContext,
    getUsers,
  )
  .post(
    protect,
    allowedTo("super-admin", "admin"),
    setCompanyContext,
    createUserValidator,
    createUser,
  );

router
  .route("/:id")
  .get(
    protect,
    allowedTo("admin"),
    setCompanyContext,
    getUserValidator,
    getSpecificUser,
  )
  .patch(
    protect,
    allowedTo("admin"),
    setCompanyContext,
    updateUserValidator,
    updateUser,
  );

router
  .route("/deactivate/:id")
  .patch(
    protect,
    allowedTo("admin"),
    setCompanyContext,
    deactivateUserValidator,
    deactivateUser,
  );

router
  .route("/activate/:id")
  .patch(
    protect,
    allowedTo("admin"),
    setCompanyContext,
    activateUserValidator,
    activateUser,
  );

export default router;
