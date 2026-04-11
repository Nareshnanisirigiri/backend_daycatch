import { createCollectionModel, types } from "./createCollectionModel.js";

const { string, number, mixed, date } = types;

export default createCollectionModel("MapSettings", "map settings", {
    key: string,
    value: string,
    label: string
});
