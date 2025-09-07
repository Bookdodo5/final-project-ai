import express from "express";

import * as geminiController from "../controllers/geminiController.js";

const router = express.Router();

router.post("/generate", geminiController.generate);

export default router;
