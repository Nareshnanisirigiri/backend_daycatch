import { createCollectionModel, types } from "./createCollectionModel.js";

const { string } = types;

export default createCollectionModel("UserFeedback", "Userfeedback", {
    Users: string,
    Feedback: string
});
