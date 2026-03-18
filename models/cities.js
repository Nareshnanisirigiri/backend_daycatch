import { createCollectionModel, types } from "./createCollectionModel.js";

const { string } = types;

export default createCollectionModel("Cities", "cities", {
    "City ID": string,
    "City Name": string
});
