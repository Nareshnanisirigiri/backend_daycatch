import { Orders } from "../models/index.js";
import * as factory from "./handlerFactory.js";

export const getAllOrders = factory.getAll(Orders);
export const getOrder = factory.getOne(Orders);
export const createOrder = factory.createOne(Orders);
export const updateOrder = factory.updateOne(Orders);
export const deleteOrder = factory.deleteOne(Orders);

// Add custom order logic here (e.g., status transitions)
