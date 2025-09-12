import express from "express";
import * as pdfController from "../controllers/pdfController.js";
import asyncWrapper from "../middleware/asyncWrapper.js";

const router = express.Router();

router.post("/extract-text", asyncWrapper(pdfController.extractTextFromPdf));

export default router;
