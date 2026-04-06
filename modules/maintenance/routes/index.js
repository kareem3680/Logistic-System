import maintenanceRoute from "./maintenanceRoute.js";
import serviceCenterRoute from "./serviceCenterRoute.js";

const mountRoutes = (app) => {
  app.use("/api/v1/maintenances", maintenanceRoute);
  app.use("/api/v1/service-centers", serviceCenterRoute);
};

export default mountRoutes;
