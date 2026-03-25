import express from "express";
import * as subAdminController from "../controllers/subAdminController.js";
import { protect, restrictToSuperAdmin } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(protect, restrictToSuperAdmin);

router
    .route("/")
    .get(subAdminController.getAllSubAdmins)
    .post(subAdminController.createSubAdmin);

router
    .route("/:id")
    .get(subAdminController.getSubAdmin)
    .patch(subAdminController.updateSubAdmin)
    .delete(subAdminController.deleteSubAdmin);

export default router;
