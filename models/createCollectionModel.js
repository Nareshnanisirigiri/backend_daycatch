import mongoose from "mongoose";

export const types = {
    string: String,
    number: Number,
    boolean: Boolean,
    date: Date,
    mixed: mongoose.Schema.Types.Mixed
};

export function createCollectionModel(modelName, collectionName, definition) {
    const schema = new mongoose.Schema(definition, {
        collection: collectionName,
        versionKey: false
    });

    return mongoose.models[modelName] || mongoose.model(modelName, schema, collectionName);
}
