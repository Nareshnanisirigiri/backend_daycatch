import { createCollectionModel, types } from "./createCollectionModel.js";

const { string, number } = types;

export default createCollectionModel("Area", "area", {
    "Society Name": string,
    "City Name": string,
    "Delivery Charge": number
});
