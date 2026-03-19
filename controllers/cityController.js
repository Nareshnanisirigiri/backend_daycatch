import { Cities } from "../models/index.js";
import * as factory from "./handlerFactory.js";

export const getAllCities = factory.getAll(Cities);
export const getCity = factory.getOne(Cities);
export const createCity = factory.createOne(Cities);
export const updateCity = factory.updateOne(Cities);
export const deleteCity = factory.deleteOne(Cities);
