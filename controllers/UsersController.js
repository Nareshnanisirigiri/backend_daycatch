import { getAggregationDefinition } from "../aggregations/index.js";
import User from "../models/users.js";

const USERS_COLLECTION = "users";
const USERS_AGGREGATION_KEY = "users";

function parseNumber(value, fallback) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
}

function parseBoolean(value, queryKey) {
    if (value === undefined) {
        return undefined;
    }

    if (typeof value === "boolean") {
        return value;
    }

    const normalized = String(value).trim().toLowerCase();

    if (normalized === "true") {
        return true;
    }

    if (normalized === "false") {
        return false;
    }

    const error = new Error(`Query parameter "${queryKey}" must be true or false.`);
    error.statusCode = 400;
    throw error;
}

function escapeRegex(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function buildUserFilters(query) {
    const filters = {};
    const { name, email, phone, search, verified, isVerified } = query;
    const resolvedVerified = verified ?? isVerified;

    if (name) {
        filters["User Name"] = { $regex: escapeRegex(name), $options: "i" };
    }

    if (email) {
        filters["User Email"] = { $regex: escapeRegex(email), $options: "i" };
    }

    if (phone) {
        filters["User Phone"] = { $regex: escapeRegex(phone), $options: "i" };
    }

    if (search) {
        const pattern = { $regex: escapeRegex(search), $options: "i" };
        filters.$or = [
            { "User Name": pattern },
            { "User Email": pattern },
            { "User Phone": pattern }
        ];
    }

    const queryKey = verified !== undefined ? "verified" : "isVerified";
    const parsedVerified = parseBoolean(resolvedVerified, queryKey);

    if (parsedVerified !== undefined) {
        filters["Is Verified"] = parsedVerified;
    }

    return filters;
}

export async function getAllUsers(req, res) {
    try {
        const aggregation = req.query.aggregation === "true";
        const limit = Math.min(parseNumber(req.query.limit, 50), 200);
        const skip = Math.max(parseNumber(req.query.skip, 0), 0);
        const filters = buildUserFilters(req.query);

        if (aggregation) {
            const definition = getAggregationDefinition(USERS_AGGREGATION_KEY);

            if (!definition) {
                return res.status(404).json({
                    error: `Aggregation not found for collection: ${USERS_AGGREGATION_KEY}`
                });
            }

            const pipeline = [];

            if (Object.keys(filters).length > 0) {
                pipeline.push({ $match: filters });
            }

            pipeline.push(...definition.pipeline);
            pipeline.push({ $sort: { "Registration Date": -1, _id: -1 } });
            pipeline.push({ $skip: skip }, { $limit: limit });

            const results = await definition.model.aggregate(pipeline);

            return res.json({
                collection: USERS_COLLECTION,
                aggregated: true,
                total: results.length,
                results
            });
        }

        const results = await User.find(filters)
            .sort({ "Registration Date": -1, _id: -1 })
            .skip(skip)
            .limit(limit)
            .lean();

        return res.json({
            collection: USERS_COLLECTION,
            aggregated: false,
            total: results.length,
            results
        });
    } catch (error) {
        return res.status(error.statusCode || 500).json({ error: error.message });
    }
}
