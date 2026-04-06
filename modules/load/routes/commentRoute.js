import { Router } from "express";
const router = Router({ mergeParams: true });

import {
  addComment,
  updateComment,
  deleteComment,
  getComments,
} from "../controllers/commentController.js";
import {
  addCommentValidator,
  updateCommentValidator,
  deleteCommentValidator,
  getCommentsValidator,
} from "../validators/commentValidator.js";
import {
  protect,
  allowedTo,
} from "../../identity/controllers/authController.js";
import { setCompany } from "../../../middlewares/companyMiddleware.js";

// Protect all routes
router.use(protect);
router.use(setCompany);

router
  .route("/:loadId")
  .post(
    allowedTo("admin", "employee", "driver"),
    addCommentValidator,
    addComment,
  )
  .get(
    allowedTo("admin", "employee", "driver"),
    getCommentsValidator,
    getComments,
  );

router
  .route("/:loadId/:commentId")
  .patch(
    allowedTo("admin", "employee", "driver"),
    updateCommentValidator,
    updateComment,
  )
  .delete(
    allowedTo("admin", "employee", "driver"),
    deleteCommentValidator,
    deleteComment,
  );

export default router;
