import { createCollectionModel, types } from "./createCollectionModel.js";

const { string, number, mixed } = types;

export default createCollectionModel("StoreList", "storeList", {
    "Profile Pic": string,
    "Store Name": string,
    "Employee Name": string,
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
    status: string,
    "ID Type": string,
    "ID Number": string,
    "ID Image": string,
    "admin share": number,
    "Delivery Range": number,
    "Orders Per Slot": number,
    "Start Time": string,
    "End Time": string,
    "Slot Interval": number,
    "Free Delivery Limit": number,
    "Delivery Charge": number,
    "Minimum Order Value": number,
    "Maximum Order Value": number,
    "Driver Incentive": number
});
