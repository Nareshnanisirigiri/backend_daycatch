import express from "express";
import * as subAdminController from "../controllers/subAdminController.js";
import { protect, restrictToSuperAdmin } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/me/access", protect, subAdminController.getMyAccessSummary);
router.get("/me/cities", protect, subAdminController.getMyAccessibleCities);

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

router
    .route("/:id/cities")
    .get(subAdminController.getSubAdminCities)
    .put(subAdminController.updateSubAdminCities);

export default router;
