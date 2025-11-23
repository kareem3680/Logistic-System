import notificationRoute from "./notificationRoute.js";

const mountRoutes = (app) => {
  app.use("/api/v1/notifications", notificationRoute);
};

export default mountRoutes;
