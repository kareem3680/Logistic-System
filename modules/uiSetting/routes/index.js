import paletteRoute from "./paletteRoute.js";

const mountRoutes = (app) => {
  app.use("/api/v1/ui-settings/palette", paletteRoute);
};

export default mountRoutes;
