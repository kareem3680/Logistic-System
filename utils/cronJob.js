import cron from "node-cron";
import { cleanOldLogs } from "./loggerService.js";

cron.schedule("0 16 * * 1", () => {
  console.log("🧹 Daily log cleanup started (Every Monday at 6 PM Cairo time)");
  cleanOldLogs();
});
