// utils/googleDrive.js
import { google } from "googleapis";
import stream from "stream";
import dotenv from "dotenv";
import ApiError from "./apiError.js";

dotenv.config({ path: "config.env", quiet: true });

// ======== Google Drive Setup (Singleton) ========
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);
oauth2Client.setCredentials({
  refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
});

const drive = google.drive({ version: "v3", auth: oauth2Client });

// Helper to retry failed uploads
const retry = async (fn, retries = 3, delay = 1000) => {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (err) {
      if (i === retries - 1) throw err;
      if (![429, 500, 503].includes(err.code)) throw err;
      await new Promise((res) => setTimeout(res, delay));
    }
  }
};

// ================================================================
//  1. Upload To Google Drive (parallel, safe, retry able)
// ================================================================
export const uploadToDrive = async (files) => {
  if (!files || files.length === 0)
    throw new ApiError("⚠️ No files provided for upload", 400);

  const filesArray = Array.isArray(files) ? files : [files];

  console.time("⏱ GoogleDrive Upload");

  const results = await Promise.all(
    filesArray.map(async (file) => {
      const bufferStream = new stream.PassThrough();
      bufferStream.end(file.buffer);

      const sanitizedName = file.originalname.replace(/[^\w.-]/g, "_");

      try {
        const response = await retry(() =>
          drive.files.create({
            requestBody: {
              name: sanitizedName,
              mimeType: file.mimetype || "application/pdf",
              parents: process.env.GOOGLE_DRIVE_FOLDER_ID
                ? [process.env.GOOGLE_DRIVE_FOLDER_ID]
                : undefined,
            },
            media: {
              mimeType: file.mimetype || "application/pdf",
              body: bufferStream,
            },
          })
        );

        await drive.permissions.create({
          fileId: response.data.id,
          requestBody: { role: "reader", type: "anyone" },
        });

        const { data } = await drive.files.get({
          fileId: response.data.id,
          fields: "webViewLink, webContentLink",
        });

        file.buffer = null;

        return {
          fileId: response.data.id,
          viewLink: data.webViewLink,
          downloadLink: data.webContentLink,
        };
      } catch (err) {
        console.error("🚫 Google Drive Upload Error:", {
          name: sanitizedName,
          code: err.code,
          message: err.message,
        });
        throw new ApiError(
          `🚫 Failed to upload "${sanitizedName}" to Google Drive`,
          500
        );
      }
    })
  );

  console.timeEnd("⏱ GoogleDrive Upload");

  return results.filter(Boolean);
};

// ================================================================
//  2. Delete From Google Drive (parallel, safe)
// ================================================================
export const deleteFromDrive = async (fileIds) => {
  if (!fileIds || fileIds.length === 0)
    throw new ApiError("⚠️ No file IDs provided for deletion", 400);

  const ids = Array.isArray(fileIds) ? fileIds : [fileIds];

  const results = await Promise.allSettled(
    ids.map((id) => drive.files.delete({ fileId: id }))
  );

  const failed = results
    .map((r, i) => (r.status === "rejected" ? ids[i] : null))
    .filter(Boolean);

  if (failed.length === ids.length)
    throw new ApiError("🚫 Failed to delete all files from Google Drive", 500);

  if (failed.length > 0)
    throw new ApiError(
      `⚠️ Failed to delete some files: ${failed.join(", ")}`,
      500
    );

  return { success: true, deleted: ids.length - failed.length };
};
