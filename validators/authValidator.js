import { body } from "express-validator";

export const registerSchema = [
    body("name").trim().notEmpty().withMessage("Name is required."),
    body("email").trim().isEmail().withMessage("Provide a valid email address.").normalizeEmail(),
    body("password").isLength({ min: 8 }).withMessage("Password must be at least 8 characters long."),
    body("roleName").optional().trim(),
    body("phone").optional().trim()
];

export const loginSchema = [
    body("email").trim().isEmail().withMessage("Invalid email or password.").normalizeEmail(),
    body("password").notEmpty().withMessage("Invalid email or password.")
];

export const forgotPasswordSchema = [
    body("email").trim().isEmail().withMessage("Provide a valid email address.").normalizeEmail()
];

export const resetPasswordSchema = [
    body("password").isLength({ min: 8 }).withMessage("Password must be at least 8 characters long.")
];

export const changePasswordSchema = [
    body("oldPassword").notEmpty().withMessage("Current password is required."),
    body("newPassword").isLength({ min: 8 }).withMessage("New password must be at least 8 characters long.")
];
