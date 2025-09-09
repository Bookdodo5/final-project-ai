import db from "../config/firebase.js";
import { validate } from "../utils/validators.js";
import { generateId } from "../services/idGenerator.js";
import { 
    NotFoundError, 
    BadRequestError, 
    RateLimitError, 
    InternalServerError, 
    ValidationError,
    ConflictError
} from "../error/error.js";
import { generate } from "../services/gemini.js";
import { systemInstruction, prompt } from "../PROMPT/courseCreation.js";

/**
 * GET /courses
 * Purpose: List all courses for the given user.
 * Path Parameters:
 *  - userId: string (required)
 * Responses:
 *  - 200: Array<{ courseId: string, courseName: string, description?: string, overallProgress?: number }>
 *  - 400: { error: string }
 */
/** @type {import("express").RequestHandler} */
export const getCourses = async (req, res) => {
    const userId = validate(req.params, 'userId', 'string');
    const courseRef = db.collection("users").doc(userId).collection("courses");
    const courses = await courseRef.get()
    const coursesData = courses.docs.map((doc) => ({
        id: doc.id,
        ...doc.data()
    }))
    res.status(200).json(coursesData)
};

/**
 * GET /courses/:courseId
 * Purpose: Retrieve detailed course info, including modules and lessons with completion status.
 * Path Parameters:
 *  - courseId: string (required)
 *  - userId: string (required)
 * Responses:
 *  - 200: { courseId: string, courseName: string, description?: string, modules: Array<{ moduleId: string, lessons: Array<{ lessonId: string, name: string, description?: string, isCompleted?: boolean }> }> }
 *  - 400: { error: string }
 *  - 404: { error: 'Course not found' }
 */
/** @type {import("express").RequestHandler} */
export const getCourse = async (req, res) => {
    const courseId = validate(req.params, 'courseId', 'string');
    const userId = validate(req.params, 'userId', 'string');
    const courseRef = db.collection("users").doc(userId).collection("courses").doc(courseId);
    const course = await courseRef.get()
    const courseData = { id: course.id, ...course.data() }
    res.status(200).json(courseData)
};

async function saveModules(userId, courseId, modules) {
    const batch = db.batch();
    const modulesRef = db.collection("users").doc(userId).collection("courses").doc(courseId).collection("modules");
    
    modules.forEach((module, index) => {
        const moduleId = generateId("module");
        const moduleRef = modulesRef.doc(moduleId);
        batch.set(moduleRef, {
            moduleName: module.moduleName,
            description: module.description,
            contentText: module.contentText || "",
            order: index + 1,
            isCompleted: false,
            createdAt: new Date(),
            updatedAt: new Date()
        });
    });
    
    await batch.commit();
}

async function generateCourseContent(topic, language, length) {
    try {
        const response = await generate(
            prompt(topic, language, length), 
            systemInstruction,
            {
                temperature: 0.7,
                topP: 0.9,
                model: "gemini-2.5-flash"
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

/**
 * POST /courses
 * Purpose: Create a new course from topic input and generate course content using AI
 * Path Parameters:
 *  - userId: string (required)
 * Request Body:
 *  - topicInput: string (required)
 *  - lengthOption: string (required)
 *  - languageOption: string (required)
 * Responses:
 *  - 201: { courseId: string, status: 'generating' }
 *  - 400: { error: string }
 */
/** @type {import("express").RequestHandler} */
export const createCourse = async (req, res) => {
    const userId = validate(req.params, 'userId', 'string');
    const languageOption = validate(req.body, 'languageOption', 'string');
    const lengthOption = validate(req.body, 'lengthOption', 'string');
    const topicInput = validate(req.body, 'topicInput', 'string');
    
    const newCourseId = generateId("course");
    const courseRef = db.collection("users").doc(userId).collection("courses").doc(newCourseId);
    const course = await courseRef.get();

    if(course.exists) {
        throw new ConflictError("Course already exists");
    }

    await courseRef.set({
        status: "generating",
        courseName: `New Course: ${topicInput}`,
        description: "Course is being generated...",
        createdAt: new Date(),
        lastAccessed: new Date(),
        updatedAt: new Date(),
        languageOption: languageOption,
        lengthOption: lengthOption,
        progress: 0,
        topicInput: topicInput,
    });
    
    const regenerateReq = {
        ...req, params: {
            ...req.params,
            courseId: newCourseId
        }
    };
    regenerateCourse(regenerateReq, res);
};

/**
 * 
 * 
*/
/** @type {import("express").RequestHandler} */
export const regenerateCourse = async (req, res) => {
    const courseId = validate(req.params, 'courseId', 'string');
    const userId = validate(req.params, 'userId', 'string');
    const courseRef = db.collection("users").doc(userId).collection("courses").doc(courseId);
    const courseData = await courseRef.get();
    if (!courseData.exists) {
        throw new NotFoundError('Course not found');
    }

    await courseRef.update({
        status: "generating",
        updatedAt: new Date(),
    });

    (async () => {
        try {
            const courseContent = await generateCourseContent(
                courseData.data().topicInput,
                courseData.data().languageOption,
                courseData.data().lengthOption
            );
            await saveModules(userId, courseId, courseContent.modules);
            
            await courseRef.update({
                status: "active",
                courseName: courseContent.courseName,
                description: courseContent.description,
                updatedAt: new Date()
            });
        } catch (error) {
            console.error("Error in course generation:", error);
            await courseRef.update({
                status: "error",
                error: error.message,
                updatedAt: new Date()
            });
        }
    })();
    
    res.status(200).json({ courseId, message: 'Course generated' });
}

/**
 * DELETE /courses/:courseId
 * Purpose: Delete a course and its associated content for the user.
 * Path Parameters:
 *  - courseId: string (required)
 * Query Parameters:
 *  - userId: string (required)
 * Responses:
 *  - 200: { message: 'Deleted' }
 *  - 400: { error: string }
 *  - 404: { error: 'Course not found' }
 */
/** @type {import("express").RequestHandler} */
export const deleteCourse = async (req, res) => {
    const courseId = validate(req.params, 'courseId', 'string');
    const userId = validate(req.params, 'userId', 'string');
    const courseRef = db.collection("users").doc(userId).collection("courses").doc(courseId);
    const courseDoc = await courseRef.get();
    if (!courseDoc.exists) {
        throw new NotFoundError('Course not found');
    }
    await courseRef.delete();
    res.status(200).json({ message: 'Deleted' });
};

/**
 * PUT /courses/:courseId
 * Purpose: Update course details or settings.
 * Path Parameters:
 *  - courseId: string (required)
 * Request Body:
 *  - courseName?: string
 *  - description?: string
 *  - lengthOption?: string
 *  - depthOption?: string
 *  - languageOption?: string
 * Responses:
 *  - 200: { message: 'Updated' }
 *  - 400: { error: string }
 *  - 404: { error: 'Course not found' }
 */
/** @type {import("express").RequestHandler} */
export const updateCourse = async (req, res) => {
    const courseId = validate(req.params, 'courseId', 'string');
    const userId = validate(req.params, 'userId', 'string');
    const courseRef = db.collection("users").doc(userId).collection("courses").doc(courseId);
    const courseDoc = await courseRef.get();
    if (!courseDoc.exists) {
        throw new NotFoundError('Course not found');
    }
    await courseRef.update({
        courseName: req.body.courseName ?? courseDoc.data().courseName,
        description: req.body.description ?? courseDoc.data().description,
        lengthOption: req.body.lengthOption ?? courseDoc.data().lengthOption,
        languageOption: req.body.languageOption ?? courseDoc.data().languageOption,
        progress: req.body.progress ?? courseDoc.data().progress,
        status: req.body.status ?? courseDoc.data().status,
        updatedAt: new Date()
    })
    res.status(200).json({ message: 'Updated' });
};

/**
 * GET /courses/:courseId/modules/:moduleId
 * Purpose: Retrieve module details, including list of lessons and per-lesson completion.
 * Path Parameters:
 *  - courseId: string (required)
 *  - moduleId: string (required)
 * Query Parameters:
 *  - userId: string (required)
 * Responses:
 *  - 200: { moduleId: string, name?: string, lessons: Array<{ lessonId: string, name: string, isCompleted?: boolean }> }
 *  - 400: { error: string }
 *  - 404: { error: 'Module not found' }
 */
/** @type {import("express").RequestHandler} */
export const getModule = async (req, res) => {
    const courseId = validate(req.params, 'courseId', 'string');
    const moduleId = validate(req.params, 'moduleId', 'string');
    const userId = validate(req.params, 'userId', 'string');
    const moduleRef = db.collection("users").doc(userId).collection("courses").doc(courseId).collection("modules").doc(moduleId);
    const moduleDoc = await moduleRef.get()
    if(!moduleDoc.exists) {
        throw new NotFoundError('Module not found');
    }
    const moduleData = { id: moduleDoc.id, ...moduleDoc.data() }
    res.status(200).json(moduleData)
};