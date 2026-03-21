import { createCollectionModel, types } from "./createCollectionModel.js";

const { string, number, mixed } = types;

export default createCollectionModel("DeliveryBoy", "deliveryboy", {
    "Boy Name": string,
    "Boy Phone": string,
    "Boy Password": string,
    Status: string,
    Orders: number,
    "Total Earnings": number,
    Rating: number,
    Details: mixed
});
