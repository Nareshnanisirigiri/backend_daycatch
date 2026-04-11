import { createCollectionModel, types } from "./createCollectionModel.js";

const { string, number, mixed, date } = types;

export default createCollectionModel("CancellingReason", "cancelling reason", {
    status: string,
    details: mixed
});
