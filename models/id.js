import { createCollectionModel, types } from "./createCollectionModel.js";

const { string } = types;

export default createCollectionModel("IdDocument", "id", {
    ID: string,
    "ID Name": string,
    "ID number": string,
    image: string
});
