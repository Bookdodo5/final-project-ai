import express from "express";
import asyncWrapper from "../middleware/asyncWrapper.js";
import * as questionController from "../controllers/questionController.js";

const router = express.Router({ mergeParams: true });

router.get("/due-questions", asyncWrapper(questionController.getDueQuestions));
router.get("/:courseId/:moduleId", asyncWrapper(questionController.getQuestionsByModuleId));
router.get("/:questionId", asyncWrapper(questionController.getQuestionById));
router.post("/:questionId/submit", asyncWrapper(questionController.submitAnswer));
router.put("/:questionId/rate", asyncWrapper(questionController.rateQuestion));
router.put("/:questionId/learn", asyncWrapper(questionController.markQuestionAsLearned));

export default router;