import { Area } from "../models/index.js";
import * as factory from "./handlerFactory.js";

export const getAllAreas = factory.getAll(Area);
export const getArea = factory.getOne(Area);
export const createArea = factory.createOne(Area);
export const updateArea = factory.updateOne(Area);
export const deleteArea = factory.deleteOne(Area);
