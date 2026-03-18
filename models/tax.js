import { createCollectionModel, types } from "./createCollectionModel.js";

const { string } = types;

export default createCollectionModel("Tax", "tax", {
    "Tax Type name": string
});
