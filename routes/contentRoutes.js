import express from "express";
import * as contentController from "../controllers/contentController.js";

const router = express.Router();

router.get("/about", contentController.getAboutUs);
router.patch("/about", contentController.updateAboutUs);

router.get("/terms", contentController.getTerms);
router.patch("/terms", contentController.updateTerms);

export default router;
