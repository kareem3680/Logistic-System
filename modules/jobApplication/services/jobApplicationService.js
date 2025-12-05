import asyncHandler from "express-async-handler";
import JobApplicationModel from "../models/jobApplicationModel.js";
import ApiError from "../../../utils/apiError.js";
import sendEmail from "../../../utils/sendEmail.js";
import Logger from "../../../utils/loggerService.js";
import { getAllService } from "../../../utils/servicesHandler.js";
import { sanitizeJobApplication } from "../../../utils/sanitizeData.js";

const logger = new Logger("jobApplication");

// ============================================================
// CREATE JOB APPLICATION
// ============================================================
export const createJobApplicationService = asyncHandler(async (req) => {
  const {
    fullName,
    email,
    phone,
    jobTitle,
    location,
    experienceYears,
    skills,
    cvLink,
    notes,
  } = req.body;

  // Create new application
  const application = await JobApplicationModel.create({
    fullName,
    email,
    phone,
    jobTitle,
    location,
    experienceYears,
    skills,
    cvLink,
    notes,
  });

  // Send confirmation email
  sendEmail({
    email,
    subject: `Application Received for ${jobTitle}`,
    message: `Hello ${fullName},\n\nThank you for applying for the ${jobTitle} position at Styles Dispatch.\nWe’ve received your application and our team will review it soon.\n\nBest regards,\nStyles Dispatch HR Team`,
  }).catch((err) =>
    logger.error("Email sending failed", { error: err.message })
  );

  await logger.info(`New Job Application submitted by ${fullName} (${email})`);
  return sanitizeJobApplication(application);
});

// ============================================================
// GET ALL JOB APPLICATIONS (ADMIN)
// ============================================================
export const getAllJobApplicationsService = asyncHandler(async (req) => {
  const result = await getAllService(
    JobApplicationModel,
    req.query,
    "jobApplication",
    {},
    {
      populate: [{ path: "reviewedBy", select: "name jobId" }],
    }
  );

  // Sanitize all returned applications
  result.data = result.data.map((app) => sanitizeJobApplication(app));

  await logger.info(`Loaded ${result.results} job applications`);
  return result;
});

// ============================================================
// UPDATE JOB APPLICATION STATUS (ADMIN)
// ============================================================
export const updateJobApplicationStatusService = asyncHandler(async (req) => {
  const { id } = req.params;
  const { status } = req.body;
  const userId = req.user._id;

  const allowedStatuses = ["pending", "reviewed", "accepted", "rejected"];
  if (!allowedStatuses.includes(status))
    throw new ApiError("Invalid status value", 400);

  const updatedApp = await JobApplicationModel.findByIdAndUpdate(
    id,
    { status, reviewedBy: userId },
    { new: true }
  );

  if (!updatedApp) throw new ApiError("Application not found", 404);

  await logger.info(`Job Application ${id} updated to ${status}`);
  return sanitizeJobApplication(updatedApp);
});
