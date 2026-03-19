import express from "express";
import * as deliveryBoyController from "../controllers/deliveryBoyController.js";

const router = express.Router();

router
    .route("/")
    .get(deliveryBoyController.getAllDeliveryBoys)
    .post(deliveryBoyController.createDeliveryBoy);

router
    .route("/:id")
    .get(deliveryBoyController.getDeliveryBoy)
    .patch(deliveryBoyController.updateDeliveryBoy)
    .delete(deliveryBoyController.deleteDeliveryBoy);

export default router;
