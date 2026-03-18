import { createCollectionModel, types } from "./createCollectionModel.js";

const { string } = types;

export default createCollectionModel("UserNotifications", "user_notifications", {
    "Select Users": string,
    Title: string,
    Message: string,
    Image: string
});
