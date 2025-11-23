class ApiFeatures {
  constructor(mongooseQuery, queryString) {
    this.mongooseQuery = mongooseQuery;
    this.queryString = queryString;
  }

  filter() {
    const queryObj = { ...this.queryString };

    const excludedFields = [
      "limit",
      "page",
      "fields",
      "sort",
      "keyword",
      "from",
      "to",
    ];
    excludedFields.forEach((field) => delete queryObj[field]);

    const parseOperators = (query) => {
      const parsed = {};
      for (const key in query) {
        const match = key.match(/^(.+)\[(gte|gt|lte|lt)\]$/);
        if (match) {
          const field = match[1];
          const op = `$${match[2]}`;
          if (!parsed[field]) parsed[field] = {};
          parsed[field][op] = Number(query[key]);
        } else {
          parsed[key] = query[key];
        }
      }
      return parsed;
    };

    const filters = parseOperators(queryObj);

    const start = this.queryString.from;
    const end = this.queryString.to;
    if (start || end) {
      const dateFilter = {};
      if (start) dateFilter.$gte = new Date(start);
      if (end) dateFilter.$lte = new Date(end);
      filters.createdAt = dateFilter;
    }

    this.mongooseQuery = this.mongooseQuery.find(filters);

    return this;
  }

  sort() {
    if (this.queryString.sort) {
      const sortBy = this.queryString.sort.split(",").join(" ");
      this.mongooseQuery = this.mongooseQuery.sort(sortBy);
    } else {
      this.mongooseQuery = this.mongooseQuery.sort("-createdAt");
    }
    return this;
  }

  limit() {
    if (this.queryString.fields) {
      const fields = this.queryString.fields.split(",").join(" ");
      this.mongooseQuery = this.mongooseQuery.select(fields);
    } else {
      this.mongooseQuery = this.mongooseQuery.select("-__v");
    }
    return this;
  }

  search(model) {
    if (!model || !model.schema) return this;

    if (this.queryString.keyword) {
      const keyword = this.queryString.keyword;

      const stringFields = Object.keys(model.schema.paths).filter((field) => {
        const type = model.schema.paths[field].instance;

        return (
          type === "String" &&
          !field.startsWith("_") &&
          !["__v"].includes(field)
        );
      });

      if (stringFields.length) {
        const query = {
          $or: stringFields.map((field) => ({
            [field]: { $regex: keyword, $options: "i" },
          })),
        };

        this.mongooseQuery = this.mongooseQuery.find(query);
      }
    }

    return this;
  }

  paginate(totalDocs) {
    const page = parseInt(this.queryString.page) || 1;
    const limit = parseInt(this.queryString.limit) || 10;
    const skip = (page - 1) * limit;
    const end = page * limit;

    const pagination = {
      currentPage: page,
      limit,
      totalDocs,
      totalPages: Math.ceil(totalDocs / limit),
    };
    if (end < totalDocs) pagination.next = page + 1;
    if (skip > 0) pagination.prev = page - 1;

    this.paginationResult = pagination;
    this.mongooseQuery = this.mongooseQuery.skip(skip).limit(limit);
    return this;
  }

  populate(paths = []) {
    paths.forEach((p) => {
      this.mongooseQuery = this.mongooseQuery.populate(p);
    });
    return this;
  }
}

export default ApiFeatures;
