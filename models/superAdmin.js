import { createCollectionModel, types } from "./createCollectionModel.js";

const { string, date, number } = types;

export default createCollectionModel("SuperAdmin", "super-admin", {
    name: string,
    email: string,
    password: string,
    admin_image: string,
    remember_token: string,
    role_id: { type: number, defaultValue: 0 },
    role_name: string,
    passwordResetToken: string,
    passwordResetExpires: date
});
