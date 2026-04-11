import { createCollectionModel, types } from "./createCollectionModel.js";

const { string } = types;

export default createCollectionModel("UserNotifications", "user_notifications", {
    select_users: string,
    title: string,
    message: string,
    image: string
}, { timestamps: false });
