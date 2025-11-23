import { exec } from "child_process";
import fs from "fs";
import path from "path";
import archiver from "archiver";
import { uploadToDrive } from "../utils/googleDrive.js";
import dotenv from "dotenv";
dotenv.config({ path: "config.env", quiet: true });

const BACKUP_DIR = path.resolve("./temp-backups");
const DATE = new Date().toISOString().replace(/[:.]/g, "-");
const ZIP_PATH = path.join(BACKUP_DIR, `backup-${DATE}.zip`);

if (!fs.existsSync(BACKUP_DIR)) fs.mkdirSync(BACKUP_DIR);

async function runBackup() {
  console.log("🟢 Starting MongoDB backup...");

  exec(
    `mongodump --uri="${process.env.MONGO_URI}" --out="${BACKUP_DIR}/dump"`,
    async (err) => {
      if (err) return console.error("❌ Backup error:", err.message);

      console.log("✅ MongoDB dump completed. Compressing...");

      const output = fs.createWriteStream(ZIP_PATH);
      const archive = archiver("zip");
      archive.pipe(output);
      archive.directory(`${BACKUP_DIR}/dump`, false);
      await archive.finalize();

      output.on("close", async () => {
        console.log("📦 Compression done, uploading to Google Drive...");

        const buffer = fs.readFileSync(ZIP_PATH);
        const file = {
          originalname: `backup-${DATE}.zip`,
          mimetype: "application/zip",
          buffer,
        };

        try {
          const [uploaded] = await uploadToDrive([file]);
          console.log("✅ Uploaded backup:", uploaded.viewLink);

          fs.rmSync(`${BACKUP_DIR}/dump`, { recursive: true, force: true });
          fs.unlinkSync(ZIP_PATH);
          console.log("🧹 Temporary files cleaned.");

          console.log("🎉 Backup process completed successfully!");
        } catch (uploadErr) {
          console.error("🚫 Upload failed:", uploadErr.message);
        }
      });
    }
  );
}

runBackup();
