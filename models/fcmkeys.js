import { createCollectionModel, types } from "./createCollectionModel.js";

const { string, number, mixed, date } = types;

export default createCollectionModel("FcmKeys", "FCM keys", {
    key: string,
    value: string,
    label: string
});
