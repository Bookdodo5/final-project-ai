import { generate } from "../services/gemini.js";

/** @type {import("express").RequestHandler} */
export const generate = async (req, res) => {
    res.status(501).send("Unimplemented");
};
