import { ObjectId } from "mongodb";
import mongoose from "mongoose";
import { getAggregationDefinition } from "../aggregations/index.js";

const ORDERS_COLLECTION = "orders";
const ORDERS_AGGREGATION_KEY = "orders";

function getOrdersCollection() {
    return mongoose.connection.db.collection(ORDERS_COLLECTION);
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

function validatePayload(payload) {
    if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
        const error = new Error("Request body must be a JSON object.");
        error.statusCode = 400;
        throw error;
    }
}

export async function createOrder(req, res) {
    try {
        const payload = req.body;
        validatePayload(payload);

        const collection = getOrdersCollection();
        const result = await collection.insertOne(payload);
        const document = await collection.findOne({ _id: result.insertedId });

        return res.status(201).json(document);
    } catch (error) {
        return res.status(error.statusCode || 500).json({ error: error.message });
    }
}

export async function getOrders(req, res) {
    try {
        const aggregation = req.query.aggregation === "true";
        const limit = Math.min(parseNumber(req.query.limit, 50), 200);
        const skip = Math.max(parseNumber(req.query.skip, 0), 0);

        if (aggregation) {
            const definition = getAggregationDefinition(ORDERS_AGGREGATION_KEY);

            if (!definition) {
                return res.status(404).json({
                    error: `Aggregation not found for collection: ${ORDERS_AGGREGATION_KEY}`
                });
            }

            const pipeline = [...definition.pipeline, { $skip: skip }, { $limit: limit }];
            const results = await definition.model.aggregate(pipeline);

            return res.json({
                collection: ORDERS_COLLECTION,
                aggregated: true,
                total: results.length,
                results
            });
        }

        const collection = getOrdersCollection();
        const results = await collection.find({}).skip(skip).limit(limit).toArray();

        return res.json({
            collection: ORDERS_COLLECTION,
            aggregated: false,
            total: results.length,
            results
        });
    } catch (error) {
        return res.status(error.statusCode || 500).json({ error: error.message });
    }
}

export async function getOrderById(req, res) {
    try {
        const collection = getOrdersCollection();
        const _id = parseObjectId(req.params.id);
        const document = await collection.findOne({ _id });

        if (!document) {
            return res.status(404).json({ error: "Document not found." });
        }

        return res.json(document);
    } catch (error) {
        return res.status(error.statusCode || 500).json({ error: error.message });
    }
}

export async function updateOrder(req, res) {
    try {
        const payload = req.body;
        validatePayload(payload);
        delete payload._id;

        const collection = getOrdersCollection();
        const _id = parseObjectId(req.params.id);
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
}

export async function deleteOrder(req, res) {
    try {
        const collection = getOrdersCollection();
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
}
