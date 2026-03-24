import express from "express";
import * as authController from "../controllers/authController.js";

const router = express.Router();

router.post("/register", authController.register);
router.post("/login", authController.login);
router.patch("/change-password", authController.changePassword);
router.patch("/update-profile", authController.updateProfile);
router.post("/forgot-password", authController.forgotPassword);
router.patch("/reset-password/:token", authController.resetPassword);
router.delete("/reset-super-admin", authController.resetSuperAdmin);

export default router;
