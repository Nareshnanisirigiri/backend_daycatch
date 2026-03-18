import { createCollectionModel, types } from "./createCollectionModel.js";

const { number } = types;

export default createCollectionModel("Payouts", "payouts", {
    "Minimum Amount": number,
    "Minimum Days": number
});
