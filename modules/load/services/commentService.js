import asyncHandler from "express-async-handler";

import loadModel from "../models/loadModel.js";
import driverModel from "../../driver/models/driverModel.js";
import ApiError from "../../../utils/apiError.js";
import { sanitizeLoad } from "../../../utils/sanitizeData.js";
import { createAndSendNotificationService } from "../../notifications/services/notificationService.js";
import Logger from "../../../utils/loggerService.js";
import { delCache } from "../../../utils/cache.js";

const logger = new Logger("load");

export const addCommentService = asyncHandler(async (req, companyId, role) => {
  // Validate company context
  if (role !== "super-admin" && !companyId) {
    throw new ApiError("🛑 Company context is missing", 403);
  }

  const { loadId } = req.params;
  const { text, type } = req.body;
  const userId = req.user._id;
  const userRole = req.user.role;

  // 1) Find load in this company
  const load = await loadModel.findOne({ _id: loadId, companyId });
  if (!load) throw new ApiError("🛑 Load not found in your company", 404);

  // If driver, verify load ownership
  if (userRole === "driver") {
    const currentDriver = await driverModel
      .findOne({ user: userId, companyId })
      .select("_id name");
    if (!currentDriver)
      throw new ApiError(
        "🛑 This user is not linked to any driver account in your company",
        404,
      );

    if (
      !load.driverId ||
      load.driverId.toString() !== currentDriver._id.toString()
    ) {
      throw new ApiError("🛑 You are not assigned to this load", 403);
    }
  }

  // 2) Determine comment type automatically if driver
  const commentType = userRole === "driver" ? "driver" : type;

  // 3) Push new comment
  const newComment = {
    text,
    type: commentType,
    addedBy: userId,
  };
  load.comments.push(newComment);

  // 4) Save load
  await load.save();
  await delCache(`loads:*${companyId}*`);

  // 5) Send Notifications directly
  if (["admin", "employee"].includes(userRole)) {
    if (commentType === "dispatcher") {
      // Notify all admins + employees in this company
      await createAndSendNotificationService(
        {
          title: "New Dispatcher Comment",
          refId: load._id,
          message: `A dispatcher added a new comment on Load: ${load.loadId}.`,
          module: "loads",
          importance: "medium",
          from: userId,
          toRole: ["admin", "employee"],
        },
        userId,
        companyId,
        role,
      );
    } else if (load.driverId) {
      const driver = await driverModel
        .findOne({ _id: load.driverId, companyId })
        .select("user");
      if (driver?.user) {
        await createAndSendNotificationService(
          {
            title: "New Load Note",
            refId: load._id,
            message: `Dispatcher added a new comment on Load: ${load.loadId}.`,
            module: "loads",
            importance: "medium",
            from: userId,
            toUser: [driver.user],
          },
          userId,
          companyId,
          role,
        );
      }
    }
  }

  if (userRole === "driver") {
    // Driver commented → Notify all dispatchers in this company
    await createAndSendNotificationService(
      {
        title: "Driver Comment",
        refId: load._id,
        message: `Driver added a comment on Load: ${load.loadId}.`,
        module: "loads",
        importance: "medium",
        from: userId,
        toRole: ["admin", "employee"],
      },
      userId,
      companyId,
      role,
    );
  }

  // 6) Log & return
  await logger.info(
    `New comment added | LoadID: ${load.loadId} | By: ${userRole} | Company: ${companyId}`,
  );

  return sanitizeLoad(load);
});

export const updateCommentService = asyncHandler(
  async (req, companyId, role) => {
    // Validate company context
    if (role !== "super-admin" && !companyId) {
      throw new ApiError("🛑 Company context is missing", 403);
    }

    const { loadId, commentId } = req.params;
    const { text, type } = req.body;
    const userId = req.user._id;

    // 1) Find load in this company
    const load = await loadModel.findOne({ _id: loadId, companyId });
    if (!load) throw new ApiError("🛑 Load not found in your company", 404);

    // 2) Find comment
    const comment = load.comments.id(commentId);
    if (!comment) throw new ApiError("🛑 Comment not found", 404);

    // 3) Update comment
    comment.text = text;
    comment.type = type;
    comment.updatedBy = userId;
    comment.updatedAt = new Date();

    // 4) Save
    await load.save();
    await delCache(`loads:*${companyId}*`);

    // 5) Log
    await logger.info(
      `Comment updated | LoadID: ${load.loadId} | CommentID: ${commentId} | Company: ${companyId}`,
    );

    // 6) Return
    return sanitizeLoad(load);
  },
);

export const deleteCommentService = asyncHandler(
  async (req, companyId, role) => {
    // Validate company context
    if (role !== "super-admin" && !companyId) {
      throw new ApiError("🛑 Company context is missing", 403);
    }

    const { loadId, commentId } = req.params;

    // 1) Find load in this company
    const load = await loadModel.findOne({ _id: loadId, companyId });
    if (!load) throw new ApiError("🛑 Load not found in your company", 404);

    // 2) Find comment index
    const comment = load.comments.id(commentId);
    if (!comment) throw new ApiError("🛑 Comment not found", 404);

    // 3) Remove comment
    comment.deleteOne();

    // 4) Save
    await load.save();
    await delCache(`loads:*${companyId}*`);

    // 5) Log
    await logger.info(
      `Comment deleted | LoadID: ${loadId} | CommentID: ${commentId} | Company: ${companyId}`,
    );

    // 6) Return
    return sanitizeLoad(load);
  },
);

export const getCommentsService = asyncHandler(async (req, companyId, role) => {
  // Validate company context
  if (role !== "super-admin" && !companyId) {
    throw new ApiError("🛑 Company context is missing", 403);
  }

  const { loadId } = req.params;

  // 1) Find load in this company
  const load = await loadModel
    .findOne({ _id: loadId, companyId })
    .populate("comments.addedBy", "name jobId")
    .populate("comments.updatedBy", "name jobId");

  if (!load) throw new ApiError("🛑 Load not found in your company", 404);

  // 2) Log
  await logger.info(
    `Comments fetched | LoadID: ${loadId} | Company: ${companyId}`,
  );

  // 3) Return only comments
  return {
    loadId: loadId,
    comments: load.comments,
    type: load.type,
  };
});
