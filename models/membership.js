import { createCollectionModel, types } from "./createCollectionModel.js";

const { string, number, boolean } = types;

export default createCollectionModel("Membership", "membership", {
    Image: string,
    "Plan Name": string,
    "Plan Days": number,
    "Plan Price": number,
    "Free Delivery": boolean,
    "Instant Delivery": boolean,
    Reward: number,
    Description: string
});
