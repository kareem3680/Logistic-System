import driverLoadRoute from "./driverLoadRoute.js";
import payCheckRoute from "./payCheckRoute.js";
import saveFcmTokenRoute from "./saveFcmTokenRoute.js";
import timeOffRoute from "./timeOffRoute.js";

export const mountRoutes = (app) => {
  app.use("/api/v1/driver-dashboard/driver-load", driverLoadRoute);
  app.use("/api/v1/driver-dashboard/pay-check", payCheckRoute);
  app.use("/api/v1/driver-dashboard/save-fcm-token", saveFcmTokenRoute);
  app.use("/api/v1/driver-dashboard/time-off", timeOffRoute);
};

export default mountRoutes;
