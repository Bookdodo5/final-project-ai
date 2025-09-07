/**
 * GET /courses
 * Purpose: List all courses for the given user.
 * Query Parameters:
 *  - userId: string (required)
 * Responses:
 *  - 200: Array<{ courseId: string, courseName: string, description?: string, overallProgress?: number }>
 *  - 400: { error: string }
 */
/** @type {import("express").RequestHandler} */
export const getCourses = async (req, res) => {
    res.status(501).send("Unimplemented");
};

/**
 * GET /courses/:courseId
 * Purpose: Retrieve detailed course info, including modules and lessons with completion status.
 * Path Parameters:
 *  - courseId: string (required)
 * Query Parameters:
 *  - userId: string (required)
 * Responses:
 *  - 200: { courseId: string, courseName: string, description?: string, modules: Array<{ moduleId: string, lessons: Array<{ lessonId: string, name: string, description?: string, isCompleted?: boolean }> }> }
 *  - 400: { error: string }
 *  - 404: { error: 'Course not found' }
 */
/** @type {import("express").RequestHandler} */
export const getCourse = async (req, res) => {
    res.status(501).send("Unimplemented");
};

/**
 * POST /courses
 * Purpose: Create a new course from topic input or from previously uploaded content.
 * Request Body:
 *  - userId: string (required)
 *  - topicInput?: string
 *  - rawContentId?: string
 *  - lengthOption?: string
 *  - depthOption?: string
 *  - languageOption?: string
 * Responses:
 *  - 201: { courseId: string, status: 'generating_structure' }
 *  - 400: { error: string }
 */
/** @type {import("express").RequestHandler} */
export const createCourse = async (req, res) => {
    res.status(501).send("Unimplemented");
};

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
    res.status(501).send("Unimplemented");
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
    res.status(501).send("Unimplemented");
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
    res.status(501).send("Unimplemented");
};

/**
 * GET /courses/:courseId/progress
 * Purpose: Retrieve course-specific progress (module completion and quiz performance).
 * Path Parameters:
 *  - courseId: string (required)
 * Query Parameters:
 *  - userId: string (required)
 * Responses:
 *  - 200: { moduleCompletion: Array<{ moduleId: string, completion: number }>, quizScores?: any, strengths?: any, weaknesses?: any }
 *  - 400: { error: string }
 *  - 404: { error: 'Course not found' }
 */
/** @type {import("express").RequestHandler} */
export const getProgress = async (req, res) => {
    res.status(501).send("Unimplemented");
};