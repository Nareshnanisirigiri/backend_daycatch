import { createCollectionModel, types } from "./createCollectionModel.js";

const { string, number } = types;

export default createCollectionModel("Tax", "tax", {
    tax_name: { type: string, unique: true },
    tax_per: number,
    status: number
}, { timestamps: false });
