import express from "express";
import * as contentController from "../controllers/contentController.js";

const router = express.Router();

router.get("/about", contentController.getAboutUs);
router.get("/terms", contentController.getTerms);

export default router;
