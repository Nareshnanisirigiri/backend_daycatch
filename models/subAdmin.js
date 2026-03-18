import { createCollectionModel, types } from "./createCollectionModel.js";

const { string } = types;

export default createCollectionModel("SubAdmin", "sub-admin", {
    Image: string,
    Name: string,
    Email: string,
    password: string,
    "role Name": string
});
