import express from "express";
import { getAggregationDefinition, listAggregations } from "../aggregations/index.js";

const router = express.Router();

router.get("/", (req, res) => {
    const { collection } = req.query;

    if (!collection) {
        return res.json({
            message: "Pass ?collection=<collection-name> to run an aggregation.",
            collections: listAggregations()
        });
    }

    const definition = getAggregationDefinition(collection);

    if (!definition) {
        return res.status(404).json({
            error: `Aggregation not found for collection: ${collection}`,
            collections: listAggregations().map(({ key }) => key)
        });
    }

    return res.json({
        collection,
        description: definition.description,
        pipeline: definition.pipeline
    });
});

router.get("/:collection", async (req, res) => {
    try {
        const definition = getAggregationDefinition(req.params.collection);

        if (!definition) {
            return res.status(404).json({
                error: `Aggregation not found for collection: ${req.params.collection}`,
                collections: listAggregations().map(({ key }) => key)
            });
        }

        const results = await definition.model.aggregate(definition.pipeline);

        return res.json({
            collection: req.params.collection,
            description: definition.description,
            total: results.length,
            results
        });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
});

export default router;
