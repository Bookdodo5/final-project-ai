import db from '../config/firebase.js';
import { validate } from '../utils/validators.js';
import {
    NotFoundError,
    BadRequestError,
} from '../error/error.js';
import { generate } from "../services/gemini.js";
import { systemInstruction, prompt } from "../PROMPT/answerCheck.js";

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
    const userId = validate(req.params, 'userId', 'string');
    const questionRef = db.collection("users").doc(userId).collection('questions').doc(questionId);
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
 *  - moduleId: string (required)
 * Responses:
 *  - 200: Array of question objects
 *  - 400: { error: string }
 *  - 404: { error: 'No questions found' }
 */
/** @type {import("express").RequestHandler} */
export const getQuestionsByModuleId = async (req, res) => {
    const userId = validate(req.params, 'userId', 'string');
    const moduleId = validate(req.params, 'moduleId', 'string');

    let questionsRef = db.collection("users").doc(userId).collection('questions')
        .where('moduleId', '==', moduleId);

    const querySnapshot = await questionsRef.get();
    if (querySnapshot.empty) {
        throw new NotFoundError('No questions found');
    }

    const questions = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    }));
    res.status(200).json(questions);
};

/**
 * DELETE /questions/:questionId
 * Purpose: Delete a specific question
 * Path Parameters:
 *  - questionId: string (required)
 * Responses:
 *  - 200: Array of question objects
 *  - 400: { error: string }
 *  - 404: { error: 'No questions found' }
 */
/** @type {import("express").RequestHandler} */
export const deleteQuestionById = async (req, res) => {
    const userId = validate(req.params, 'userId', 'string');
    const questionId = validate(req.params, 'questionId', 'string');

    let questionRef = db.collection("users").doc(userId).collection('questions').doc(questionId);

    const questionDoc = await questionRef.get();
    if (!questionDoc.exists) {
        throw new NotFoundError('No questions found');
    }

    await questionRef.delete();
    res.status(200).json({ message: 'Question deleted' });
};

export async function deleteQuestionsByModuleId(userId, moduleId) {
    const qs = await db
        .collection("users").doc(userId)
        .collection("questions")
        .where("moduleId", "==", moduleId)
        .get();

    if (qs.empty) return 0;

    const batch = db.batch();
    let learnedQuestions = 0
    qs.forEach(d => {
        if (d.data().learned) learnedQuestions += 1;
        batch.delete(d.ref);
    });
    await batch.commit();
    return learnedQuestions;
}

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
    const userId = validate(req.params, 'userId', 'string');
    const questionId = validate(req.params, 'questionId', 'string');
    const answer = validate(req.body, 'answer', 'string');

    const questionRef = db.collection("users").doc(userId).collection('questions').doc(questionId);
    const questionDoc = await questionRef.get();

    if (!questionDoc.exists) {
        throw new NotFoundError('Question not found');
    }

    const questionData = questionDoc.data();

    const response = await generate(
        prompt(questionData.questionText, answer, questionData.correctAnswer),
        systemInstruction,
        {
            temperature: 0.7,
            topP: 0.9,
            model: "gemini-2.5-flash-lite",
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: "object",
                    properties: {
                        isCorrect: { type: "boolean" },
                        correctAnswer: { type: "string" },
                        feedback: { type: "string" }
                    },
                    required: ["isCorrect", "correctAnswer", "feedback"]
                }
            }
        }
    );

    res.status(200).json({
        isCorrect: response.isCorrect,
        correctAnswer: questionData.correctAnswer,
        feedback: response.feedback
    });
};

/**
 * PUT /questions/:questionId/rate
 * Purpose: Rate a question for SRS algorithm
 * Path Parameters:
 *  - questionId: string (required)
 *  - userId: string (required)
 * Request Body:
 *  - srsRating: 'Again'|'Hard'|'Good'|'Easy'|'Known' (required)
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
    const userId = validate(req.params, 'userId', 'string');
    const questionId = validate(req.params, 'questionId', 'string');
    const srsRating = validate(req.body, 'srsRating', 'string');

    if (!['Again', 'Hard', 'Good', 'Easy', 'Known'].includes(srsRating)) {
        throw new BadRequestError('Invalid SRS rating. Must be one of: Again, Hard, Good, Easy, Known');
    }

    const questionRef = db.collection("users").doc(userId).collection('questions').doc(questionId);
    const questionDoc = await questionRef.get();

    if (!questionDoc.exists) {
        throw new NotFoundError('Question not found');
    }

    const questionData = questionDoc.data();

    const srsData = updateSrsData(questionData.srsData, srsRating);
    await questionRef.update({
        'srsData': srsData,
        'updatedAt': new Date()
    });

    res.status(200).json({
        updatedSrsData: srsData
    });
};

/**
 * GET /questions/due-questions
 * Purpose: Get all questions that are due for review (SRS)
 * Responses:
 *  - 200: Array of question objects that are due for review
 *  - 400: { error: string }
 */
/** @type {import("express").RequestHandler} */
export const getDueQuestions = async (req, res) => {
    const userId = validate(req.params, 'userId', 'string');

    let questionsRef = db.collection("users").doc(userId).collection('questions')
        .where('srsData.nextReview', '<=', new Date())
        .where('learned', '==', true);

    const querySnapshot = await questionsRef.get();
    const questions = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    }));

    questions.sort((a, b) =>
        (a.srsData?.nextReview?.seconds || 0) - (b.srsData?.nextReview?.seconds || 0)
    );

    res.status(200).json(questions);
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
        case 'Known':
            srsData.interval = 3650;
            srsData.repetitions = 100;
            srsData.easeFactor = 2.5;
            srsData.isLearned = true;
            break;
            
        case 'Again':
            srsData.interval = 0.00347; // 5 minutes in days
            srsData.repetitions = Math.max(0, srsData.repetitions - 1);
            srsData.easeFactor = Math.max(1.3, srsData.easeFactor - 0.15);
            break;

        case 'Hard':
            srsData.interval = Math.round(srsData.interval);
            srsData.repetitions += 1;
            srsData.easeFactor = Math.max(1.3, srsData.easeFactor - 0.05);
            break;

        case 'Good':
            srsData.repetitions += 1;
            srsData.interval = Math.round(srsData.interval * srsData.easeFactor);
            break;

        case 'Easy':
            srsData.repetitions += 1;
            srsData.interval = Math.round(srsData.interval * srsData.easeFactor * 1.5);
            srsData.easeFactor = Math.min(2.5, srsData.easeFactor + 0.1);
            break;
    }

    srsData.lastReview = new Date();
    
    const intervalInMs = srsData.interval * 24 * 60 * 60 * 1000;
    const nextReview = new Date(now.getTime() + intervalInMs);
    srsData.nextReview = nextReview;

    return srsData;
}

/**
 * PUT /questions/:questionId/learn
 * Purpose: Mark a question as learned
 * Path Parameters:
 *  - questionId: string (required)
 *  - userId: string (required)
 * Responses:
 *  - 200: { 
 *      updatedQuestion: {
 *        id: string,
 *        ...doc.data()
 *      }
 *    }
 *  - 400: { error: string }
 *  - 404: { error: 'Question not found' }
 */
/** @type {import("express").RequestHandler} */
export const markQuestionAsLearned = async (req, res) => {
    const userId = validate(req.params, 'userId', 'string');
    const questionId = validate(req.params, 'questionId', 'string');
    const questionRef = db.collection("users").doc(userId).collection('questions').doc(questionId);
    const questionDoc = await questionRef.get();

    const userRef = db.collection("users").doc(userId);
    const userDoc = await userRef.get();

    if (!questionDoc.exists) {
        throw new NotFoundError('Question not found');
    }
    if (!userDoc.exists) {
        throw new NotFoundError('User not found');
    }

    if(questionDoc.data() && questionDoc.data().learned) {
        res.status(200).json({ message: 'Question already marked as learned' });
        return;
    }

    await questionRef.update({learned: true});

    await userRef.update({
        questionsLearned: (userDoc.data().questionsLearned || 0) + 1,
        lastActiveAt: new Date()
    });

    res.status(200).json({ message: 'Question marked as learned' });
};