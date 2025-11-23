import truckRoute from "./truckRoute.js";

const mountRoutes = (app) => {
  app.use("/api/v1/trucks", truckRoute);
};

export default mountRoutes;
