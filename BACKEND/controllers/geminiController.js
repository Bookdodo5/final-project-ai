import { generate } from "../services/gemini.js";

/** @type {import("express").RequestHandler} */
export const callGemini = async (req, res) => {
    res.status(501).send("Unimplemented");
};
