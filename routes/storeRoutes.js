import express from "express";
import * as storeController from "../controllers/storeController.js";
import * as storeWorkspaceController from "../controllers/storeWorkspaceController.js";
import {
    allowStoreWorkspaceAccess,
    optionalProtect,
    protect,
    restrictToPlatformUsers
} from "../middleware/authMiddleware.js";
import { validate } from "../middleware/validator.js";
import { createStoreSchema, updateStoreSchema } from "../validators/storeValidator.js";

const router = express.Router();

router
    .route("/")
    .get(optionalProtect, storeController.getAllStores)
    .post(protect, restrictToPlatformUsers, validate(createStoreSchema), storeController.createStore);

router.get("/:id/workspace/dashboard", protect, allowStoreWorkspaceAccess, storeWorkspaceController.getStoreWorkspaceDashboard);
router
    .route("/:id/workspace/orders")
    .get(protect, allowStoreWorkspaceAccess, storeWorkspaceController.getStoreWorkspaceOrders);
router.patch(
    "/:id/workspace/orders/:orderId/status",
    protect,
    allowStoreWorkspaceAccess,
    storeWorkspaceController.updateStoreWorkspaceOrderStatus
);
router
    .route("/:id/workspace/settings")
    .get(protect, allowStoreWorkspaceAccess, storeWorkspaceController.getStoreWorkspaceSettings)
    .patch(protect, allowStoreWorkspaceAccess, storeWorkspaceController.updateStoreWorkspaceSettings);
router.get("/:id/workspace/catalog/products", protect, allowStoreWorkspaceAccess, storeWorkspaceController.getStoreCatalogProducts);
router.patch("/:id/workspace/catalog/products/:productId/pricing", protect, allowStoreWorkspaceAccess, storeWorkspaceController.updateStoreCatalogPricing);
router.patch("/:id/workspace/catalog/products/:productId/stock", protect, allowStoreWorkspaceAccess, storeWorkspaceController.updateStoreCatalogStock);
router.patch("/:id/workspace/catalog/products/:productId/order-quantity", protect, allowStoreWorkspaceAccess, storeWorkspaceController.updateStoreCatalogOrderQuantity);
router
    .route("/:id/workspace/catalog/deals")
    .get(protect, allowStoreWorkspaceAccess, storeWorkspaceController.getStoreDeals)
    .post(protect, allowStoreWorkspaceAccess, storeWorkspaceController.createStoreDeal);
router.delete("/:id/workspace/catalog/deals/:productId", protect, allowStoreWorkspaceAccess, storeWorkspaceController.deleteStoreDeal);
router
    .route("/:id/workspace/catalog/spotlight")
    .get(protect, allowStoreWorkspaceAccess, storeWorkspaceController.getStoreSpotlight)
    .put(protect, allowStoreWorkspaceAccess, storeWorkspaceController.updateStoreSpotlight);

router
    .route("/:id")
    .get(optionalProtect, storeController.getStore)
    .patch(protect, restrictToPlatformUsers, validate(updateStoreSchema), storeController.updateStore)
    .delete(protect, restrictToPlatformUsers, storeController.deleteStore);

export default router;
