import express from "express";

import * as courseController from "../controllers/courseController.js";

const router = express.Router();

router.get("/", courseController.getCourses);
router.post("/", courseController.createCourse);
router.delete("/:courseId", courseController.deleteCourse);
router.get("/:courseId", courseController.getCourse);
router.put("/:courseId", courseController.updateCourse);
router.get("/:courseId/modules/:moduleId", courseController.getModule);
router.get("/:courseId/progress", courseController.getProgress);

export default router;
