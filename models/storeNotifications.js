import { createCollectionModel, types } from "./createCollectionModel.js";

const { string } = types;

export default createCollectionModel("StoreNotifications", "store_notifications", {
    select_store: string,
    title: string,
    message: string,
    image: string
}, { timestamps: false });
