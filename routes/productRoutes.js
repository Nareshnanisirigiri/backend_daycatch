import express from "express";
import * as productController from "../controllers/productController.js";

const router = express.Router();

router
    .route("/api/products")
    .get(productController.getAllProducts)
    .post(productController.createProduct);

router
    .route("/api/products/:id")
    .get(productController.getProduct)
    .patch(productController.updateProduct)
    .delete(productController.deleteProduct);

export default router;
