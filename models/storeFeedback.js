import { createCollectionModel, types } from "./createCollectionModel.js";

const { string } = types;

export default createCollectionModel("StoreFeedback", "storefeedback", {
    Store: string,
    Feedback: string
});
