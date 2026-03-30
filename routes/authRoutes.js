import express from "express";
import * as authController from "../controllers/authController.js";
import { validate } from "../middleware/validator.js";
import { registerSchema, loginSchema, forgotPasswordSchema, resetPasswordSchema, changePasswordSchema } from "../validators/authValidator.js";

const router = express.Router();

router.get("/register-status", authController.getRegisterStatus);
router.post("/register", validate(registerSchema), authController.register);
router.post("/login", validate(loginSchema), authController.login);
router.post("/logout", authController.logout);
router.post("/refresh-token", authController.refreshToken);
router.patch("/change-password", validate(changePasswordSchema), authController.changePassword);
router.patch("/update-profile", authController.updateProfile);
router.post("/forgot-password", validate(forgotPasswordSchema), authController.forgotPassword);
router.patch("/reset-password/:token", validate(resetPasswordSchema), authController.resetPassword);
router.delete("/reset-super-admin", authController.resetSuperAdmin);

export default router;
