import { createCollectionModel, types } from "./createCollectionModel.js";

const { number } = types;

export default createCollectionModel(
    "RedeemValue",
    "reedm value",
    {
        "Reward Points": number,
        "Redeem Values": number
    },
    { timestamps: false }
);
