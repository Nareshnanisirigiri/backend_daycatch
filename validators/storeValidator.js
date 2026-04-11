import { body } from "express-validator";

const phoneValidation = body("phone_number")
    .trim()
    .notEmpty()
    .withMessage("Store phone number is required.")
    .matches(/^[0-9]{10}$/)
    .withMessage("Store mobile number must be exactly 10 digits.");

const optionalPhoneValidation = body("phone_number")
    .optional()
    .trim()
    .matches(/^[0-9]{10}$/)
    .withMessage("Store mobile number must be exactly 10 digits.");

export const createStoreSchema = [
    phoneValidation
];

export const updateStoreSchema = [
    optionalPhoneValidation
];
