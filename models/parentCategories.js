import { createCollectionModel, types } from "./createCollectionModel.js";

const { string, number } = types;

export default createCollectionModel("ParentCategories", "parentcategories", {
    Title: string,
    Category: string,
    Image: string,
    "Cart Id": string,
    tax: string,
    taxtName: string,
    "Tax percentage": number,
    description: string
});
