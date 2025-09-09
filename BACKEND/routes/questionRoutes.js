import express from "express";
import asyncWrapper from "../middleware/asyncWrapper.js";
import * as questionController from "../controllers/questionController.js";

const router = express.Router();

router.get("/:questionId", asyncWrapper(questionController.getQuestionById));
router.get("/:courseId/:moduleId", asyncWrapper(questionController.getQuestionsByModuleId));
router.post("/:questionId/submit", asyncWrapper(questionController.submitAnswer));
router.post("/:questionId/rate", asyncWrapper(questionController.rateQuestion));
router.get("/due-questions", asyncWrapper(questionController.getDueQuestions));

export default router;
