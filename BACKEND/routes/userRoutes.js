import express from "express";
import * as userController from "../controllers/userController.js";
import asyncWrapper from "../middleware/asyncWrapper.js";

const router = express.Router();

router.get("/:userId", asyncWrapper(userController.getUser));
router.post("/", asyncWrapper(userController.createUser));
router.delete("/:userId", asyncWrapper(userController.deleteUser));

export default router;
