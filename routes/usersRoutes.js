import express from "express";
import * as userController from "../controllers/userController.js";
import { validate } from "../middleware/validator.js";
import { createUserSchema, updateUserSchema } from "../validators/userValidator.js";

const router = express.Router();

router
    .route("/")
    .get(userController.getAllUsers)
    .post(validate(createUserSchema), userController.createUser);

router
    .route("/:id")
    .get(userController.getUser)
    .patch(validate(updateUserSchema), userController.updateUser)
    .delete(userController.deleteUser);

export default router;
