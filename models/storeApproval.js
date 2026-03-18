import { createCollectionModel, types } from "./createCollectionModel.js";

const { string, number, mixed } = types;

export default createCollectionModel("StoreApproval", "storeapproval", {
    "Profile Pic": string,
    "Store Name": string,
    City: string,
    Mobile: string,
    Email: string,
    "Admin Share": number,
    "Owner name": string,
    Details: mixed
});
