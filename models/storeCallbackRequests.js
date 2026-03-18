import { createCollectionModel, types } from "./createCollectionModel.js";

const { string } = types;

export default createCollectionModel("StoreCallbackRequests", "storecallbackrequests", {
    ID: string,
    "Store Name": string,
    "Store Phone": string
});
