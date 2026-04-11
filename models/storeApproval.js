import { createCollectionModel, types } from "./createCollectionModel.js";

const { string, number, mixed } = types;

export default createCollectionModel("StoreApproval", "storeapproval", {
    profile_pic: string,
    store_name: string,
    city: string,
    mobile: string,
    email: string,
    admin_share: number,
    owner_name: string,
    details: mixed
});
