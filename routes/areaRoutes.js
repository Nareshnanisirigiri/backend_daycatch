import express from "express";
import * as areaController from "../controllers/areaController.js";

const router = express.Router();

router
    .route("/")
    .get(areaController.getAllAreas)
    .post(areaController.createArea);

router
    .route("/:id")
    .get(areaController.getArea)
    .patch(areaController.updateArea)
    .delete(areaController.deleteArea);

export default router;
