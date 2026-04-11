import { createCollectionModel, types } from "./createCollectionModel.js";

const { string, number, date } = types;

export default createCollectionModel(
    "TrendingSearch",
    "trending_search",
    {
    keyword: string,
    store_product_id: string,
    product_id: string,
    product_name: string,
    category: string,
    type: string,
    product_image: string,
    store: string,
    tags: string,
    unit: string,
    mrp: number,
    price: number,
    status: string,
    position: number,
    search_count: number,
    last_updated: date
    },
    { timestamps: false }
);
