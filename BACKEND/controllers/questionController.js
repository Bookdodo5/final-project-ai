import db from '../config/firebase.js';
import { validate } from '../utils/validators.js';
import {
    NotFoundError,
    BadRequestError,
    InternalServerError
} from '../error/error.js';

/**
 * GET /questions/:questionId
 * Purpose: Retrieve a specific question by its ID
 * Path Parameters:
 *  - questionId: string (required)
 * Responses:
 *  - 200: { 
 *      id: string,
 *      questionText: string,
 *      type: 'mcq'|'open-ended'|'true-false',
 *      options: string[],
 *      correctAnswer: string | string[],
 *      courseId: string,
 *      moduleId: string,
 *      questionOrder: number,
 *      star: number,
 *      srsData: {
 *        nextReview: Timestamp,
 *        lastReview: Timestamp,
 *        interval: number,
 *        repetitions: number,
 *        easeFactor: number
 *      },
 *      generatedAt: Timestamp,
 *      updatedAt: Timestamp
 *    }
 *  - 400: { error: string }
 *  - 404: { error: 'Question not found' }
 */
/** @type {import("express").RequestHandler} */
export const getQuestionById = async (req, res) => {
    const questionId = validate(req.params, 'questionId', 'string');
    const questionRef = db.collection('questions').doc(questionId);
    const questionDoc = await questionRef.get();

    if (!questionDoc.exists) {
        throw new NotFoundError('Question not found');
    }

    res.status(200).json({ id: questionDoc.id, ...questionDoc.data() });
};

/**
 * GET /questions/:courseId/:moduleId
 * Purpose: Get all questions for a specific module
 * Path Parameters:
 *  - courseId: string (required)
 *  - moduleId: string (required)
 * Responses:
 *  - 200: Array of question objects
 *  - 400: { error: string }
 *  - 404: { error: 'No questions found' }
 */
/** @type {import("express").RequestHandler} */
export const getQuestionsByModuleId = async (req, res) => {
    const courseId = validate(req.params, 'courseId', 'string');
    const moduleId = validate(req.params, 'moduleId', 'string');

    let questionsRef = db.collection('questions')
        .where('courseId', '==', courseId)
        .where('moduleId', '==', moduleId);

    const querySnapshot = await questionsRef.get();
    if (querySnapshot.empty) {
        throw new NotFoundError('No questions found');
    }

    const questions = querySnapshot.map(doc => ({
        id: doc.id,
        ...doc.data()
    }));
    res.status(200).json(questions);
};

/**
 * POST /questions/:questionId/submit
 * Purpose: Submit an answer to a question
 * Path Parameters:
 *  - questionId: string (required)
 * Request Body:
 *  - userId: string (required)
 *  - answer: string | string[] (required)
 * Responses:
 *  - 200: { 
 *      isCorrect: boolean,
 *      correctAnswer: string | string[], 
 *      feedback: string
 *    }
 *  - 400: { error: string }
 *  - 404: { error: 'Question not found' }
 */
/** @type {import("express").RequestHandler} */
export const submitAnswer = async (req, res) => {
    try {
        const questionId = validate(req.params, 'questionId', 'string');
        const { userId, answer } = req.body;

        validate({ userId }, 'userId', 'string');
        validate({ answer }, 'answer', ['string', 'array']);

        const questionRef = db.collection('questions').doc(questionId);
        const questionDoc = await questionRef.get();

        if (!questionDoc.exists) {
            throw new NotFoundError('Question not found');
        }

        const questionData = questionDoc.data();
        const isCorrect = Array.isArray(questionData.correctAnswer)
            ? JSON.stringify(questionData.correctAnswer.sort()) === JSON.stringify([].concat(answer).sort())
            : questionData.correctAnswer === answer;

        // Save user's answer to their history
        await db.collection('userAnswers').add({
            userId,
            questionId,
            answer,
            isCorrect,
            timestamp: db.FieldValue.serverTimestamp()
        });

        res.status(200).json({
            isCorrect,
            correctAnswer: questionData.correctAnswer,
            feedback: isCorrect ? 'Correct!' : 'Incorrect, please review the material.'
        });
    } catch (error) {
        console.error('Error submitting answer:', error);

        if (error instanceof NotFoundError) {
            res.status(404).json({ error: error.message });
        } else if (error instanceof BadRequestError) {
            res.status(400).json({ error: error.message });
        } else {
            res.status(500).json({ error: 'Failed to submit answer' });
        }
    }
};

/**
 * POST /questions/:questionId/rate
 * Purpose: Rate a question for SRS algorithm
 * Path Parameters:
 *  - questionId: string (required)
 * Request Body:
 *  - userId: string (required)
 *  - srsRating: 'Again'|'Hard'|'Good'|'Easy' (required)
 * Responses:
 *  - 200: { 
 *      updatedSrsData: {
 *        nextReview: Timestamp,
 *        interval: number,
 *        repetitions: number,
 *        easeFactor: number,
 *        lastReview: Timestamp
 *      }
 *    }
 *  - 400: { error: string }
 *  - 404: { error: 'Question not found' }
 */
/** @type {import("express").RequestHandler} */
export const rateQuestion = async (req, res) => {
    try {
        const questionId = validate(req.params, 'questionId', 'string');
        const { userId, srsRating } = req.body;

        validate({ userId }, 'userId', 'string');
        validate({ srsRating }, 'srsRating', 'string');

        if (!['Again', 'Hard', 'Good', 'Easy'].includes(srsRating)) {
            throw new BadRequestError('Invalid SRS rating. Must be one of: Again, Hard, Good, Easy');
        }

        const questionRef = db.collection('questions').doc(questionId);
        const questionDoc = await questionRef.get();

        if (!questionDoc.exists) {
            throw new NotFoundError('Question not found');
        }

        const questionData = questionDoc.data();
        
        // Update SRS data
        const srsData = updateSrsData({
            interval: questionData.srsData?.interval,
            repetitions: questionData.srsData?.repetitions,
            easeFactor: questionData.srsData?.easeFactor,
            lastReview: questionData.srsData?.lastReview
        }, srsRating);

        // Update question with new SRS data
        await questionRef.update({
            'srsData.interval': srsData.interval,
            'srsData.repetitions': srsData.repetitions,
            'srsData.easeFactor': srsData.easeFactor,
            'srsData.lastReview': srsData.lastReview,
            'srsData.nextReview': srsData.nextReview,
            'updatedAt': db.FieldValue.serverTimestamp()
        });

        res.status(200).json({
            updatedSrsData: srsData
        });
    } catch (error) {
        console.error('Error rating question:', error);

        if (error instanceof NotFoundError) {
            res.status(404).json({ error: error.message });
        } else if (error instanceof BadRequestError) {
            res.status(400).json({ error: error.message });
        } else {
            res.status(500).json({ error: 'Failed to rate question' });
        }
    }
};

/**
 * GET /questions/due-questions
 * Purpose: Get all questions that are due for review (SRS)
 * Query Parameters:
 *  - userId: string (required)
 *  - courseId: string (optional)
 *  - moduleId: string (optional)
 *  - limit: number (optional)
 * Responses:
 *  - 200: Array of question objects that are due for review
 *  - 400: { error: string }
 */
/** @type {import("express").RequestHandler} */
export const getDueQuestions = async (req, res) => {
    try {
        const userId = validate(req.query, 'userId', 'string');
        const { courseId, moduleId, limit } = req.query;

        let questionsRef = db.collection('questions')
            .where('srsData.nextReviewDate', '<=', new Date());

        if (courseId) {
            questionsRef = questionsRef.where('courseId', '==', courseId);
        }

        if (moduleId) {
            questionsRef = questionsRef.where('moduleId', '==', moduleId);
        }

        const querySnapshot = await questionsRef.get();

        let questions = [];
        querySnapshot.forEach(doc => {
            questions.push({ id: doc.id, ...doc.data() });
        });

        // Sort by next review date (oldest first)
        questions.sort((a, b) =>
            (a.srsData?.nextReviewDate?.seconds || 0) - (b.srsData?.nextReviewDate?.seconds || 0)
        );

        if (limit && !isNaN(limit)) {
            questions = questions.slice(0, parseInt(limit));
        }

        res.status(200).json(questions);
    } catch (error) {
        console.error('Error getting due questions:', error);

        if (error instanceof BadRequestError) {
            res.status(400).json({ error: error.message });
        } else {
            res.status(500).json({ error: 'Failed to get due questions' });
        }
    }
};

/**
 * Helper function to update SRS data based on user's rating
 * Implements a simplified version of the SuperMemo-2 algorithm
 * @private
 */
function updateSrsData(currentSrsData, rating) {
    const srsData = { ...currentSrsData };
    const now = new Date();

    // Initialize SRS data if it doesn't exist
    if (!srsData.interval) srsData.interval = 1;
    if (!srsData.repetitions) srsData.repetitions = 0;
    if (!srsData.easeFactor) srsData.easeFactor = 2.5;

    // Update based on rating
    switch (rating) {
        case 'Again':
            srsData.interval = 1;
            srsData.repetitions = 0;
            srsData.easeFactor = Math.max(1.3, srsData.easeFactor - 0.15);
            break;

        case 'Hard':
            srsData.interval = Math.round(srsData.interval * 1.5);
            srsData.repetitions += 1;
            srsData.easeFactor = Math.max(1.3, srsData.easeFactor - 0.05);
            break;

        case 'Good':
            srsData.repetitions += 1;
            srsData.interval = Math.round(srsData.interval * srsData.easeFactor);
            // easeFactor stays the same
            break;

        case 'Easy':
            srsData.repetitions += 1;
            srsData.interval = Math.round(srsData.interval * srsData.easeFactor * 1.5);
            srsData.easeFactor = Math.min(2.5, srsData.easeFactor + 0.1);
            break;
    }

    // Update review dates
    srsData.lastReview = db.FieldValue.serverTimestamp();

    // Calculate next review date (add interval days)
    const nextReviewDate = new Date(now);
    nextReviewDate.setDate(now.getDate() + srsData.interval);
    srsData.nextReview = db.Timestamp.fromDate(nextReviewDate);

    return srsData;
}
