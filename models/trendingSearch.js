import { createCollectionModel, types } from "./createCollectionModel.js";

const { string, number, date } = types;

export default createCollectionModel("TrendingSearch", "trending_search", {
    Keyword: string,
    "Search Count": number,
    "Last Updated": date
});
