import { wrapPrismaModel } from "./prismaShim.js";

export const types = {
    string: "string",
    number: "number",
    integer: "integer",
    boolean: "boolean",
    date: "date",
    mixed: "mixed"
};

function toPrismaModelKey(collectionName = "") {
    return String(collectionName)
        .trim()
        .toLowerCase()
        .replace(/\s+/g, "_")
        .replace(/-/g, "_");
}

export function createCollectionModel(modelName, collectionName, definition, options = {}) {
    // Prisma already owns the schema; this adapter keeps legacy model files working
    // while routing all queries through Prisma.
    return wrapPrismaModel(toPrismaModelKey(collectionName));
}
