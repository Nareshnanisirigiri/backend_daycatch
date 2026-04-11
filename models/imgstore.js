import { createCollectionModel, types } from "./createCollectionModel.js";

const { string, number, mixed, date } = types;

export default createCollectionModel("ImgStore", "img store", {
    status: string,
    details: mixed
});
