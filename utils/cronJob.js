import cron from "node-cron";
import { cleanOldLogs } from "./loggerService.js";
import { checkAndNotifyMaintenancesCron } from "../modules/maintenance/services/maintenanceService.js";

cron.schedule("0 16 * * 1", () => {
  console.log("🧹 Daily log cleanup started (Every Monday at 4 PM)");
  try {
    cleanOldLogs();
  } catch (error) {
    console.error("🔴 Clean Old Logs", error);
  }
});

cron.schedule("0 10 * * *", async () => {
  console.log(
    "🛠️ Cron job started: Checking due maintenances & reminders (Every day at 10 AM)"
  );
  try {
    await checkAndNotifyMaintenancesCron();
  } catch (error) {
    console.error("🔴 Cron job failed", error);
  }
});
