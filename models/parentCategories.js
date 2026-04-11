import { createCollectionModel, types } from "./createCollectionModel.js";

const { string, integer, number } = types;

export default createCollectionModel(
    "ParentCategories",
    "categories",
    {
        id: { type: integer, primaryKey: true, autoIncrement: true },
        name: { type: string, unique: true },
        slug: string,
        image: string,
        description: string,
        status: { type: number, defaultValue: 1 }
    },
    { timestamps: true, createdAt: "created_at", updatedAt: "updated_at" }
);
