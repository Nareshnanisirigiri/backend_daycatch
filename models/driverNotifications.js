import { createCollectionModel, types } from "./createCollectionModel.js";

const { string } = types;

export default createCollectionModel("DriverNotifications", "driver_notifications", {
    select_driver: string,
    title: string,
    message: string,
    image: string
}, { timestamps: false });
