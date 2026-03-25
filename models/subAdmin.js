import { createCollectionModel, types } from "./createCollectionModel.js";

const { string, date } = types;

export default createCollectionModel("SubAdmin", "sub-admin", {
    Image: string,
    Name: string,
    Email: string,
    phone: string,
    password: string,
    "role Name": string,
    scope: string,
    storeId: string,
    storeName: string,
    status: string,
    passwordResetToken: string,
    passwordResetExpires: date
});
