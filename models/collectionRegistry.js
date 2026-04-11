import * as models from "./index.js";

const registry = new Map();

for (const model of Object.values(models)) {
    if (!model || typeof model.getTableName !== "function") continue;
    // Lowercase key for case-insensitive lookup
    registry.set(String(model.getTableName()).toLowerCase(), model);
}

// Manual aliases for legacy collection names that map to existing tables
if (models.ParentCategories) {
    registry.set("parentcategories", models.ParentCategories);
}

export function getModelByCollectionName(collectionName = "") {
    // Lowercase the lookup key
    const key = String(collectionName).toLowerCase();
    return registry.get(key) || null;
}

export function listCollectionModels() {
    return Array.from(registry.keys());
}
