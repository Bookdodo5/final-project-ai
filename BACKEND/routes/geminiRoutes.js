import express from "express";
import * as geminiController from "../controllers/geminiController.js";
import asyncWrapper from "../middleware/asyncWrapper.js";

const router = express.Router();

router.post("/generate-course", asyncWrapper(geminiController.generateCourse));

export default router;
