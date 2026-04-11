import { createCollectionModel, types } from "./createCollectionModel.js";

const { string, number } = types;

export default createCollectionModel("IdDocument", "id", {
    id_name: string,
    status: number
}, { timestamps: false });
