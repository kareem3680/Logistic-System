import ApiError from "../utils/apiError.js";

const sendErrorDev = (err, res) => {
  res.status(err.statusCode || 500).json({
    status: err.status,
    error: err,
    message: err.message,
    stack: err.stack,
  });
};

const sendErrorProd = (err, res) => {
  res.status(err.statusCode).json({
    status: err.status,
    message: err.message,
  });
};

const handleJwtSignatureError = () =>
  new ApiError("🛑 Invalid Token, please try again", 401);
const handleJwtExpiredError = () =>
  new ApiError("🛑 Your Token expired, please log in again", 401);

const globalError = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || "error";
  if (process.env.NODE_ENV === "development") {
    sendErrorDev(err, res);
  } else {
    if (err.name == "JsonWebTokenError") err = handleJwtSignatureError();
    if (err.name == "TokenExpiredError") err = handleJwtExpiredError();
    sendErrorProd(err, res);
  }
};

export default globalError;
