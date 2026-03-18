import { createCollectionModel, types } from "./createCollectionModel.js";

const { string } = types;

export default createCollectionModel("Area", "area", {
    "Society Name": string,
    "City Name": string
});
