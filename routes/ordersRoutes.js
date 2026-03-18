import express from "express";
import {
    createOrder,
    deleteOrder,
    getOrderById,
    getOrders,
    updateOrder
} from "../controllers/OrdersController.js";

const router = express.Router();

router.post("/", createOrder);
router.get("/", getOrders);
router.get("/:id", getOrderById);
router.put("/:id", updateOrder);
router.delete("/:id", deleteOrder);

export default router;
