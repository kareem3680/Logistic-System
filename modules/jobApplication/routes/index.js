import jobApplicationRoutes from "./jobApplication.js";

export const mountRoutes = (app) => {
  app.use("/api/v1/job-applications", jobApplicationRoutes);
};

export default mountRoutes;
