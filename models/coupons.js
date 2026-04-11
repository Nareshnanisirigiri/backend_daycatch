import { createCollectionModel, types } from "./createCollectionModel.js";

const { string, number, mixed, date } = types;

export default createCollectionModel("Coupons", "coupons", {
    "Coupon Code": string,
    discount: number,
    description: string,
    status: string
});
