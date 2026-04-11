import { createCollectionModel, types } from "./createCollectionModel.js";

const { string, number, mixed, date } = types;

export default createCollectionModel("Globalsettings", "Globalsettings", {
    key: string,
    value: string,
    label: string
});
