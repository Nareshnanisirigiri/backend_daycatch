import * as factory from "./handlerFactory.js";

const MODEL = "delivery_boy";

export const getAllDeliveryBoys = factory.getAll(MODEL);
export const getDeliveryBoy = factory.getOne(MODEL);
export const createDeliveryBoy = factory.createOne(MODEL);
export const updateDeliveryBoy = factory.updateOne(MODEL);
export const deleteDeliveryBoy = factory.deleteOne(MODEL);
