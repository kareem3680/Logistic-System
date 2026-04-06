import multer from "multer";
import path from "path";
import ApiError from "../utils/apiError.js";

const allowedMimeTypes = ["application/pdf"];
const allowedExtensions = [".pdf"];
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();

  if (
    allowedMimeTypes.includes(file.mimetype) &&
    allowedExtensions.includes(ext)
  ) {
    cb(null, true);
  } else {
    cb(
      new ApiError(
        `🛑 Only PDF files are allowed. Invalid type: ${file.mimetype}`,
        400,
      ),
      false,
    );
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
});

export const uploadPDFs = (req, res, next) => {
  const uploader = upload.fields([
    { name: "documents", maxCount: 2 },
    { name: "documentsForDriver", maxCount: 2 },
  ]);

  console.time("⏱ uploadPDFs");

  uploader(req, res, (err) => {
    console.timeEnd("⏱ uploadPDFs");

    if (err) {
      let message = "File upload error";

      if (err instanceof multer.MulterError) {
        switch (err.code) {
          case "LIMIT_FILE_SIZE":
            message = "🛑 File too large. Max size is 5MB per file.";
            break;
          case "LIMIT_UNEXPECTED_FILE":
            message =
              "🛑 Too many files uploaded. Only 2 files are allowed at once.";
            break;
          default:
            message = err.message;
        }
      } else if (err instanceof ApiError) {
        message = err.message;
      } else {
        message = `🛑 Upload failed: ${err.message}`;
      }

      return next(new ApiError(message, 400));
    }

    next();
  });
};
