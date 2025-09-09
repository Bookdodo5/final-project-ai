import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Helper function to safely parse JSON with better error handling
function safeJsonParse(jsonString) {
    try {
        // First try direct parse
        return JSON.parse(jsonString);
    } catch (e) {
        // If direct parse fails, try to clean and parse again
        try {
            // Remove any non-printable characters except newlines and tabs
            let cleaned = jsonString
                .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, '')
                // Fix unescaped quotes inside strings
                .replace(/([^\\])\\([^\\"'bfnrtu])/g, '$1\\\\$2')
                // Fix unescaped control characters
                .replace(/[\b\f\n\r\t]/g, '\\$&');
                
            // Try to find the actual JSON part if there's markdown formatting
            const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                cleaned = jsonMatch[0];
            }
            
            return JSON.parse(cleaned);
        } catch (e2) {
            console.error("Failed to parse JSON after cleaning:", e2);
            console.error("Problematic JSON string:", jsonString);
            throw new Error(`Failed to parse JSON response: ${e2.message}`);
        }
    }
}

/**
 * Generate content using Gemini AI
 * @param {string} prompt - The user's prompt
 * @param {string} systemInstruction - System instructions for the AI
 * @param {Object} [options] - Configuration options
 * @param {number} [options.temperature=0.7] - Controls randomness (0-1)
 * @param {number} [options.topP=0.9] - Controls diversity (0-1)
 * @param {string} [options.model="gemini-2.5-flash-lite"] - Model to use
 */
export async function generate(prompt, systemInstruction, options = {}) {
    try {
        const {
            temperature = 0.7,
            topP = 0.9,
            model = "gemini-2.5-flash-lite"
        } = options;
        
        const response = await ai.models.generateContent({
            model,
            contents: prompt,
            systemInstruction,
            generationConfig: {
                temperature: Math.min(Math.max(temperature, 0), 2),
                topP: Math.min(Math.max(topP, 0), 1),
            },
        });
        
        let responseText = response.text;        

        responseText = responseText.trim();
        
        // Handle JSON code blocks
        if (responseText.includes('```')) {
            // Try to extract content between ```json and ```
            let jsonMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
            if (jsonMatch && jsonMatch[1]) {
                responseText = jsonMatch[1].trim();
            } else {
                // If there are backticks but no json marker, try to extract content between them
                const backtickMatch = responseText.match(/```([\s\S]*?)```/);
                if (backtickMatch && backtickMatch[1]) {
                    responseText = backtickMatch[1].trim();
                }
            }
        }
        
        // If the response still looks like it has markdown formatting, try to extract JSON
        if (responseText.startsWith('{') === false) {
            const jsonMatch = responseText.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                responseText = jsonMatch[0];
            }
        }
        
        return safeJsonParse(responseText);
        
    } catch (error) {
        console.error("Error in generate function:", error);
        if (error.response) {
            console.error("API response error:", error.response.status, error.response.data);
            throw new Error(`AI service error: ${error.response.status} - ${JSON.stringify(error.response.data)}`);
        }
        throw new Error(`Failed to generate content: ${error.message}`);
    }
}