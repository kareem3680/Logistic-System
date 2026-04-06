import jwt from "jsonwebtoken";
import ApiError from "../utils/apiError.js";
import userModel from "../modules/identity/models/userModel.js";
import Logger from "../utils/loggerService.js";

const logger = new Logger("auth");

export const verifyToken = async (token) => {
  // 1- check token exists
  if (!token) {
    throw new ApiError(
      "🚫 You are not logged in. Please login and try again.",
      401,
    );
  }

  // 2- verify jwt
  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.role !== "super-admin" && !decoded.companyId) {
      throw new ApiError("🛑 Company not found in token", 401);
    }
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      await logger.info("Token expired", { expiredAt: err.expiredAt });
      throw new ApiError("⏰ Token expired. Please login again.", 401);
    }

    await logger.error("Invalid token", { error: err.message });
    throw new ApiError("🛑 Invalid token", 401);
  }

  // 3- get user from DB
  const user = await userModel.findById(decoded.userId);

  if (!user) {
    await logger.error("Token verification failed - user not found", {
      userId: decoded.userId,
    });
    throw new ApiError("🛑 User not found", 401);
  }

  // 4- security check: company match (skip for super-admin)
  if (
    user.role !== "super-admin" &&
    user.companyId.toString() !== decoded.companyId
  ) {
    await logger.error("Company mismatch", {
      userId: user._id,
      tokenCompany: decoded.companyId,
      userCompany: user.companyId,
    });
    throw new ApiError("🛑 Company mismatch", 401);
  }

  // 5- password changed after token issued
  if (user.changedPasswordAt) {
    const changedTime = parseInt(user.changedPasswordAt.getTime() / 1000, 10);

    if (changedTime > decoded.iat) {
      await logger.error(
        "Token invalid - password changed after token issued",
        { userId: user._id },
      );
      throw new ApiError(
        "🛑 Password changed recently. Please login again.",
        401,
      );
    }
  }

  // 6- check active user
  if (user.active === false) {
    throw new ApiError(
      "🛑 Your account has been deactivated. Please contact support.",
      403,
    );
  }

  // 7- attach companyId (from token) to user object
  user.companyId = decoded.companyId;

  await logger.info("Token verified successfully", {
    userId: user._id,
    companyId: decoded.companyId,
  });

  return user;
};
