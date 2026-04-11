import { createCollectionModel, types } from "./createCollectionModel.js";

const { string, number, mixed, date } = types;

export default createCollectionModel("SmsSettings", "SMS Settings", {
    status: string,
    details: mixed
});
