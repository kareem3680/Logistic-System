import authRoute from "./authRoute.js";
import updatePasswordRoute from "./updatePasswordRoute.js";
import forgetPasswordRoute from "./forgetPasswordRoute.js";
import adminRoute from "./adminRoute.js";
import userRoute from "./userRoute.js";
import companyRoute from "./companyRoute.js";

const mountRoutes = (app) => {
  app.use("/api/v1/auth", authRoute);
  app.use("/api/v1/updatePassword", updatePasswordRoute);
  app.use("/api/v1/forgetPassword", forgetPasswordRoute);
  app.use("/api/v1/adminDashboard", adminRoute);
  app.use("/api/v1/userDashboard", userRoute);
  app.use("/api/v1/companies", companyRoute);
};

export default mountRoutes;
