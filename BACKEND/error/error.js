// Base error class
class ApiError extends Error {
    constructor(message, statusCode) {
        super(message);
        this.name = this.constructor.name;
        this.statusCode = statusCode || 500;
        Error.captureStackTrace(this, this.constructor);
    }
}

// 400 Bad Request - The request was invalid or cannot be served
export class BadRequestError extends ApiError {
    constructor(message = 'Bad Request') {
        super(message, 400);
    }
}

// 401 Unauthorized - Authentication is required and has failed or has not been provided
export class UnauthorizedError extends ApiError {
    constructor(message = 'Unauthorized') {
        super(message, 401);
    }
}

// 403 Forbidden - The request was valid, but the server is refusing action
export class ForbiddenError extends ApiError {
    constructor(message = 'Forbidden') {
        super(message, 403);
    }
}

// 404 Not Found - The requested resource could not be found
export class NotFoundError extends ApiError {
    constructor(message = 'Not Found') {
        super(message, 404);
    }
}

// 409 Conflict - Indicates that the request could not be processed because of conflict
export class ConflictError extends ApiError {
    constructor(message = 'Conflict') {
        super(message, 409);
    }
}

// 422 Unprocessable Entity - The request was well-formed but was unable to be followed
export class ValidationError extends ApiError {
    constructor(message = 'Validation Error', errors = []) {
        super(message, 422);
        this.errors = errors;
    }
}

// 429 Too Many Requests - Too many requests in a given amount of time
export class RateLimitError extends ApiError {
    constructor(message = 'Too Many Requests') {
        super(message, 429);
    }
}

// 500 Internal Server Error - A generic error message
export class InternalServerError extends ApiError {
    constructor(message = 'Internal Server Error') {
        super(message, 500);
    }
}

export default {
    ApiError,
    BadRequestError,
    UnauthorizedError,
    ForbiddenError,
    NotFoundError,
    ConflictError,
    ValidationError,
    RateLimitError,
    InternalServerError
};
