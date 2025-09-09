import express from "express";
import * as courseController from "../controllers/courseController.js";
import asyncWrapper from "../middleware/asyncWrapper.js";

const router = express.Router({ mergeParams: true });

router.get("/", asyncWrapper(courseController.getCourses));
router.post("/", asyncWrapper(courseController.createCourse));
router.post("/:courseId", asyncWrapper(courseController.regenerateCourse));
router.delete("/:courseId", asyncWrapper(courseController.deleteCourse));
router.get("/:courseId", asyncWrapper(courseController.getCourse));
router.put("/:courseId", asyncWrapper(courseController.updateCourse));
router.get("/:courseId/modules/:moduleId", asyncWrapper(courseController.getModule));

export default router;
