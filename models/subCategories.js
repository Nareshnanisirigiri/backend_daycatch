import { createCollectionModel, types } from "./createCollectionModel.js";

const { string } = types;

export default createCollectionModel("SubCategories", "subcategories", {
    Title: string,
    "Parent Category": string,
    "Category Image": string,
    "Cart id": string,
    description: string
});
