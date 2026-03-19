import { Users } from "../models/index.js";
import * as factory from "./handlerFactory.js";

export const getAllUsers = factory.getAll(Users);
export const getUser = factory.getOne(Users);
export const createUser = factory.createOne(Users);
export const updateUser = factory.updateOne(Users);
export const deleteUser = factory.deleteOne(Users);

// Add custom user logic here if needed
