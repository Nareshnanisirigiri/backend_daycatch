import { createCollectionModel, types } from "./createCollectionModel.js";

const { string } = types;

export default createCollectionModel(
    "Cities",
    "cities",
    {
        city_id: string,
        city_name: { type: string, unique: true }
    },
    { timestamps: false }
);
