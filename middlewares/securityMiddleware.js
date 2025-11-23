import helmet from "helmet";
import hpp from "hpp";
import rateLimit from "express-rate-limit";
import mongoClean from "mongo-sanitize";
import compression from "compression";
import sanitizeInput from "../utils/sanitizeApp.js";

export default (app) => {
  // Security Headers
  app.use(helmet());

  // Prevent parameter pollution
  app.use(hpp());

  // Clean MongoDB injections
  app.use((req, res, next) => {
    req.body = mongoClean(req.body);
    req.params = mongoClean(req.params);
    req.cleanedQuery = mongoClean(req.query);
    next();
  });

  // Sanitize custom app input
  app.use((req, res, next) => {
    req.body = sanitizeInput(req.body);
    req.params = sanitizeInput(req.params);
    req.cleanedQuery = sanitizeInput(req.cleanedQuery);
    next();
  });

  // Apply rate limiting
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 250,
    message: "🛑 Too many requests from this IP, please try again later.",
  });
  app.use("/", limiter);

  // Enable response compression
  app.use(compression());
};
