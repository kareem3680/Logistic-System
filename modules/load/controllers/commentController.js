import asyncHandler from "express-async-handler";
import {
  addCommentService,
  updateCommentService,
  deleteCommentService,
  getCommentsService,
} from "../services/commentService.js";

export const addComment = asyncHandler(async (req, res) => {
  const load = await addCommentService(req, req.companyId, req.user.role);

  res.status(201).json({
    message: "Comment added successfully",
    data: load,
  });
});

export const updateComment = asyncHandler(async (req, res) => {
  const load = await updateCommentService(req, req.companyId, req.user.role);

  res.status(200).json({
    message: "Comment updated successfully",
    data: load,
  });
});

export const deleteComment = asyncHandler(async (req, res) => {
  const load = await deleteCommentService(req, req.companyId, req.user.role);

  res.status(200).json({
    message: "Comment deleted successfully",
    data: load,
  });
});

export const getComments = asyncHandler(async (req, res) => {
  const result = await getCommentsService(req, req.companyId, req.user.role);

  res.status(200).json({
    message: "Comments retrieved successfully",
    loadId: result.loadId,
    comments: result.comments,
  });
});
