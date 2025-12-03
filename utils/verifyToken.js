import jwt from "jsonwebtoken";
import ApiError from "../utils/apiError.js";
import userModel from "../modules/identity/models/userModel.js";
import Logger from "../utils/loggerService.js";

const logger = new Logger("auth");

export const verifyToken = async (token) => {
  if (!token) {
    throw new ApiError(
      "🚫 You are not logged in. Please login and try again.",
      401
    );
  }

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      await logger.info("Token expired", { expiredAt: err.expiredAt });
      throw new ApiError("⏰ Token expired. Please login again.", 401);
    }
    await logger.error("Invalid token", { error: err.message });
    throw new ApiError("🛑 Invalid token", 401);
  }

  const user = await userModel.findById(decoded.userId);
  if (!user) {
    await logger.error("Token verification failed - user not found", {
      userId: decoded.userId,
    });
    throw new ApiError("🛑 User not found", 401);
  }

  if (user.changedPasswordAt) {
    const changedTime = parseInt(user.changedPasswordAt.getTime() / 1000, 10);
    if (changedTime > decoded.iat) {
      await logger.error(
        "Token invalid - password changed after token issued",
        {
          userId: user._id,
        }
      );
      throw new ApiError(
        "🛑 Password changed recently. Please login again.",
        401
      );
    }
  }

  if (user.active === false) {
    throw new ApiError(
      "🛑 Your account has been deactivated. Please contact support.",
      403
    );
  }

  await logger.info("Token verified successfully", { userId: user._id });

  return user;
};
