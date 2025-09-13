import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Helper function to safely parse JSON with better error handling and debugging
function safeJsonParse(jsonString) {
    try {
        const parsed = JSON.parse(jsonString);
        if(parsed) return parsed;
    } catch (error) {
        console.error('[safeJsonParse] Error parsing JSON:', error);
    }
    console.log('[safeJsonParse] Starting to parse JSON...');

    try {
        let clean = String(jsonString || '');
        clean = clean.replace(/```json\s*|```/g, '');
        const first = clean.indexOf('{');
        const last = clean.lastIndexOf('}');
        if (first !== -1 && last !== -1 && first < last) {
            clean = clean.substring(first, last + 1);
        }
        clean = clean.replace(/\\(?!["\\\/bfnrtu])/g, '\\\\');
        const parsed = JSON.parse(clean);
        if(parsed) return parsed;
    } catch (error) {
        console.error('[safeJsonParse] Error parsing JSON:', error);
    }
    
    if (!jsonString || typeof jsonString !== 'string') {
        console.error('[safeJsonParse] Input is not a string or is empty');
    }

    console.log('[safeJsonParse] Input string length:', jsonString.length);
    
    // Remove any Byte Order Mark (BOM) if present
    let cleaned = jsonString.charCodeAt(0) === 0xFEFF 
        ? jsonString.slice(1) 
        : jsonString;
    
    if (cleaned !== jsonString) {
        console.log('[safeJsonParse] Removed BOM character');
    }

    // Try to extract JSON from markdown code blocks first
    const codeBlockMatch = cleaned.match(/```(?:json\n)?([\s\S]*?)```/);
    if (codeBlockMatch && codeBlockMatch[1]) {
        console.log('[safeJsonParse] Extracted JSON from markdown code block');
        cleaned = codeBlockMatch[1].trim();
    }

    // Look for the first { and last } to extract potential JSON
    const firstBrace = cleaned.indexOf('{');
    const lastBrace = cleaned.lastIndexOf('}');
    
    if (firstBrace !== -1 && lastBrace !== -1 && firstBrace < lastBrace) {
        console.log('[safeJsonParse] Extracted JSON content between braces');
        cleaned = cleaned.substring(firstBrace, lastBrace + 1).trim();
    }

    console.log('[safeJsonParse] After initial cleaning, string length:', cleaned.length);
    
    // Clean common JSON issues
    const originalCleaned = cleaned;
    cleaned = cleaned
        // Escape backslashes in code blocks first
        .replace(/```([\s\S]*?)```/g, match => 
            match.replace(/\\/g, '\\\\')
                 .replace(/\n/g, '\\n')
                 .replace(/\t/g, '\\t')
                 .replace(/\r/g, '\\r')
                 .replace(/\f/g, '\\f')
        )
        // Remove any trailing commas before ] or }
        .replace(/,\s*([}\]])/g, '$1')
        // Fix unescaped quotes in strings
        .replace(/([^\\])\\("|')/g, '$1$2')
        // Fix single quotes to double quotes for property names
        .replace(/([\{\s,])(\w+)\s*:/g, '$1"$2":')
        // Fix single quotes to double quotes for string values
        .replace(/:\s*'([^']*)'/g, ':"$1"')
        // Remove comments (not valid in JSON but sometimes present)
        .replace(/\/\*[\s\S]*?\*\/|([^\\:]\/\/.*|^\s*\/\/.*)/g, '');
    
    if (cleaned !== originalCleaned) {
        console.log('[safeJsonParse] Applied cleaning transformations');
    }

    console.log('[safeJsonParse] Attempting to parse JSON...');
    
    try {
        const result = JSON.parse(cleaned);
        console.log('[safeJsonParse] Successfully parsed JSON');
        return result;
    } catch (error) {
        console.error('[safeJsonParse] First parse attempt failed:', error.message);
        console.error('[safeJsonParse] First 200 chars of cleaned string:', cleaned.substring(0, 200));
        
        // Try to find where it went wrong
        try {
            console.log('[safeJsonParse] Trying to fix and parse again...');
            // Try to parse with a JSON reviver to find the exact position of the error
            JSON.parse(cleaned, (key, value) => {
                if (typeof value === 'string') {
                    // Check for common string issues
                    if (value.includes('\n')) {
                        return value.replace(/\n/g, '\\n');
                    }
                }
                return value;
            });
            // If we get here, the reviver fixed the issue
            console.log('[safeJsonParse] Successfully parsed with reviver');
            return JSON.parse(cleaned);
        } catch (e) {
            // Create a more helpful error message
            const errorPosition = e.message.match(/position\s+(\d+)/);
            const errorPositionNum = errorPosition ? parseInt(errorPosition[1], 10) : 0;
            const contextStart = Math.max(0, errorPositionNum - 50);
            const contextEnd = Math.min(cleaned.length, errorPositionNum + 50);
            const errorContext = cleaned.substring(contextStart, contextEnd);
            
            console.error('[safeJsonParse] Final parse error:', e.message);
            console.error(`[safeJsonParse] Error position: ${errorPositionNum}`);
            console.error('[safeJsonParse] Error context:', errorContext);
            
            // Try to find the problematic line
            const lines = cleaned.split('\n');
            let lineNumber = 1;
            let charCount = 0;
            for (const line of lines) {
                charCount += line.length + 1; // +1 for the newline
                if (charCount >= errorPositionNum) break;
                lineNumber++;
            }
            
            console.error(`[safeJsonParse] Error is around line ${lineNumber}`);
            console.error('[safeJsonParse] Problematic line:', lines[lineNumber - 1]);
            
            throw new Error(`Failed to parse JSON at position ${errorPositionNum} (around line ${lineNumber}): ${e.message}\n` +
                          `Context: ${errorContext}`);
        }
    }
}

/**
 * Generate content using Gemini AI with exponential backoff retry
 * @param {string} prompt - The user's prompt
 * @param {string} systemInstruction - System instructions for the AI
 * @param {Object} [options] - Configuration options
 * @param {number} [options.temperature=0.7] - Controls randomness (0-1)
 * @param {number} [options.topP=0.9] - Controls diversity (0-1)
 * @param {string} [options.model="gemini-2.5-flash-lite"] - Model to use
 * @param {number} [options.maxRetries=3] - Maximum number of retry attempts
 * @param {number} [options.initialDelay=1000] - Initial delay in ms before first retry
 */
export async function generate(prompt, systemInstruction, options = {}) {
    const {
        temperature = 0.7,
        topP = 0.9,
        model = "gemini-2.5-flash-lite",
        config = undefined,
        maxRetries = 3,
        initialDelay = 1000
    } = options;

    let attempt = 0;
    let currentDelay = initialDelay;
    let lastError = null;

    while (attempt <= maxRetries) {
        try {
            const response = await ai.models.generateContent({
                model,
                contents: prompt,
                systemInstruction,
                generationConfig: {
                    temperature: Math.min(Math.max(temperature, 0), 2),
                    topP: Math.min(Math.max(topP, 0), 1),
                },
                config: config
            });

            let responseText = response.text || '';
            responseText = responseText.trim();

            if (!responseText) {
                throw new Error('Empty response from AI service');
            }

            return safeJsonParse(responseText);

        } catch (error) {
            lastError = error;
            const isRetryable = isErrorRetryable(error);
            
            if (!isRetryable || attempt >= maxRetries) {
                break;
            }

            console.warn(`Attempt ${attempt + 1} failed (${error.message}). Retrying in ${currentDelay}ms...`);
            await new Promise(resolve => setTimeout(resolve, currentDelay));
            
            // Exponential backoff with jitter
            currentDelay = Math.min(currentDelay * 2 + Math.random() * 1000, 30000);
            attempt++;
        }
    }

    // If we get here, all retries failed
    console.error(`All ${maxRetries} retry attempts failed. Last error:`, lastError);
    
    if (lastError.response) {
        console.error("API response error:", lastError.response.status, lastError.response.data);
        throw new Error(`AI service error after ${maxRetries} retries: ${lastError.response.status} - ${JSON.stringify(lastError.response.data)}`);
    }
    
    throw new Error(`Failed to generate content after ${maxRetries} retries: ${lastError.message}`);
}

/**
 * Check if an error is retryable
 * @param {Error} error - The error to check
 * @returns {boolean} True if the error is retryable
 */
function isErrorRetryable(error) {
    // 503 Service Unavailable
    if (error.response?.status === 503) {
        return true;
    }
    
    // Network errors
    if (error.code === 'ECONNRESET' || 
        error.code === 'ETIMEDOUT' || 
        error.code === 'ENOTFOUND' ||
        error.code === 'ECONNREFUSED') {
        return true;
    }
    
    // Rate limiting
    if (error.response?.status === 429) {
        return true;
    }
    
    // Empty response or parsing errors might be transient
    if (error.message.includes('Empty response') || 
        error.message.includes('Unexpected token') ||
        error.message.includes('JSON')) {
        return true;
    }
    
    return false;
}