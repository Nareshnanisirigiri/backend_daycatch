import { createCollectionModel, types } from "./createCollectionModel.js";

const { string, number, mixed, date } = types;

export default createCollectionModel("CategoryBanners", "category_banners", {
    title: string,
    image: string,
    status: string
});
