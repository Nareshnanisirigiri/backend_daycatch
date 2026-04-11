import { createCollectionModel, types } from "./createCollectionModel.js";

const { string, number, mixed, date } = types;

export default createCollectionModel("AppNotice", "app notice", {
    status: string,
    details: mixed
});
