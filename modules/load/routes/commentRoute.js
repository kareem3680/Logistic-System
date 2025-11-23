import { Router } from "express";
const router = Router();

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

router.post(
  "/:loadId",
  protect,
  allowedTo("admin", "employee", "driver"),
  addCommentValidator,
  addComment
);

router.patch(
  "/:loadId/:commentId",
  protect,
  allowedTo("admin", "employee"),
  updateCommentValidator,
  updateComment
);

router.delete(
  "/:loadId/:commentId",
  protect,
  allowedTo("admin", "employee"),
  deleteCommentValidator,
  deleteComment
);

router.get(
  "/:loadId",
  protect,
  allowedTo("admin", "employee"),
  getCommentsValidator,
  getComments
);

export default router;
