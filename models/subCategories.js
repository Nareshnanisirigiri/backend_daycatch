import { createCollectionModel, types } from "./createCollectionModel.js";

const { string, integer, number } = types;

export default createCollectionModel(
    "SubCategories",
    "subcategories",
    {
        id: { type: integer, primaryKey: true, autoIncrement: true },
        category_id: { type: integer, allowNull: false },
        name: string,
        slug: string,
        image: string,
        description: string,
        status: { type: number, defaultValue: 1 }
    },
    { timestamps: true, createdAt: "created_at", updatedAt: "updated_at" }
);
