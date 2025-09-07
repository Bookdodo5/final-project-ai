import express from "express";

import * as srsController from "../controllers/srsController.js";

const router = express.Router();

router.get("/due-questions", srsController.getDueQuestions);

export default router;
