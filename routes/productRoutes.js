import express from "express";
import * as productController from "../controllers/productController.js";
import { protect, restrictToSuperAdmin } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(protect);

router
    .route("/")
    .get(productController.getAllProducts)
    .post(restrictToSuperAdmin, productController.createProduct);

router
    .route("/:id")
    .get(productController.getProduct)
    .patch(restrictToSuperAdmin, productController.updateProduct)
    .delete(restrictToSuperAdmin, productController.deleteProduct);

export default router;
