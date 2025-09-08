import express from "express";

import * as geminiController from "../controllers/geminiController.js";

const router = express.Router();

router.post("/call-gemini", geminiController.callGemini);

export default router;
