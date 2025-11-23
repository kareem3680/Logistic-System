import driverRoute from "./driverRoute.js";

const mountRoutes = (app) => {
  app.use("/api/v1/drivers", driverRoute);
};

export default mountRoutes;
