import { DeliveryBoy } from "../models/index.js";
import * as factory from "./handlerFactory.js";

export const getAllDeliveryBoys = factory.getAll(DeliveryBoy);
export const getDeliveryBoy = factory.getOne(DeliveryBoy);
export const createDeliveryBoy = factory.createOne(DeliveryBoy);
export const updateDeliveryBoy = factory.updateOne(DeliveryBoy);
export const deleteDeliveryBoy = factory.deleteOne(DeliveryBoy);
