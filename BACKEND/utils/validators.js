import { BadRequestError } from "../error/error.js";

/**
 * Validates that a value is not empty
 * @param {string} value - The value to validate
 * @param {string} fieldName - The name of the field for error messages
 * @param {string} type - The type of the field for error messages
 * @throws {BadRequestError} If validation fails
 */
export const validate = (req, fieldName = 'Field', type) => {
    if(req[fieldName] === undefined || req[fieldName] === null) {
        throw new BadRequestError(`${fieldName} is required`);
    }
    if (typeof req[fieldName] !== type) {
        throw new BadRequestError(`${fieldName} must be a ${type}`);
    }
    if (type === 'string' && req[fieldName].trim() === '') {
        throw new BadRequestError(`${fieldName} cannot be empty`);
    }
    return req[fieldName].trim();
};