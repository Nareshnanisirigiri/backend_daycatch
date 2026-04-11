import { prisma } from "../config/db.js";

const getPrimaryKeyField = (modelName) => {
    const dmmf = prisma?._dmmf?.modelMap?.[modelName];
    const idField = dmmf?.fields?.find((field) => field.isId)?.name;
    return idField || "id";
};

const normalizeIdValue = (modelName, idField, rawId) => {
    const dmmf = prisma?._dmmf?.modelMap?.[modelName];
    const field = dmmf?.fields?.find((f) => f.name === idField);
    if (field?.type === "Int") {
        const parsed = parseInt(rawId, 10);
        return Number.isNaN(parsed) ? rawId : parsed;
    }
    return rawId;
};

const addIdAlias = (doc, idField) => {
    if (!doc) return doc;
    if (doc[idField] !== undefined && doc._id === undefined) {
        doc._id = doc[idField];
    }
    return doc;
};

const convertMongoFilterToPrisma = (filter = {}, idField) => {
    if (!filter || typeof filter !== "object") return filter;
    if (Array.isArray(filter)) return filter.map((f) => convertMongoFilterToPrisma(f, idField));

    if (filter.$or && Array.isArray(filter.$or)) {
        return { OR: filter.$or.map((f) => convertMongoFilterToPrisma(f, idField)) };
    }

    const where = {};
    for (const [key, value] of Object.entries(filter)) {
        if (key === "$or") continue;
        if (key === "_id") {
            where[idField] = value;
        } else {
            where[key] = value;
        }
    }
    return where;
};

export const wrapPrismaModel = (modelName) => {
    const model = prisma[modelName];
    if (!model) return null;

    const idField = getPrimaryKeyField(modelName);

    return {
        find(where = {}) {
            const prismaWhere = convertMongoFilterToPrisma(where, idField);
            return {
                async lean() {
                    const rows = await model.findMany({ where: prismaWhere });
                    return rows.map((row) => addIdAlias(row, idField));
                },
                then(resolve, reject) {
                    return model
                        .findMany({ where: prismaWhere })
                        .then((rows) => resolve(rows.map((row) => addIdAlias(row, idField))), reject);
                }
            };
        },
        findById(id) {
            const idValue = normalizeIdValue(modelName, idField, id);
            return {
                async lean() {
                    const row = await model.findUnique({ where: { [idField]: idValue } });
                    return addIdAlias(row, idField);
                },
                then(resolve, reject) {
                    return model
                        .findUnique({ where: { [idField]: idValue } })
                        .then((row) => resolve(addIdAlias(row, idField)), reject);
                }
            };
        },
        async findOne(criteria = {}) {
            const where = convertMongoFilterToPrisma(criteria, idField);
            const row = await model.findFirst({ where });
            return addIdAlias(row, idField);
        },
        async create(payload) {
            const row = await model.create({ data: payload });
            return addIdAlias(row, idField);
        },
        async findByIdAndUpdate(id, payload) {
            const idValue = normalizeIdValue(modelName, idField, id);
            const data = payload?.$set || payload || {};
            const row = await model.update({ where: { [idField]: idValue }, data });
            return addIdAlias(row, idField);
        },
        async findByIdAndDelete(id) {
            const idValue = normalizeIdValue(modelName, idField, id);
            const row = await model.delete({ where: { [idField]: idValue } });
            return addIdAlias(row, idField);
        },
        async findOneAndUpdate(where = {}, update = {}) {
            const prismaWhere = convertMongoFilterToPrisma(where, idField);
            const existing = await model.findFirst({ where: prismaWhere });
            if (!existing) return null;
            const data = update?.$set || update || {};
            const row = await model.update({
                where: { [idField]: existing[idField] },
                data
            });
            return addIdAlias(row, idField);
        },
        async findOneAndDelete(where = {}) {
            const prismaWhere = convertMongoFilterToPrisma(where, idField);
            const existing = await model.findFirst({ where: prismaWhere });
            if (!existing) return null;
            const row = await model.delete({ where: { [idField]: existing[idField] } });
            return addIdAlias(row, idField);
        },
        collection: {
            find(filter = {}) {
                const prismaWhere = convertMongoFilterToPrisma(filter, idField);
                const state = { skip: 0, take: undefined };
                return {
                    skip(value = 0) {
                        state.skip = Number(value) || 0;
                        return this;
                    },
                    limit(value = 0) {
                        const take = Number(value);
                        state.take = Number.isFinite(take) && take > 0 ? take : undefined;
                        return this;
                    },
                    async toArray() {
                        const rows = await model.findMany({
                            where: prismaWhere,
                            skip: state.skip,
                            take: state.take
                        });
                        return rows.map((row) => addIdAlias(row, idField));
                    }
                };
            },
            async findOne(filter = {}) {
                const prismaWhere = convertMongoFilterToPrisma(filter, idField);
                const row = await model.findFirst({ where: prismaWhere });
                return addIdAlias(row, idField);
            },
            async insertOne(payload) {
                const row = await model.create({ data: payload });
                return { insertedId: row[idField] };
            },
            async findOneAndUpdate(filter = {}, update = {}) {
                const prismaWhere = convertMongoFilterToPrisma(filter, idField);
                const existing = await model.findFirst({ where: prismaWhere });
                if (!existing) return null;
                const data = update?.$set || update || {};
                const row = await model.update({
                    where: { [idField]: existing[idField] },
                    data
                });
                return addIdAlias(row, idField);
            },
            async deleteMany(filter = {}) {
                const prismaWhere = convertMongoFilterToPrisma(filter, idField);
                const result = await model.deleteMany({ where: prismaWhere });
                return { deletedCount: result.count };
            }
        }
    };
};
