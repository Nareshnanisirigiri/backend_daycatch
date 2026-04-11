import * as factory from "./handlerFactory.js";

const MODEL = "city";

export const getAllCities = factory.getAll(MODEL);
export const getCity = factory.getOne(MODEL);
export const createCity = factory.createOne(MODEL);
export const updateCity = factory.updateOne(MODEL);
export const deleteCity = factory.deleteOne(MODEL);
