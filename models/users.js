import { createCollectionModel, types } from "./createCollectionModel.js";

const { string, date, boolean, mixed } = types;

export default createCollectionModel("Users", "users", {
    "User Name": string,
    "User Phone": string,
    "User Email": string,
    "User Password": string,
    "Registration Date": date,
    "Is Verified": boolean,
    status: string,
    City: string,
    Society: string,
    Location: string,
    "Wallet Balance": mixed,
    "User Rewards": mixed
});
