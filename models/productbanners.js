import { createCollectionModel, types } from "./createCollectionModel.js";

const { string, number, mixed, date } = types;

export default createCollectionModel("ProductBanners", "product_banners", {
    title: string,
    image: string,
    status: string
});
