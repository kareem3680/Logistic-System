import settingRoute from "./settingRoute.js";
import loadRoute from "./loadRoute.js";
import commentRoute from "./commentRoute.js";
import summaryRoute from "./summaryRoute.js";

const mountRoutes = (app) => {
  app.use("/api/v1/settings", settingRoute);
  app.use("/api/v1/loads", loadRoute);
  app.use("/api/v1/comments", commentRoute);
  app.use("/api/v1/summary", summaryRoute);
};

export default mountRoutes;
