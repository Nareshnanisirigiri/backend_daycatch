import { createCollectionModel, types } from "./createCollectionModel.js";

const { string, number, boolean } = types;

export default createCollectionModel("Membership", "membership", {
    image: string,
    plan_name: string,
    plan_days: number,
    plan_price: number,
    free_delivery: boolean,
    instant_delivery: boolean,
    reward: number,
    description: string
}, { timestamps: false });
