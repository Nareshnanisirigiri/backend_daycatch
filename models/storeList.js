import { createCollectionModel, types } from "./createCollectionModel.js";

const { string, number, integer } = types;

export default createCollectionModel("StoreList", "storelist", {
    store_name: { type: string, unique: true },
    employee_name: string,
    phone_number: string,
    city: string,
    email: string,
    password: { type: string, defaultValue: "" },
    address: string,
    lat: string,
    lng: string,
    status: { type: integer, defaultValue: 1 },
    admin_share: { type: number, defaultValue: 0 },
    store_photo: string,
    store_opening_time: string,
    store_closing_time: string,
    pincode: string
}, { timestamps: false });
