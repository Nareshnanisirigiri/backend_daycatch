import { createCollectionModel, types } from "./createCollectionModel.js";

const { string, number } = types;

export default createCollectionModel(
    "Area",
    "area",
    {
        society_name: string,
        city_name: string,
        delivery_charge: number
    },
    { timestamps: false }
);
