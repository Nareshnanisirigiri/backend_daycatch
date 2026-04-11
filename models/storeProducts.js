import { createCollectionModel, types } from "./createCollectionModel.js";

const { string, number, date, mixed } = types;

export default createCollectionModel("StoreProducts", "store_products", {
    store_id: string,
    admin_product_id: string,
    product_id: string,
    image: string,
    product_name: string,
    category: string,
    type: string,
    price: number,
    mrp: number,
    stock: number,
    order_quantity: number,
    store: string,
    status: string,
    deal: string,
    spotlight: string,
    review_notes: string,
    submitted_at: date,
    updated_at: date,
    approved_at: date,
    reviewed_at: date
});
