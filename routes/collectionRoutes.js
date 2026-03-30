import express from "express";
import bcrypt from "bcryptjs";
import { ObjectId } from "mongodb";
import mongoose from "mongoose";
import { getAggregationDefinition } from "../aggregations/index.js";
import { collections, collectionSet } from "../collections.js";

const router = express.Router();

function getCollectionOrThrow(collectionName) {
    if (!collectionSet.has(collectionName)) {
        const error = new Error(`Unsupported collection: ${collectionName}`);
        error.statusCode = 404;
        throw error;
    }

    return mongoose.connection.db.collection(collectionName);
}

function parseObjectId(id) {
    if (!ObjectId.isValid(id)) {
        const error = new Error(`Invalid document id: ${id}`);
        error.statusCode = 400;
        throw error;
    }

    return new ObjectId(id);
}

function parseNumber(value, fallback) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
}

function normalizeEmail(value = "") {
    return String(value).trim().toLowerCase();
}

function escapeRegExp(value = "") {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

const SUPER_ADMIN_ROLE_NAME = "Super Admin";
const ADMIN_EMAIL_LOOKUP_FIELDS = ["Email", "email", "Email ID"];

function getSubAdminRole(payload = {}) {
    return payload["role Name"] || payload.roleName || payload.role || "";
}

function getSubAdminEmail(payload = {}) {
    return payload.Email || payload.email || "";
}

function isAdminCollection(collectionName = "") {
    return collectionName === "sub-admin" || collectionName === "super-admin";
}

function buildAdminEmailLookup(email = "") {
    const escapedEmail = escapeRegExp(email);

    return {
        $or: ADMIN_EMAIL_LOOKUP_FIELDS.map((field) => ({
            [field]: { $regex: `^\\s*${escapedEmail}\\s*$`, $options: "i" }
        }))
    };
}

async function findExistingAdminAccountByEmail(email, exclude = {}) {
    const db = mongoose.connection.db;
    const collectionsToSearch = ["super-admin", "sub-admin"];

    for (const adminCollectionName of collectionsToSearch) {
        const filter = buildAdminEmailLookup(email);

        if (adminCollectionName === "super-admin") {
            filter["role Name"] = SUPER_ADMIN_ROLE_NAME;
        }

        if (exclude.collectionName === adminCollectionName && exclude._id) {
            filter._id = { $ne: exclude._id };
        }

        const account = await db.collection(adminCollectionName).findOne(filter);
        if (account) {
            return account;
        }
    }

    return null;
}

async function findExistingSuperAdmin(exclude = {}) {
    const db = mongoose.connection.db;
    const collectionsToSearch = ["super-admin", "sub-admin"];

    for (const adminCollectionName of collectionsToSearch) {
        const filter = { "role Name": SUPER_ADMIN_ROLE_NAME };

        if (exclude.collectionName === adminCollectionName && exclude._id) {
            filter._id = { $ne: exclude._id };
        }

        const account = await db.collection(adminCollectionName).findOne(filter);
        if (account) {
            return account;
        }
    }

    return null;
}

router.get("/", (req, res) => {
    return res.json({
        total: collections.length,
        collections
    });
});

router.post("/:collection", async (req, res) => {
    try {
        const collectionName = req.params.collection;
        const collection = getCollectionOrThrow(collectionName);
        const payload = req.body;

        if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
            return res.status(400).json({ error: "Request body must be a JSON object." });
        }

        if (isAdminCollection(collectionName)) {
            const roleName = getSubAdminRole(payload);
            const email = normalizeEmail(getSubAdminEmail(payload));
            const isSuperAdminCollection = collectionName === "super-admin";

            if (!isSuperAdminCollection && roleName === SUPER_ADMIN_ROLE_NAME) {
                return res.status(403).json({ error: "Use the main Super Admin registration flow for this account." });
            }

            if (!email) {
                return res.status(400).json({ error: "Email is required for admin accounts." });
            }

            if (!payload.password || !String(payload.password).trim()) {
                return res.status(400).json({ error: "Password is required for admin accounts." });
            }

            if (isSuperAdminCollection) {
                const existingSuperAdmin = await findExistingSuperAdmin();
                if (existingSuperAdmin) {
                    return res.status(403).json({ error: "A Super Admin is already registered. Please login." });
                }

                payload["role Name"] = SUPER_ADMIN_ROLE_NAME;
                payload.scope = "platform";
                payload.storeId = "";
                payload.storeName = "";
            }

            const existingAdmin = await findExistingAdminAccountByEmail(email);

            if (existingAdmin) {
                return res.status(409).json({ error: "An admin account with this email already exists." });
            }

            payload.Email = email;
            delete payload.email;
            payload.password = await bcrypt.hash(String(payload.password), 12);
        }

        const result = await collection.insertOne(payload);
        const document = await collection.findOne({ _id: result.insertedId });

        return res.status(201).json(document);
    } catch (error) {
        return res.status(error.statusCode || 500).json({ error: error.message });
    }
});

router.post("/:collection/bulk", async (req, res) => {
    try {
        const collection = getCollectionOrThrow(req.params.collection);
        const payload = req.body;

        if (!payload || !Array.isArray(payload)) {
            return res.status(400).json({ error: "Request body must be a JSON array." });
        }

        const result = await collection.insertMany(payload);

        return res.status(201).json({
            message: `Successfully inserted ${result.insertedCount} documents.`,
            insertedIds: result.insertedIds
        });
    } catch (error) {
        return res.status(error.statusCode || 500).json({ error: error.message });
    }
});

router.get("/:collection", async (req, res) => {
    try {
        const { collection: collectionName } = req.params;
        const aggregation = req.query.aggregation === "true";
        const limit = Math.min(parseNumber(req.query.limit, 50), 200);
        const skip = Math.max(parseNumber(req.query.skip, 0), 0);

        if (aggregation) {
            const definition = getAggregationDefinition(collectionName);

            if (!definition) {
                return res.status(404).json({
                    error: `Aggregation not found for collection: ${collectionName}`
                });
            }

            const pipeline = [...definition.pipeline, { $skip: skip }, { $limit: limit }];
            const results = await definition.model.aggregate(pipeline);

            return res.json({
                collection: collectionName,
                aggregated: true,
                total: results.length,
                results
            });
        }

        const collection = getCollectionOrThrow(collectionName);
        const results = await collection.find({}).skip(skip).limit(limit).toArray();

        return res.json({
            collection: collectionName,
            aggregated: false,
            total: results.length,
            results
        });
    } catch (error) {
        return res.status(error.statusCode || 500).json({ error: error.message });
    }
});

router.get("/:collection/:id", async (req, res) => {
    try {
        const collection = getCollectionOrThrow(req.params.collection);
        const _id = parseObjectId(req.params.id);
        const document = await collection.findOne({ _id });

        if (!document) {
            return res.status(404).json({ error: "Document not found." });
        }

        return res.json(document);
    } catch (error) {
        return res.status(error.statusCode || 500).json({ error: error.message });
    }
});

router.put("/:collection/:id", async (req, res) => {
    try {
        const collectionName = req.params.collection;
        const collection = getCollectionOrThrow(collectionName);
        const _id = parseObjectId(req.params.id);
        const payload = req.body;

        if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
            return res.status(400).json({ error: "Request body must be a JSON object." });
        }

        delete payload._id;

        if (isAdminCollection(collectionName)) {
            const existingAdmin = await collection.findOne({ _id });
            const isSuperAdminCollection = collectionName === "super-admin";

            if (!existingAdmin) {
                return res.status(404).json({ error: "Document not found." });
            }

            const currentRole = getSubAdminRole(existingAdmin);
            const nextRole = getSubAdminRole(payload) || currentRole || (isSuperAdminCollection ? SUPER_ADMIN_ROLE_NAME : "");

            if (!isSuperAdminCollection && nextRole === SUPER_ADMIN_ROLE_NAME && currentRole !== SUPER_ADMIN_ROLE_NAME) {
                return res.status(403).json({ error: "Only the main Super Admin account can hold this role." });
            }

            if (isSuperAdminCollection && nextRole !== SUPER_ADMIN_ROLE_NAME) {
                return res.status(403).json({ error: "The super-admin collection can store only the platform owner account." });
            }

            if (nextRole === SUPER_ADMIN_ROLE_NAME) {
                const existingSuperAdmin = await findExistingSuperAdmin({ collectionName, _id });
                if (existingSuperAdmin) {
                    return res.status(403).json({ error: "A Super Admin is already registered. Please login." });
                }

                payload["role Name"] = SUPER_ADMIN_ROLE_NAME;
                payload.scope = "platform";
                payload.storeId = "";
                payload.storeName = "";
            }

            if (payload.Email || payload.email) {
                const email = normalizeEmail(getSubAdminEmail(payload));

                if (!email) {
                    return res.status(400).json({ error: "Email cannot be empty." });
                }

                const duplicateAdmin = await findExistingAdminAccountByEmail(email, {
                    collectionName,
                    _id
                });

                if (duplicateAdmin) {
                    return res.status(409).json({ error: "An admin account with this email already exists." });
                }

                payload.Email = email;
                delete payload.email;
            }

            if ("password" in payload) {
                if (payload.password && String(payload.password).trim()) {
                    payload.password = await bcrypt.hash(String(payload.password), 12);
                } else {
                    delete payload.password;
                }
            }
        }

        const result = await collection.findOneAndUpdate(
            { _id },
            { $set: payload },
            { returnDocument: "after" }
        );

        if (!result) {
            return res.status(404).json({ error: "Document not found." });
        }

        return res.json(result);
    } catch (error) {
        return res.status(error.statusCode || 500).json({ error: error.message });
    }
});

router.delete("/:collection/:id", async (req, res) => {
    try {
        const { collection: collectionName } = req.params;
        const collection = getCollectionOrThrow(collectionName);
        const _id = parseObjectId(req.params.id);

        if (collectionName === "super-admin") {
            return res.status(403).json({ error: "Delete the Super Admin only through the protected reset flow." });
        }

        if (collectionName === "sub-admin") {
            const existingAdmin = await collection.findOne({ _id });
            if (existingAdmin?.["role Name"] === SUPER_ADMIN_ROLE_NAME) {
                return res.status(403).json({ error: "Delete the Super Admin only through the protected reset flow." });
            }
        }

        const result = await collection.findOneAndDelete({ _id });

        if (!result) {
            return res.status(404).json({ error: "Document not found." });
        }

        return res.json({
            message: "Document deleted successfully.",
            document: result
        });
    } catch (error) {
        return res.status(error.statusCode || 500).json({ error: error.message });
    }
});

export default router;
