import db from "../config/firebase.js";
import { generateId } from "../services/idGenerator.js";
import { generate } from "../services/gemini.js";
import { 
    BadRequestError, 
    RateLimitError, 
    InternalServerError, 
} from "../error/error.js";
import { systemInstruction as systemOutline, prompt as promptOutline } from "../PROMPT/courseOutline.js";
import { systemInstruction as systemContent, prompt as promptContent } from "../PROMPT/moduleContent.js";

export const saveModule = async (userId, courseId, moduleId, moduleContent) => {
    try {
        console.log('[DEBUG] Starting to save module:', { userId, courseId, moduleId });
        console.log('[DEBUG] Module content type:', typeof moduleContent);
        console.log('[DEBUG] Module content keys:', Object.keys(moduleContent));
        
        const moduleRef = db.collection("users").doc(userId).collection("courses").doc(courseId).collection("modules").doc(moduleId);
        const questionsRef = db.collection("users").doc(userId).collection("questions");

        // First check if the document exists
        const doc = await moduleRef.get();
        if (!doc.exists) {
            throw new Error(`Module ${moduleId} does not exist in course ${courseId}`);
        }

        const batch = db.batch();
        
        const moduleData = {
            contentText: moduleContent.contentText || "No content available",
            updatedAt: new Date()
        };
        
        console.log('[DEBUG] Saving module data:', JSON.stringify(moduleData, null, 2));
        
        // Use set with merge instead of update to handle both create and update
        batch.set(moduleRef, moduleData, { merge: true });

        console.log('[DEBUG] Processing module quiz. Question count:', moduleContent.moduleQuiz?.length || 0);
        (moduleContent.moduleQuiz || []).forEach((question, index) => {
            const questionId = generateId("question");
            const questionRef = questionsRef.doc(questionId);
            batch.set(questionRef, {
                questionText: question.questionText,
                type: question.type,
                options: question.options || [],
                correctAnswer: question.correctAnswer,
                questionOrder: index + 1,
                star: question.star || 1,
                createdAt: new Date(),
                updatedAt: new Date(),
                moduleId: moduleId
            });
        });
        
        console.log('[DEBUG] Committing batch operation');
        await batch.commit();
        console.log('[DEBUG] Module saved successfully');
        return { success: true };
    } catch (error) {
        console.error('Error in saveModule:', error);
        throw error; // Re-throw to be handled by the caller
    }
}

export const generateOutline = async (topic, language, length, level) => {
    try {
        const response = await generate(
            promptOutline(topic, language, length, level), 
            systemOutline(topic),
            {
                temperature: 0.7,
                topP: 0.9,
                model: "gemini-2.5-flash",
                config: {
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: "object",
                        properties: {
                            courseName: {
                                type: "string",
                                description: "Course title that is short and clearly conveys the topic"
                            },
                            description: {
                                type: "string",
                                description: "Brief 1-2 sentence course description"
                            },
                            modules: {
                                type: "array",
                                items: {
                                    type: "object",
                                    properties: {
                                        moduleName: {
                                            type: "string",
                                            description: "Clear and concise module title"
                                        },
                                        description: {
                                            type: "string",
                                            description: "2-4 sentence module description that describe everything the module should cover. This will be used for module content generation, so it should be detailed and clear."
                                        }
                                    },
                                    required: ["moduleName", "description"]
                                },
                                minItems: 1,
                                description: "Number of modules based on course length"
                            }
                        },
                        required: ["courseName", "description", "modules"]
                    }
                }
            }
        );

        return response;
    } catch (error) {
        console.error("Error generating course content:", error);
        
        if (error.statusCode === 429) {
            throw new RateLimitError("Rate limit exceeded. Please try again later.");
        } else if (error.statusCode >= 500) {
            throw new InternalServerError("AI service is currently unavailable. Please try again later.");
        } else if (error.statusCode >= 400) {
            throw new BadRequestError("Invalid request to AI service");
        }
        throw new InternalServerError("Failed to generate course content");
    }
}

export const generateModuleContent = async (name, description, topic, language, length, level) => {
    try {
        const response = await generate(
            promptContent(name, description, topic, language, length, level), 
            systemContent(topic),
            {
                temperature: 0.7,
                topP: 0.9,
                model: "gemini-2.5-flash",
                config: {
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: "object",
                        properties: {
                            contentText: {
                                type: "string",
                                description: "HTML content for the module with Tailwind CSS classes"
                            },
                            moduleQuiz: {
                                type: "array",
                                items: {
                                    type: "object",
                                    properties: {
                                        questionText: { 
                                            type: "string",
                                            description: "The question text"
                                        },
                                        type: { 
                                            type: "string",
                                            enum: ["mcq", "open-ended", "true-false"],
                                            description: "Type of question"
                                        },
                                        options: {
                                            type: "array",
                                            items: { 
                                                type: "string" 
                                            },
                                            description: "Array of options (for MCQ and true-false only). In case of true-false, the choices are either 'True' or 'False' regardless of the language of the question content."
                                        },
                                        correctAnswer: { 
                                            type: "string",
                                            description: "Correct answer or expected answer guidance. In case of true-false, the answer is either 'True' or 'False' regardless of the language of the question content."
                                        },
                                        star: {
                                            type: "integer",
                                            minimum: 1,
                                            maximum: 5,
                                            description: "Difficulty rating (1=easiest, 5=hardest)"
                                        }
                                    },
                                    required: ["questionText", "type", "correctAnswer", "star"]
                                },
                                minItems: 3,
                                maxItems: 9,
                                description: "3-9 questions per module"
                            }
                        },
                        required: ["contentText", "moduleQuiz"]
                    }
                }
            }
        );

        return response;
    } catch (error) {
        console.error("Error generating module content:", error);
        
        if (error.statusCode === 429) {
            throw new RateLimitError("Rate limit exceeded. Please try again later.");
        } else if (error.statusCode >= 500) {
            throw new InternalServerError("AI service is currently unavailable. Please try again later.");
        } else if (error.statusCode >= 400) {
            throw new BadRequestError("Invalid request to AI service");
        }
        throw new InternalServerError("Failed to generate module content");
    }
}