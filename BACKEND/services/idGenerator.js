/**
 * Generates a random hex string of the specified length
 * @param {number} length - Length of the hex string to generate
 * @returns {string} Random hex string
 */
const generateRandomHex = (length) => {
    const bytes = new Uint8Array(Math.ceil(length / 2));
    crypto.getRandomValues(bytes);
    return Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('').slice(0, length);
};

/**
 * Generates a UUID v4 with an optional prefix
 * @param {string} [prefix] - Optional prefix for the ID (e.g., 'course', 'module', 'lesson')
 * @returns {string} Generated UUID v4 with optional prefix
 */
export const generateId = (prefix) => {
    // UUID v4 format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
    const uuid = [
        generateRandomHex(8),
        generateRandomHex(4),
        '4' + generateRandomHex(3), // Version 4
        ((parseInt('8', 16) | (parseInt('3', 16) & 0x3) | 0x8)).toString(16) + generateRandomHex(3), // Variant 1
        generateRandomHex(12)
    ].join('-');
    
    return prefix ? `${prefix}_${uuid}` : uuid;
};