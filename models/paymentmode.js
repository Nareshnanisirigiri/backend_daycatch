import { createCollectionModel, types } from "./createCollectionModel.js";

const { string, number, mixed, date } = types;

export default createCollectionModel("PaymentMode", "payment mode", {
    key: string,
    value: string,
    label: string
});
