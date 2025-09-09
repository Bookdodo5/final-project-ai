import { generate } from "../services/gemini.js";
import { validate } from "../utils/validators.js";

/** 
 * Call Gemini AI with the provided prompt and options
 * @type {import("express").RequestHandler} 
 */
export const callGemini = async (req, res) => {
    try {
        const prompt = validate(req.body, 'prompt', 'string');
        const systemInstruction = validate(req.body, 'systemInstruction', 'string');
        
        const options = {};
        
        if (typeof req.body.temperature === 'number') {
            options.temperature = Math.min(Math.max(req.body.temperature, 0), 2);
        }
        
        if (typeof req.body.topP === 'number') {
            options.topP = Math.min(Math.max(req.body.topP, 0), 1);
        }
        
        if (req.body.model) {
            options.model = String(req.body.model);
        }
        
        const response = await generate(prompt, systemInstruction, options);
        
        res.status(200).json({ response });
    } catch (error) {
        console.error("Error in callGemini:", error);
        res.status(500).json({ 
            error: error.message || 'An error occurred while processing your request' 
        });
    }
};