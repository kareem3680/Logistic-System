import mongoose from "mongoose";
import Conversation from "../../modules/conv/models/conversationModel.js";
import { ERROR_MESSAGES, HTTP_STATUS } from "../constants.js";

/**
 * Validate MongoDB ObjectId
 * @param {string} id - The ID to validate
 * @returns {boolean}
 */
export function isValidObjectId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

/**
 * Validate conversation membership with optimized query
 * @param {string} conversationId - Conversation ID
 * @param {string} userId - User ID
 * @returns {Promise<Object>}
 */
export async function validateConversationMembership(conversationId, userId) {
  try {
    // Optimized query: check existence without fetching all members
    const conv = await Conversation.findOne({
      _id: conversationId,
      members: userId,
    })
      .select("_id members")
      .maxTimeMS(5000)
      .lean();

    if (!conv) {
      // Determine if conversation exists but user is not a member
      const exists = await Conversation.exists({ _id: conversationId });

      if (exists) {
        return {
          valid: false,
          code: HTTP_STATUS.FORBIDDEN,
          message: ERROR_MESSAGES.ACCESS_DENIED,
        };
      }

      return {
        valid: false,
        code: HTTP_STATUS.NOT_FOUND,
        message: ERROR_MESSAGES.CONVERSATION_NOT_FOUND,
      };
    }

    return { valid: true, conversation: conv };
  } catch (error) {
    console.error("Conversation validation error:", error);

    // Handle specific database errors
    if (
      error.name === "MongooseError" ||
      error.name === "MongoError" ||
      error.name === "MongoServerError"
    ) {
      return {
        valid: false,
        code: HTTP_STATUS.SERVICE_UNAVAILABLE,
        message: ERROR_MESSAGES.DATABASE_UNAVAILABLE,
      };
    }

    return {
      valid: false,
      code: HTTP_STATUS.INTERNAL_ERROR,
      message: ERROR_MESSAGES.INTERNAL_ERROR,
    };
  }
}

/**
 * Validate and sanitize message text
 * @param {string} text - Message text
 * @returns {Object}
 */
export function validateMessageText(text) {
  if (!text || typeof text !== "string") {
    return {
      valid: false,
      message: ERROR_MESSAGES.MESSAGE_REQUIRED,
    };
  }

  const trimmed = text.trim();

  if (!trimmed) {
    return {
      valid: false,
      message: ERROR_MESSAGES.MESSAGE_REQUIRED,
    };
  }

  // Check length (max 10,000 characters)
  if (trimmed.length > 10000) {
    return {
      valid: false,
      message: "Message too long (max 10,000 characters)",
    };
  }

  return {
    valid: true,
    sanitized: trimmed,
  };
}

/**
 * Sanitize text to prevent XSS
 * @param {string} text - Text to sanitize
 * @returns {string}
 */
export function sanitizeText(text) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .replace(/\//g, "&#x2F;");
}
