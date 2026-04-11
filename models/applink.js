import { createCollectionModel, types } from "./createCollectionModel.js";

const { string, number, mixed, date } = types;

export default createCollectionModel("AppLink", "app link", {
    key: string,
    value: string,
    label: string
});
