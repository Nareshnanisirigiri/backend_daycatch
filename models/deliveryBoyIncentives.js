import { createCollectionModel, types } from "./createCollectionModel.js";

const { string, number, mixed } = types;

export default createCollectionModel("DeliveryBoyIncentives", "deliveryboy_incentives", {
    "Delivery Boy": string,
    Address: string,
    "Bank/UPI": mixed,
    "Total Incentive": number,
    "Paid Incentive": number,
    "Pending Incentive": number
});
