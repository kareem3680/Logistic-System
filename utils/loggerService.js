import {
  mkdirSync,
  readdirSync,
  statSync,
  readFileSync,
  writeFileSync,
} from "fs";
import { resolve, join, dirname } from "path";
import { fileURLToPath } from "url";
import {
  transports as _transports,
  createLogger,
  format as _format,
} from "winston";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const dateFormat = () =>
  new Date().toLocaleString("en-EG", {
    timeZone: "Africa/Cairo",
  });

const baseLogDir = process.env.LOG_PATH || "logs";
const logDir = resolve(__dirname, "..", baseLogDir);

try {
  mkdirSync(logDir, { recursive: true });
} catch (err) {
  if (err.code !== "EACCES" && err.code !== "EROFS") {
    console.error("🛑 NO FOLDER:", err);
  }
}

class loggerServices {
  constructor(topic) {
    const filename = join(logDir, `${topic}.log`);

    const transports = [
      new _transports.Console(),
      new _transports.File({ filename }),
    ];

    this.logger = createLogger({
      level: process.env.LOG_LEVEL || "info",
      format: _format.printf((info) => {
        let message = `${dateFormat()} | ${info.level.toUpperCase()} | ${
          info.message
        }`;
        if (info.obj) {
          message += ` | ${JSON.stringify(info.obj)}`;
        }
        return message;
      }),
      transports,
    });
  }

  async info(message, obj) {
    this.logger.log("info", message, obj ? { obj } : {});
  }

  async error(message, obj) {
    this.logger.log("error", message, obj ? { obj } : {});
  }

  async debug(message, obj) {
    this.logger.log("debug", message, obj ? { obj } : {});
  }
}

export const cleanOldLogs = () => {
  const now = Date.now();
  const maxAge = 30 * 24 * 60 * 60 * 1000;

  try {
    const files = readdirSync(logDir);

    files.forEach((file) => {
      const filePath = join(logDir, file);
      const stats = statSync(filePath);

      if (!stats.isFile()) return;

      const content = readFileSync(filePath, "utf-8");
      const lines = content.split("\n").filter(Boolean);

      const recentLines = lines.filter((line) => {
        const match = line.match(
          /^(\d{1,2}\/\d{1,2}\/\d{4},\s*\d{1,2}:\d{2}:\d{2}\s*[AP]M)/
        );
        if (!match) return true;

        const logTime = new Date(match[1]).getTime();
        return now - logTime < maxAge;
      });

      writeFileSync(filePath, recentLines.join("\n") + "\n", "utf-8");

      console.log(
        `🧹 Cleaned old lines in: ${file} (${recentLines.length}/${lines.length} kept)`
      );
    });
  } catch (err) {
    console.error("🚫 Error cleaning logs:", err);
  }
};

export default loggerServices;
