import ApiError from "../utils/apiError.js";

export const setCompany = (req, res, next) => {
  if (!req.user?.companyId) {
    return next(new ApiError("Company not found", 403));
  }

  req.companyId = req.user.companyId;
  next();
};
