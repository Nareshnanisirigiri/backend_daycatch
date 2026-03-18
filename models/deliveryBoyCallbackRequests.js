import { createCollectionModel, types } from "./createCollectionModel.js";

const { string } = types;

export default createCollectionModel("DeliveryBoyCallbackRequests", "deliveryboycallbackrequests", {
    ID: string,
    "Delivery Boy Name": string,
    "Delivery Boy Phone": string,
    "Added By": string
});
