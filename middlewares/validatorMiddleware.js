import { validationResult } from "express-validator";

const validatorMiddleware = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res
      .status(errors.array()[0].msg.statusCode || 400)
      .json({ errors: errors.array() });
  }
  next();
};

export default validatorMiddleware;
