/**
 * GET /quizzes/:quizId
 * Purpose: Retrieve the questions and metadata for an active quiz session.
 * Query Parameters:
 *  - userId: string (required) — the caller's unique ID from local storage
 * Path Parameters:
 *  - quizId: string (required)
 * Responses:
 *  - 200: { quizId: string, courseId: string, moduleId?: string, lessonId?: string,
 *           questions: Array<{ questionId: string, question_type: 'mcq'|'open', question_text: string, options?: string[] }>,
 *           quizProgressIndicator?: any }
 *  - 400: { error: string }
 *  - 404: { error: 'Quiz not found' }
 */
/** @type {import("express").RequestHandler} */
export const getQuiz = async (req, res) => {
    res.status(501).send("Unimplemented");
};

/**
 * POST /quizzes
 * Purpose: Request generation of a new quiz based on course/module/lesson context via AI.
 * Request Body:
 *  - userId: string (required)
 *  - courseId: string (required)
 *  - moduleId?: string
 *  - lessonId?: string
 *  - quizType?: string
 *  - difficulty?: 'easy'|'medium'|'hard'
 *  - numberOfQuestions?: number
 * Responses:
 *  - 201: { quizId: string, questions: Array<{ questionId: string, question_type: 'mcq'|'open', question_text: string, options?: string[] }> }
 *  - 400: { error: string }
 */
/** @type {import("express").RequestHandler} */
export const createQuiz = async (req, res) => {
    res.status(501).send("Unimplemented");
};

/**
 * GET /quizzes/:quizId/questions/:questionId
 * Purpose: Retrieve a specific question from a quiz (optional helper endpoint).
 * Query Parameters:
 *  - userId: string (required)
 * Path Parameters:
 *  - quizId: string (required)
 *  - questionId: string (required)
 * Responses:
 *  - 200: { questionId: string, question_type: 'mcq'|'open', question_text: string, options?: string[] }
 *  - 400: { error: string }
 *  - 404: { error: 'Question not found' }
 */
/** @type {import("express").RequestHandler} */
export const getQuestion = async (req, res) => {
    res.status(501).send("Unimplemented");
};

/**
 * POST /quizzes/:quizId/questions/:questionId/submit
 * Purpose: Submit user's answer, trigger AI grading for open-ended answers, and capture SRS rating.
 * Path Parameters:
 *  - quizId: string (required)
 *  - questionId: string (required)
 * Request Body:
 *  - userId: string (required)
 *  - user_answer: string | string[] | any (required)
 *  - srs_rating: 'Again'|'Hard'|'Good'|'Easy' (required)
 * Responses:
 *  - 200: { ai_grade: string|number, ai_feedback: string, suggested_improvements?: string, ideal_answer?: string }
 *  - 400: { error: string }
 *  - 404: { error: 'Quiz or question not found' }
 */
/** @type {import("express").RequestHandler} */
export const submitAnswer = async (req, res) => {
    res.status(501).send("Unimplemented");
};
