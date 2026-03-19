import express from "express";
import * as cityController from "../controllers/cityController.js";

const router = express.Router();

router
    .route("/")
    .get(cityController.getAllCities)
    .post(cityController.createCity);

router
    .route("/:id")
    .get(cityController.getCity)
    .patch(cityController.updateCity)
    .delete(cityController.deleteCity);

export default router;
