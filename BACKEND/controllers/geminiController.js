import { generate } from "../services/gemini.js";
import { validate } from "../utils/validators.js";
import { systemInstruction, prompt } from "../PROMPT/courseCreation.js";

/** @type {import("express").RequestHandler} */
export const generateCourse = async (req, res) => {
    const text = validate(req.body, 'text', 'string');
    const response = await generate(prompt(text), systemInstruction);
    res.status(200).json({ response });
};