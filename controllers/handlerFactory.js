import catchAsync from "../utils/catchAsync.js";
import APIError from "../utils/apiError.js";
import { prisma } from "../config/db.js";

const buildPrismaWhere = (queryString = {}) => {
    const excludedFields = new Set(["page", "sort", "limit", "fields"]);
    const where = {};

    for (const [key, value] of Object.entries(queryString)) {
        if (excludedFields.has(key)) continue;
        if (value === undefined || value === null || value === "") continue;
        where[key] = value;
    }

    return where;
};

const buildPrismaOrderBy = (sortValue = "") => {
    if (!sortValue) return undefined;

    return sortValue.split(",").map((field) => {
        const trimmed = field.trim();
        if (!trimmed) return null;
        if (trimmed.startsWith("-")) {
            return { [trimmed.slice(1)]: "desc" };
        }
        return { [trimmed]: "asc" };
    }).filter(Boolean);
};

const buildSelect = (fields = "") => {
    if (!fields) return undefined;
    const list = String(fields)
        .split(",")
        .map((f) => f.trim())
        .filter(Boolean);
    if (!list.length) return undefined;
    return list.reduce((acc, key) => {
        acc[key] = true;
        return acc;
    }, {});
};

const getModel = (modelName) => {
    const modelAliases = {
        deliveryboy: "delivery_boy"
    };
    const resolvedModelName = modelAliases[modelName] || modelName;
    const model = prisma[resolvedModelName];
    if (!model) {
        throw new APIError(`Prisma model not found: ${modelName}`, 500);
    }
    return model;
};

export const deleteOne = (modelName) =>
    catchAsync(async (req, res, next) => {
        const model = getModel(modelName);
        const id = parseInt(req.params.id);
        const doc = await model.findUnique({ where: { id } });

        if (!doc) {
            return next(new APIError("No document found with that ID", 404));
        }

        await model.delete({ where: { id } });

        return res.status(204).json({
            status: "success",
            data: null
        });
    });

export const updateOne = (modelName) =>
    catchAsync(async (req, res, next) => {
        const model = getModel(modelName);
        const id = parseInt(req.params.id);
        let updated;

        try {
            updated = await model.update({
                where: { id },
                data: req.body
            });
        } catch (err) {
            return next(new APIError("No document found with that ID", 404));
        }

        return res.status(200).json({
            status: "success",
            data: updated
        });
    });

export const createOne = (modelName) =>
    catchAsync(async (req, res, next) => {
        const model = getModel(modelName);
        const doc = await model.create({ data: req.body });

        return res.status(201).json({
            status: "success",
            data: doc
        });
    });

export const createMany = (modelName) =>
    catchAsync(async (req, res, next) => {
        const model = getModel(modelName);
        const data = Array.isArray(req.body) ? req.body : [req.body];
        const result = await model.createMany({ data });

        return res.status(201).json({
            status: "success",
            results: result.count,
            data
        });
    });

export const getOne = (modelName) =>
    catchAsync(async (req, res, next) => {
        const model = getModel(modelName);
        const id = parseInt(req.params.id);
        const doc = await model.findUnique({ where: { id } });

        if (!doc) {
            return next(new APIError("No document found with that ID", 404));
        }

        return res.status(200).json({
            status: "success",
            data: doc
        });
    });

export const getAll = (modelName) =>
    catchAsync(async (req, res, next) => {
        const model = getModel(modelName);
        const where = buildPrismaWhere(req.query);
        const orderBy = buildPrismaOrderBy(req.query.sort);
        const page = req.query.page * 1 || 1;
        const limit = req.query.limit * 1 || 100;
        const skip = (page - 1) * limit;
        const select = buildSelect(req.query.fields);

        const docs = await model.findMany({
            where,
            orderBy,
            take: limit,
            skip,
            select
        });

        return res.status(200).json({
            status: "success",
            results: docs.length,
            data: docs
        });
    });
