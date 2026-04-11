import { createCollectionModel, types } from "./createCollectionModel.js";

const { string, number, date, integer } = types;

export default createCollectionModel("Orders", "orders", {
    order_id: { type: integer, primaryKey: true, autoIncrement: true },
    cart_id: string,
    user_id: integer,
    store_id: integer,
    dboy_id: { type: integer, defaultValue: 0 },
    address_id: integer,
    total_price: number,
    price_without_delivery: number,
    total_products_mrp: number,
    delivery_charge: number,
    user_wallet: { type: number, defaultValue: 0 },
    order_date: date,
    delivery_date: date,
    time_slot: string,
    payment_method: string,
    payment_status: string,
    order_status: { type: string, defaultValue: "Pending" },
    user_signature: string,
    cancelling_reason: string,
    coupon_id: { type: integer, defaultValue: 0 },
    coupon_discount: { type: number, defaultValue: 0 },
    payment_gateway: string,
    order_type: { type: string, defaultValue: "normal" }
}, { timestamps: true, createdAt: "created_at", updatedAt: "updated_at" });
