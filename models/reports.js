import { createCollectionModel, types } from "./createCollectionModel.js";

const { string, number, mixed, date } = types;

export default createCollectionModel("Reports", "reports", {
    status: string,
    details: mixed
});
