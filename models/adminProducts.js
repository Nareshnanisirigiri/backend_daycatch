import { createCollectionModel, types } from "./createCollectionModel.js";

const { string, number } = types;

export default createCollectionModel("AdminProducts", "admin_products", {
    product_id: string,
    product_name: string,
    category: string,
    type: string,
    product_image: string,
    quantity: number,
    ean_code: string,
    tags: string,
    unit: string,
    mrp: number,
    price: number,
    description: string
});
