import db from "../config/firebase.js";
import { 
    ConflictError, 
    NotFoundError
} from "../error/error.js";
import { validate } from "../utils/validators.js";

/**
 * GET /users/:userId
 * Purpose: Retrieve a user's information.
 * Path Parameters:
 *  - userId: string (required) - ID of the user to retrieve
 * Responses:
 *  - 200: {
 *        userId: string,
 *        createdAt: string, // ISO timestamp
 *        lastActiveAt: string // ISO timestamp
 *     }
 *  - 400: { error: string } - Invalid user ID format
 *  - 404: { error: string } - User not found
 *  - 500: { error: string } - Server error
 */
/** @type {import("express").RequestHandler} */
export const getUser = async (req, res) => {
    const userId = validate(req.params, 'userId', 'string');
    const userRef = db.collection("users").doc(userId);
    const userDoc = await userRef.get();
    
    if (!userDoc.exists) {
        throw new NotFoundError('User not found');
    }
    
    const userData = userDoc.data();
    res.status(200).json({
        userId: userDoc.id,
        createdAt: userData.createdAt,
        lastActiveAt: userData.lastActiveAt,
        questionsLearned: userData.questionsLearned ?? 0,
        moduleCount: userData.moduleCount ?? 0,
        moduleCompleted: userData.moduleCompleted ?? 0,
        quizAnswered: userData.quizAnswered ?? 0,
        quizCorrect: userData.quizCorrect ?? 0,
        srsAnswered: userData.srsAnswered ?? 0,
        srsCorrect: userData.srsCorrect ?? 0
    });
};

/**
 * POST /users
 * Purpose: Create a new user account.
 * Request Body:
 *  - userId (string) : string generated as a key from the frontend to identify the user
 * Responses:
 *  - 201: { 
 *        userId: string,
 *        createdAt: string // ISO timestamp
 *        lastActiveAt: string // ISO timestamp
 *     }
 *  - 400: { error: string } - Invalid input
 *  - 409: { error: string } - User already exists
 *  - 500: { error: string } - Server error
 */
/** @type {import("express").RequestHandler} */
export const createUser = async (req, res) => {
    const userId = validate(req.body, 'userId', 'string');
    const userRef = db.collection("users").doc(userId);
    const userDoc = await userRef.get();
    
    if (userDoc.exists) {
        throw new ConflictError('User with this ID already exists');
    }
    const now = new Date();
    const payload = {
        createdAt: now,
        lastActiveAt: now,
        moduleCount: 0,
        moduleCompleted: 0,
        quizAnswered: 0,
        quizCorrect: 0,
        srsAnswered: 0,
        srsCorrect: 0,
    };
    await userRef.set(payload);
    res.status(201).json({
        userId,
        ...payload
    });
};

/**
 * PUT /users/:userId
 * Purpose: Update a user account.
 * Path Parameters:
 *  - userId: string (required) - ID of the user to update
 * Responses:
 *  - 201: { 
 *        userId: string,
 *        createdAt: string // ISO timestamp
 *        lastActiveAt: string // ISO timestamp
 *     }
 *  - 400: { error: string } - Invalid input
 *  - 404: { error: string } - User not found
 *  - 500: { error: string } - Server error
 */
/** @type {import("express").RequestHandler} */
export const updateUser = async (req, res) => {
    const userId = validate(req.params, 'userId', 'string');
    const userRef = db.collection("users").doc(userId);
    const userDoc = await userRef.get();
    
    if (!userDoc.exists) {
        throw new NotFoundError('User not found');
    }
    const current = userDoc.data();
    await userRef.update({
        lastActiveAt: new Date(),
        moduleCount: req.body.moduleCount ?? (current.moduleCount ?? 0),
        moduleCompleted: req.body.moduleCompleted ?? (current.moduleCompleted ?? 0),
        quizAnswered: req.body.quizAnswered ?? (current.quizAnswered ?? 0),
        quizCorrect: req.body.quizCorrect ?? (current.quizCorrect ?? 0),
        srsAnswered: req.body.srsAnswered ?? (current.srsAnswered ?? 0),
        srsCorrect: req.body.srsCorrect ?? (current.srsCorrect ?? 0),
    });
    res.status(200).json({ message: 'Updated' });
};

/**
 * DELETE /users/:userId
 * Purpose: Delete a user account and all associated data.
 * Path Parameters:
 *  - userId: string (required) - ID of the user to delete
 * Responses:
 *  - 204: No Content - User successfully deleted
 *  - 400: { error: string } - Invalid user ID format
 *  - 404: { error: string } - User not found
 *  - 500: { error: string } - Server error
 */
/** @type {import("express").RequestHandler} */
export const deleteUser = async (req, res) => {
    const userId = validate(req.params, 'userId', 'string');
    const userRef = db.collection("users").doc(userId);
    const userDoc = await userRef.get();
    
    if (!userDoc.exists) {
        throw new NotFoundError('User not found');
    }
    
    await userRef.delete();
    res.status(204).send();
};
