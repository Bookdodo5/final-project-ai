import db from "../config/firebase.js";
import { validate } from "../utils/validators.js";
import { generateId } from "../services/idGenerator.js";
import { 
    NotFoundError, 
    ConflictError
} from "../error/error.js";
import { deleteQuestionsByModuleId } from "./questionController.js";
import { saveModule, generateOutline, generateModuleContent } from "./courseGeneration.js";

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
    const levelOption = validate(req.body, 'levelOption', 'string');
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
        levelOption: levelOption,
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
 * POST /courses/:courseId
 * Purpose: Regenerate course content using AI
 * Path Parameters:
 *  - courseId: string (required)
 *  - userId: string (required)
 * Request Body:
 *  - topicInput: string (required)
 *  - lengthOption: string (required)
 *  - languageOption: string (required)
 *  - levelOption: string (required)
 * 
*/
/** @type {import("express").RequestHandler} */
export const regenerateCourse = async (req, res) => {
    console.log('[DEBUG] Starting course regeneration');
    const courseId = validate(req.params, 'courseId', 'string');
    const userId = validate(req.params, 'userId', 'string');
    
    console.log(`[DEBUG] Regenerating course - User: ${userId}, Course: ${courseId}`);
    
    const userRef = db.collection("users").doc(userId);
    const userData = await userRef.get();
    const courseRef = db.collection("users").doc(userId).collection("courses").doc(courseId);
    const courseData = await courseRef.get();
    const modulesRef = courseRef.collection("modules");

    if (!courseData.exists) {
        console.error(`[ERROR] Course not found - Course ID: ${courseId}`);
        throw new NotFoundError('Course not found');
    }
    if (!userData.exists) {
        console.error(`[ERROR] User not found - User ID: ${userId}`);
        throw new NotFoundError('User not found');
    }

    const {topicInput, lengthOption, languageOption, levelOption} = courseData.data();
    console.log('[DEBUG] Course data loaded:', { topicInput, lengthOption, languageOption, levelOption });

    res.status(202).json({ courseId, message: 'Course generation has started.' });

    (async () => {
        let outline = null;
        try {
            if(courseData.data().modules === undefined || courseData.data().modules.length <= 0) {
                console.log('[DEBUG] Updating course status to: generating outline');
                await courseRef.update({ status: "generating outline", updatedAt: new Date() });

                //GENERATE OUTLINE
                console.log('[DEBUG] Generating course outline...');
                outline = await generateOutline(
                    topicInput,
                    languageOption,
                    lengthOption,
                    levelOption
                );
                console.log('[DEBUG] Course outline generated successfully');
                console.log('[DEBUG] Outline structure:', {
                    courseName: outline.courseName,
                    moduleCount: outline.modules?.length || 0
                });

                console.log('[DEBUG] Creating module documents...');
                const batch = db.batch();
                
                // First, log the modules that will be created
                console.log(`[DEBUG] Creating ${outline.modules?.length} modules`);
                outline.modules.forEach((mod, idx) => {
                    console.log(`[DEBUG] Module ${idx + 1}: ${mod.moduleName}`);
                });
                
                outline.modules = outline.modules.map((module, index) => {
                    const moduleId = generateId("module");
                    const moduleDocRef = modulesRef.doc(moduleId);
                    const moduleData = {
                        moduleId: moduleId,
                        moduleName: module.moduleName,
                        description: module.description,
                        status: "pending",
                        order: index + 1,
                        isCompleted: false,
                        createdAt: new Date(),
                        updatedAt: new Date()
                    };
                    console.log(`[DEBUG] Adding module to batch: ${module.moduleName} (ID: ${moduleId})`);
                    batch.set(moduleDocRef, moduleData);
                    console.log(`[DEBUG] Batch set operation added for module: ${moduleId}`);
                    return { ...module, moduleId: moduleId }
                });

                console.log('[DEBUG] Adding course update to batch');
                batch.update(courseRef, {
                    courseName: outline.courseName,
                    description: outline.description,
                    modules: outline.modules,
                    status: "generating content",
                    updatedAt: new Date()
                });
                
                try {
                    console.log('[DEBUG] Starting batch commit...');
                    const commitResult = await batch.commit();
                    console.log('[DEBUG] Batch commit successful:', commitResult);
                    console.log('[DEBUG] Module documents created successfully');
                } catch (error) {
                    console.error('[ERROR] Batch commit failed:', error);
                    throw new Error(`Failed to commit batch: ${error.message}`);
                }
            }
            else {
                console.log('[DEBUG] Course outline already exists');
                outline = courseData.data();
            }

            let errorCount = 0;
            const totalModules = outline.modules?.length;
            console.log(`[DEBUG] Starting content generation for ${totalModules} modules`);
            
            for(let i = 0; i < outline.modules?.length; i++) {
                const {moduleId, moduleName, description} = outline.modules[i];
                const moduleDocRef = modulesRef.doc(moduleId);
                const moduleDoc = await moduleDocRef.get();
                if(moduleDoc.exists && moduleDoc.data().status == "active") {
                    console.log(`[DEBUG] Module "${moduleName}" already generated`);
                    continue;
                }
                
                console.log(`[DEBUG] Processing module ${i+1}/${totalModules}: ${moduleName} (ID: ${moduleId})`);
                
                try {
                    console.log(`[DEBUG] Updating module status to: generating`);
                    courseRef.update({ status: `generating module ${i+1}/${totalModules}`, updatedAt: new Date() });
                    await moduleDocRef.update({ status: "generating", updatedAt: new Date() });

                    //GENERATE CONTENT
                    console.log(`[DEBUG] Generating content for module: ${moduleName}`);
                    const moduleContent = await generateModuleContent(
                        moduleName,
                        description,
                        topicInput,
                        languageOption,
                        lengthOption,
                        levelOption
                    );
                    console.log(`[DEBUG] Content generated, saving module...`);

                    await saveModule(userId, courseId, moduleId, moduleContent);
                    await moduleDocRef.update({
                        status: "active",
                        updatedAt: new Date()
                    });
                    console.log(`[SUCCESS] Module "${moduleName}" generated and saved successfully.`);
                    
                } catch (error) {
                    errorCount++;
                    console.error("Error in module generation:", error);
                    await moduleDocRef.update({
                        status: "error",
                        error: error.message,
                        updatedAt: new Date()
                    });
                }
            }

            if(errorCount == 0) {
                await courseRef.update({ status: "active", updatedAt: new Date() });
                await userRef.update({
                    moduleCount: userData.data().moduleCount + outline.modules?.length,
                    lastActiveAt: new Date()
                });
                console.log(`Course "${courseId}" generated successfully.`);
            }
            else {
                await courseRef.update({ status: "error", error: "Error in module generation", updatedAt: new Date() });
                console.log(`Course "${courseId}" generation failed.`);
            }

        } catch (error) {
            console.error("Error in course generation:", error);
            await courseRef.update({
                status: "error",
                error: error.message,
                updatedAt: new Date()
            });
        }
    })();
}

/**
 * DELETE /courses/:courseId
 * Purpose: Delete a course and its associated content for the user.
 * Path Parameters:
 *  - courseId: string (required)
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
    const userRef = db.collection("users").doc(userId);
    const courseRef = db.collection("users").doc(userId).collection("courses").doc(courseId);
    const modulesRef = courseRef.collection("modules");

    const courseDoc = await courseRef.get();
    if (!courseDoc.exists) {
        throw new NotFoundError('Course not found');
    }

    const modulesSnap = await modulesRef.get();
    let modulesToRemove = 0;
    let completedToRemove = 0;
    let learnedQuestionsToRemove = 0;
    const batch = db.batch();

    modulesSnap.forEach((doc) => {
        modulesToRemove += 1;
        if (doc.data().isCompleted) completedToRemove += 1;
        const deletedLearnedQuestions = deleteQuestionsByModuleId(userId, doc.id);
        learnedQuestionsToRemove += deletedLearnedQuestions;
        batch.delete(doc.ref);
    });

    if (modulesToRemove > 0) {
        await batch.commit();
    }

    await courseRef.delete();

    const userDoc = await userRef.get();
    if (userDoc.exists) {
        const current = userDoc.data() || {};
        const nextModuleCount = Math.max(0, (current.moduleCount || 0) - modulesToRemove);
        const nextModuleCompleted = Math.max(0, (current.moduleCompleted || 0) - completedToRemove);
        const nextLearnedQuestions = Math.max(0, (current.learnedQuestions || 0) - learnedQuestionsToRemove);
        await userRef.update({
            moduleCount: nextModuleCount,
            moduleCompleted: nextModuleCompleted,
            learnedQuestions: nextLearnedQuestions,
            lastActiveAt: new Date(),
            updatedAt: new Date(),
        });
    }

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

export const updateModule = async (req, res) => {
    const courseId = validate(req.params, 'courseId', 'string');
    const moduleId = validate(req.params, 'moduleId', 'string');
    const userId = validate(req.params, 'userId', 'string');
    const moduleRef = db.collection("users").doc(userId).collection("courses").doc(courseId).collection("modules").doc(moduleId);
    const moduleDoc = await moduleRef.get();
    if (!moduleDoc.exists) {
        throw new NotFoundError('Module not found');
    }
    await moduleRef.update({
        moduleName: req.body.moduleName ?? moduleDoc.data().moduleName,
        description: req.body.description ?? moduleDoc.data().description,
        contentText: req.body.contentText ?? moduleDoc.data().contentText,
        order: req.body.order ?? moduleDoc.data().order,
        isCompleted: req.body.isCompleted ?? moduleDoc.data().isCompleted,
        updatedAt: new Date()
    });
    res.status(200).json({ message: 'Updated' });
};

/**
 * GET /users/:userId/courses/:courseId/modules
 * Purpose: Retrieve all modules for a specific course
 * Path Parameters:
 *  - userId: string (required)
 *  - courseId: string (required)
 * Responses:
 *  - 200: Array<{ moduleId: string, moduleName: string, description?: string, order: number, isCompleted: boolean, createdAt: Date, updatedAt: Date }>
 *  - 400: { error: string }
 *  - 404: { error: 'Course not found' }
 */
/** @type {import("express").RequestHandler} */
export const getModules = async (req, res) => {
    const courseId = validate(req.params, 'courseId', 'string');
    const userId = validate(req.params, 'userId', 'string');

    const modulesRef = db.collection("users").doc(userId).collection("courses").doc(courseId).collection("modules");
    const modules = await modulesRef.orderBy("order", "asc").get();
    
    const modulesData = modules.docs.map((doc) => ({
        id: doc.id,
        ...doc.data()
    }))
    
    res.status(200).json(modulesData);
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