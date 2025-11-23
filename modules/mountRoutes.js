import mountRoutesIdentity from "./identity/routes/index.js";
import mountRoutesNotifications from "./notifications/routes/index.js";
import mountRoutesDriver from "./driver/routes/index.js";
import mountRoutesTruck from "./truck/routes/index.js";
import mountRoutesLoads from "./load/routes/index.js";
import mountRoutesJobApplication from "./jobApplication/routes/index.js";
import mountRoutesDriverDashboard from "./driverDashboard/routes/index.js";
import mountRoutesCustomer from "./customer/routes/index.js";
import mountRoutesUiSetting from "./uiSetting/routes/index.js";

export default function mountRoutes(app) {
  mountRoutesIdentity(app);
  mountRoutesNotifications(app);
  mountRoutesDriver(app);
  mountRoutesTruck(app);
  mountRoutesLoads(app);
  mountRoutesJobApplication(app);
  mountRoutesDriverDashboard(app);
  mountRoutesCustomer(app);
  mountRoutesUiSetting(app);
}
