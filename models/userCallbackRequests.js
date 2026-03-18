import { createCollectionModel, types } from "./createCollectionModel.js";

const { string } = types;

export default createCollectionModel("UserCallbackRequests", "usercallbackrequests", {
    ID: string,
    "User Name": string,
    "User Phone": string,
    "Callback To": string
});
