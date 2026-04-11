import { validationResult } from "express-validator";
import ApiError from "../utils/apiError.js";

/**
 * Higher-order middleware to wrap express-validator schemas.
 * It checks for validation errors and returns a formatted 400 response
 * if any field fails validation.
 */
export const validate = (validations) => {
    return async (req, res, next) => {
        // 1) Execute all validation rules (body, query, params)
        await Promise.all(validations.map((validation) => validation.run(req)));

        // 2) Check for errors
        const errors = validationResult(req);
        if (errors.isEmpty()) {
            return next();
        }

        // 3) Return clean, user-facing validation feedback (industry-style toasts)
        const formattedErrors = errors.array().map((err) => ({
            field: err.path,
            message: err.msg
        }));
        const primaryMessage = formattedErrors[0]?.message || "Please check your input and try again.";
        
        console.error(
            `[VALIDATION FAILED] Path: ${req.path}, Body:`,
            req.body,
            "Errors:",
            formattedErrors.map((item) => `${item.field}: ${item.message}`).join(", ")
        );

        const validationError = new ApiError(primaryMessage, 400);
        validationError.validationErrors = formattedErrors;
        return next(validationError);
    };
};
