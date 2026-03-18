import { createCollectionModel, types } from "./createCollectionModel.js";

const { string, date, boolean } = types;

export default createCollectionModel("Users", "users", {
    "User Name": string,
    "User Phone": string,
    "User Email": string,
    "Registration Date": date,
    "Is Verified": boolean
});
