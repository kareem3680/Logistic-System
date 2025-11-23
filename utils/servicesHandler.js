import asyncHandler from "express-async-handler";
import ApiError from "../utils/apiError.js";
import ApiFeatures from "../utils/apiFeatures.js";

export const createService = asyncHandler(async (model, body) => {
  const newDocument = await model.create(body);
  return newDocument;
});

export const getAllService = asyncHandler(
  async (model, query, modelName, filter = {}, options = {}) => {
    if (typeof filter !== "object" || Array.isArray(filter)) filter = {};

    const apiFeatures = new ApiFeatures(model.find(filter).lean(), query)
      .search(model)
      .filter();

    const filteredDocumentsCount = await model.countDocuments(
      apiFeatures.mongooseQuery.getFilter()
    );

    apiFeatures.limit().sort(modelName).paginate(filteredDocumentsCount);

    if (options.populate) {
      apiFeatures.mongooseQuery = apiFeatures.mongooseQuery.populate(
        options.populate
      );
    }

    const { mongooseQuery, paginationResult } = apiFeatures;
    const documents = await mongooseQuery;
    const finalFilter = mongooseQuery.getFilter();

    return {
      results: documents.length,
      data: documents,
      paginationResult,
      finalFilter,
    };
  }
);

export const getSpecificService = asyncHandler(
  async (model, id, options = {}) => {
    let query = model.findById(id);

    if (options.populate) {
      query = query.populate(options.populate);
    }

    if (options.select) {
      query = query.select(options.select);
    }

    const document = await query;
    if (!document) {
      throw new ApiError(`🛑 No document for this ID: ${id}`, 404);
    }

    return document;
  }
);

export const updateService = asyncHandler(async (model, id, body) => {
  const { password, role, ...rest } = body;
  const document = await model.findById(id);
  if (!document) {
    throw new ApiError(`🛑 No document for this ID: ${id}`, 404);
  }

  Object.assign(document, rest);
  await document.save();

  return document;
});

export const deleteService = asyncHandler(async (model, id) => {
  const document = await model.findByIdAndDelete(id);
  if (!document) {
    throw new ApiError(`🛑 No document for this ID: ${id}`, 404);
  }
  return;
});
