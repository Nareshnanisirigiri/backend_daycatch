import { createCollectionModel, types } from "./createCollectionModel.js";

const { string } = types;

export default createCollectionModel("DriverNotifications", "driver_notifications", {
    "Select Driver": string,
    Title: string,
    Message: string,
    Image: string
});
