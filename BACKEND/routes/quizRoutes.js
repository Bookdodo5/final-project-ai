import express from "express";

import * as quizController from "../controllers/quizController.js";

const router = express.Router();

router.get("/:quizId", quizController.getQuiz);
router.post("/", quizController.createQuiz);
router.get("/:quizId/questions/:questionId", quizController.getQuestion);
router.post("/:quizId/questions/:questionId/submit", quizController.submitAnswer);

export default router;
