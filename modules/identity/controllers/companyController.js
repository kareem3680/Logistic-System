import asyncHandler from "express-async-handler";
import {
  createCompanyService,
  getAllCompaniesService,
  getCompanyByIdService,
  updateCompanyService,
  deactivateCompanyService,
  activateCompanyService,
} from "../services/companyService.js";

// -----------------------------
// Create Company
// -----------------------------
export const createCompany = asyncHandler(async (req, res) => {
  const company = await createCompanyService(
    req.body,
    req.user._id,
    req.user.role,
  );

  res.status(201).json({
    status: "success",
    data: company,
  });
});

// -----------------------------
// Get All Companies
// -----------------------------
export const getCompanies = asyncHandler(async (req, res) => {
  const result = await getAllCompaniesService(req);

  res.status(200).json({
    status: "success",
    results: result.results,
    totalUsers: result.totalUsers,
    data: result.data,
    paginationResult: result.paginationResult,
  });
});

// -----------------------------
// Get Single Company
// -----------------------------
export const getCompany = asyncHandler(async (req, res) => {
  const company = await getCompanyByIdService(
    req.params.id,
    req.user.role,
    req.user.companyId,
  );

  res.status(200).json({
    status: "success",
    data: company,
  });
});

// -----------------------------
// Update Company
// -----------------------------
export const updateCompany = asyncHandler(async (req, res) => {
  const company = await updateCompanyService(
    req.params.id,
    req.body,
    req.user._id,
    req.user.role,
    req.user.companyId,
  );

  res.status(200).json({
    status: "success",
    data: company,
  });
});

// -----------------------------
// deactivate Company
// -----------------------------
export const deactivateCompany = asyncHandler(async (req, res) => {
  await deactivateCompanyService(
    req.params.id,
    req.user.role,
    req.user.companyId,
  );

  res.status(200).json({
    mes: "company deactivated successfully",
  });
});

// -----------------------------
// deactivate Company
// -----------------------------
export const activateCompany = asyncHandler(async (req, res) => {
  await activateCompanyService(
    req.params.id,
    req.user.role,
    req.user.companyId,
  );

  res.status(200).json({
    mes: "company activated successfully",
  });
});
