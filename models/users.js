import { createCollectionModel, types } from "./createCollectionModel.js";

const { string, date, boolean, mixed } = types;

export default createCollectionModel("Users", "users", {
    "User Name": string,
    "User Phone": string,
    "User Email": string,
    "Registration Date": date,
    "Is Verified": boolean,
    status: string,
    City: string,
    Location: string,
    "Wallet Balance": mixed
});
