import { createCollectionModel, types } from "./createCollectionModel.js";

const { string } = types;

export default createCollectionModel("StoreNotifications", "store_notifications", {
    "Select store": string,
    Title: string,
    Message: string,
    Image: string
});
