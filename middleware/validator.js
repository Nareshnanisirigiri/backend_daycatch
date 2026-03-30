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

        // 3) Format errors into a readable string/object for the client
        const errorDetails = errors.array().map((err) => `${err.path}: ${err.msg}`).join(", ");
        
        return next(new ApiError(`Validation failed: ${errorDetails}`, 400));
    };
};
