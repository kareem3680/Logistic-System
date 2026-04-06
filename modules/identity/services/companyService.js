import asyncHandler from "express-async-handler";
import Company from "../models/companyModel.js";
import User from "../models/userModel.js";
import ApiError from "../../../utils/apiError.js";
import Logger from "../../../utils/loggerService.js";
import { cacheWrapper, delCache } from "../../../utils/cache.js";
import {
  createService,
  getAllService,
  getSpecificService,
} from "../../../utils/servicesHandler.js";
import { sanitizeCompany } from "../../../utils/sanitizeData.js";

const logger = new Logger("company");

// -----------------------------
// Create Company
// -----------------------------
export const createCompanyService = asyncHandler(async (body, userId, role) => {
  const company = await createService(
    Company,
    {
      ...body,
      createdBy: userId,
    },
    null,
    role,
  );

  await company.populate([
    { path: "createdBy", select: "name" },
    { path: "updatedBy", select: "name" },
  ]);

  await delCache("companies:*");
  await logger.info("Company created", { companyId: company._id });

  return sanitizeCompany(company);
});

// -----------------------------
// Get All Companies + users count + total users
// -----------------------------
export const getAllCompaniesService = asyncHandler(async (req) => {
  const cacheKey = `all:${JSON.stringify(req.query)}`;
  const { role, companyId } = req.user;

  return await cacheWrapper(
    cacheKey,
    async () => {
      const result = await getAllService(
        Company,
        req.query,
        "company",
        companyId ?? null,
        {},
        {},
        role,
      );

      const companyIds = result.data.map((c) => c._id);

      const usersAggregation = await User.aggregate([
        { $match: { companyId: { $in: companyIds } } },
        { $group: { _id: "$companyId", usersCount: { $sum: 1 } } },
      ]);

      const usersMap = usersAggregation.reduce((acc, item) => {
        acc[item._id.toString()] = item.usersCount;
        return acc;
      }, {});

      const totalUsers = usersAggregation.reduce(
        (sum, item) => sum + item.usersCount,
        0,
      );

      const populatedCompanies = await Company.populate(result.data, [
        { path: "createdBy", select: "name" },
        { path: "updatedBy", select: "name" },
      ]);

      const data = populatedCompanies.map((company) => ({
        ...sanitizeCompany(company),
        usersCount: usersMap[company._id.toString()] || 0,
      }));

      await logger.info("Fetched all companies with users count", { role });

      return {
        data,
        results: result.results,
        paginationResult: result.paginationResult,
        totalUsers,
      };
    },
    undefined,
    { namespace: "companies" },
  );
});

// -----------------------------
// Get Company By ID + users count
// -----------------------------
export const getCompanyByIdService = asyncHandler(
  async (id, role, companyId = null) => {
    return await cacheWrapper(
      `id:${id}`,
      async () => {
        const company = await getSpecificService(
          Company,
          id,
          companyId ?? null,
          {},
          role,
        );

        const usersCount = await User.countDocuments({
          companyId: company._id,
        });

        const populated = await company.populate([
          { path: "createdBy", select: "name" },
          { path: "updatedBy", select: "name" },
        ]);

        await logger.info("Fetched company with users count", { id, role });

        return {
          ...sanitizeCompany(populated),
          usersCount,
        };
      },
      undefined,
      { namespace: "companies" },
    );
  },
);

// -----------------------------
// Update Company
// -----------------------------
export const updateCompanyService = asyncHandler(
  async (id, body, userId, role, companyId = null) => {
    const company = await getSpecificService(
      Company,
      id,
      companyId ?? null,
      {},
      role,
    );

    let updated = false;

    if (body.name && body.name !== company.name) {
      const existingCompany = await Company.findOne({ name: body.name });
      if (existingCompany)
        throw new ApiError("Company name already exists", 400);

      company.name = body.name;
      updated = true;
    }

    if (body.email && body.email !== company.email) {
      const existingCompany = await Company.findOne({ email: body.email });
      if (existingCompany)
        throw new ApiError("Company email already exists", 400);

      company.email = body.email;
      updated = true;
    }

    if (updated) {
      company.updatedBy = userId;
      await company.save();

      await delCache("companies:*");
      await logger.info("Company updated", { id: company._id, role });
    }

    const populated = await company.populate([
      { path: "createdBy", select: "name" },
      { path: "updatedBy", select: "name" },
    ]);

    return sanitizeCompany(populated);
  },
);

// -----------------------------
// Deactivate Company (Soft Delete)
// -----------------------------
export const deactivateCompanyService = asyncHandler(
  async (id, role, companyId = null) => {
    const company = await getSpecificService(
      Company,
      id,
      companyId ?? null,
      {},
      role,
    );

    if (!company.active) {
      throw new ApiError("Company already inactive", 400);
    }

    company.active = false;
    await company.save();

    await User.updateMany({ companyId: company._id }, { active: false });

    await delCache("companies:*");
    await logger.info("Company deactivated with users", { id, role });
  },
);

// -----------------------------
// Activate Company (Soft Activate)
// -----------------------------
export const activateCompanyService = asyncHandler(
  async (id, role, companyId = null) => {
    const company = await getSpecificService(
      Company,
      id,
      companyId ?? null,
      {},
      role,
    );

    if (company.active) {
      throw new ApiError("Company already active", 400);
    }

    company.active = true;
    await company.save();

    await User.updateMany({ companyId: company._id }, { active: true });

    await delCache("companies:*");
    await logger.info("Company activated with users", { id, role });
  },
);
