import express from "express";
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

router.get("/", (req, res) => {
    return res.json({
        total: collections.length,
        collections
    });
});

router.post("/:collection", async (req, res) => {
    try {
        const collection = getCollectionOrThrow(req.params.collection);
        const payload = req.body;

        if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
            return res.status(400).json({ error: "Request body must be a JSON object." });
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
        const collection = getCollectionOrThrow(req.params.collection);
        const _id = parseObjectId(req.params.id);
        const payload = req.body;

        if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
            return res.status(400).json({ error: "Request body must be a JSON object." });
        }

        delete payload._id;

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
        const collection = getCollectionOrThrow(req.params.collection);
        const _id = parseObjectId(req.params.id);
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
