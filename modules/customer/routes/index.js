import customerRoute from "./customerRoute.js";

export const mountRoutes = (app) => {
  app.use("/api/v1/customers", customerRoute);
};

export default mountRoutes;
