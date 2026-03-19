import { StoreList } from "../models/index.js";
import * as factory from "./handlerFactory.js";

export const getAllStores = factory.getAll(StoreList);
export const getStore = factory.getOne(StoreList);
export const createStore = factory.createOne(StoreList);
export const updateStore = factory.updateOne(StoreList);
export const deleteStore = factory.deleteOne(StoreList);
