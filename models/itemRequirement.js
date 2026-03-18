import { createCollectionModel, types } from "./createCollectionModel.js";

const { string } = types;

export default createCollectionModel("ItemRequirement", "item_requirement", {
    "Store Name": string,
    City: string,
    Mobile: string,
    Email: string,
    "Item Sale Report": string
});
