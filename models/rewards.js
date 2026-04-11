import { createCollectionModel, types } from "./createCollectionModel.js";

const { number } = types;

export default createCollectionModel(
    "Rewards",
    "rewards",
    {
        "Cart Value": number,
        "Reward Points": number
    },
    { timestamps: false }
);
