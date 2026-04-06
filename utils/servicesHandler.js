import ApiFeatures from "../utils/apiFeatures.js";
import asyncHandler from "express-async-handler";
import ApiError from "../utils/apiError.js";

/**
 * ==============================
 * Helper
 * ==============================
 */
const validateCompanyContext = (companyId, role) => {
  if (role !== "super-admin" && !companyId) {
    throw new ApiError("🛑 Company context is missing", 403);
  }
};

/**
 * ==============================
 * CREATE
 * ==============================
 */
export const createService = asyncHandler(
  async (model, body, companyId = null, role) => {
    validateCompanyContext(companyId, role);

    const newDocument = await model.create({
      ...body,
      ...(role !== "super-admin" ? { companyId } : {}),
    });

    return newDocument;
  },
);

/**
 * ==============================
 * GET ALL
 * ==============================
 */
export const getAllService = asyncHandler(
  async (
    model,
    query,
    modelName,
    companyId = null,
    filter = {},
    options = {},
    role,
  ) => {
    validateCompanyContext(companyId, role);

    const finalFilter = { ...filter };

    if (role !== "super-admin") {
      finalFilter.companyId = companyId;
    }

    const apiFeatures = new ApiFeatures(model.find(finalFilter).lean(), query)
      .search(model)
      .filter();

    const filteredDocumentsCount = await model.countDocuments(
      apiFeatures.mongooseQuery.getFilter(),
    );

    apiFeatures.limit().sort(modelName).paginate(filteredDocumentsCount);

    if (options.populate) {
      apiFeatures.mongooseQuery = apiFeatures.mongooseQuery.populate(
        options.populate,
      );
    }

    const { mongooseQuery, paginationResult } = apiFeatures;
    const documents = await mongooseQuery;

    return {
      results: documents.length,
      data: documents,
      paginationResult,
    };
  },
);

/**
 * ==============================
 * GET ONE
 * ==============================
 */
export const getSpecificService = asyncHandler(
  async (model, id, companyId = null, options = {}, role) => {
    validateCompanyContext(companyId, role);

    const query = role !== "super-admin" ? { _id: id, companyId } : { _id: id };

    let mongooseQuery = model.findOne(query);

    if (options.populate)
      mongooseQuery = mongooseQuery.populate(options.populate);
    if (options.select) mongooseQuery = mongooseQuery.select(options.select);

    const document = await mongooseQuery;
    if (!document) throw new ApiError("🛑 No document found", 404);

    return document;
  },
);

/**
 * ==============================
 * UPDATE
 * ==============================
 */
export const updateService = asyncHandler(
  async (model, id, body, companyId = null, role) => {
    validateCompanyContext(companyId, role);

    const { password, role: newRole, companyId: bodyCompany, ...rest } = body;

    const query = role !== "super-admin" ? { _id: id, companyId } : { _id: id };

    const document = await model.findOne(query);
    if (!document) throw new ApiError("🛑 No document found", 404);

    Object.assign(document, rest);

    await document.save();
    return document;
  },
);

/**
 * ==============================
 * DELETE
 * ==============================
 */
export const deleteService = asyncHandler(
  async (model, id, companyId = null, role) => {
    validateCompanyContext(companyId, role);

    const query = role !== "super-admin" ? { _id: id, companyId } : { _id: id };

    const document = await model.findOneAndDelete(query);
    if (!document) throw new ApiError("🛑 No document found", 404);
  },
);
