import { createCollectionModel, types } from "./createCollectionModel.js";

const { string, number, mixed } = types;

export default createCollectionModel("StoreList", "storeList", {
    "Profile Pic": string,
    "Store Name": string,
    City: string,
    Mobile: string,
    Email: string,
    orders: number,
    Details: mixed,
    "owner name": string,
    contact: string,
    mail: string,
    time: string,
    address: string,
    slot: string,
    "admin share": number
});
