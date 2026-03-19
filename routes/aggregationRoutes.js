import express from "express";
import * as reportController from "../controllers/reportController.js";

const router = express.Router();

router.get("/:reportName", reportController.getReport);

export default router;
