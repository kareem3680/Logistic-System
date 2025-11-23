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

router
  .route("/")
  .get(protect, allowedTo("admin"), getUsers)
  .post(protect, allowedTo("admin"), createUserValidator, createUser);

router
  .route("/:id")
  .get(protect, allowedTo("admin"), getUserValidator, getSpecificUser)
  .patch(protect, allowedTo("admin"), updateUserValidator, updateUser);

router
  .route("/deactivate/:id")
  .patch(protect, allowedTo("admin"), deactivateUserValidator, deactivateUser);

router
  .route("/activate/:id")
  .patch(protect, allowedTo("admin"), activateUserValidator, activateUser);

export default router;
