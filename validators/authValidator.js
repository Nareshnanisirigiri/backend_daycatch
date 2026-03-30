import { body } from "express-validator";

export const registerSchema = [
    body("name").trim().notEmpty().withMessage("Name is required."),
    body("email").isEmail().withMessage("Provide a valid email address.").normalizeEmail(),
    body("password").isLength({ min: 8 }).withMessage("Password must be at least 8 characters long."),
    body("roleName").optional().trim(),
    body("phone").optional().trim()
];

export const loginSchema = [
    body("email").isEmail().withMessage("Provide a valid email address.").normalizeEmail(),
    body("password").notEmpty().withMessage("Password is required.")
];

export const forgotPasswordSchema = [
    body("email").isEmail().withMessage("Provide a valid email address.").normalizeEmail()
];

export const resetPasswordSchema = [
    body("password").isLength({ min: 8 }).withMessage("Password must be at least 8 characters long.")
];

export const changePasswordSchema = [
    body("oldPassword").notEmpty().withMessage("Current password is required."),
    body("newPassword").isLength({ min: 8 }).withMessage("New password must be at least 8 characters long.")
];
