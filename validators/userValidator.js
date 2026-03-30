import { body, param } from "express-validator";

export const createUserSchema = [
    body("Name").trim().notEmpty().withMessage("User name is required."),
    body("Email").isEmail().withMessage("Provide a valid email address.").normalizeEmail(),
    body("phone").optional().trim(),
    body("status").optional().isIn(["Active", "Inactive"]).withMessage("Status must be Active or Inactive.")
];

export const updateUserSchema = [
    param("id").isMongoId().withMessage("Invalid User ID format."),
    body("Name").optional().trim(),
    body("Email").optional().isEmail().withMessage("Provide a valid email address.").normalizeEmail(),
    body("status").optional().isIn(["Active", "Inactive"]).withMessage("Status must be Active or Inactive.")
];
