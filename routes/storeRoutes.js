import express from "express";
import * as storeController from "../controllers/storeController.js";

const router = express.Router();

router
    .route("/")
    .get(storeController.getAllStores)
    .post(storeController.createStore);

router
    .route("/:id")
    .get(storeController.getStore)
    .patch(storeController.updateStore)
    .delete(storeController.deleteStore);

export default router;
