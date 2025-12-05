import maintenanceRoute from "./maintenanceRoute.js";

const mountRoutes = (app) => {
  app.use("/api/v1/maintenances", maintenanceRoute);
};

export default mountRoutes;
