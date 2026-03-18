import { createCollectionModel, types } from "./createCollectionModel.js";

const { string } = types;

export default createCollectionModel("DeliveryBoyFeedback", "deliveryboyfeedback", {
    "Delivery Boy": string,
    Feedback: string
});
