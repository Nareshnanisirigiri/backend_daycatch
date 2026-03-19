import { AdminProducts } from "../models/index.js";
import * as factory from "./handlerFactory.js";

export const getAllProducts = factory.getAll(AdminProducts);
export const getProduct = factory.getOne(AdminProducts);
export const createProduct = factory.createOne(AdminProducts);
export const updateProduct = factory.updateOne(AdminProducts);
export const deleteProduct = factory.deleteOne(AdminProducts);

// Add custom product logic here (e.g., stock management)
