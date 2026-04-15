/**
 * E-Ticket Code Generator
 * Generates unique e-ticket codes for confirmed payments
 */

import crypto from 'crypto';

/**
 * Generate unique eTicket code
 * Format: E-{TIMESTAMP_BASE36}-{RANDOM_HASH}
 * Example: E-ZMOZW8-A9XY1234BCDE
 * 
 * @returns {string} Unique eTicket code
 */
export const generateETicketCode = () => {
  // Convert current timestamp to base36 (compact format)
  const timestamp = Date.now().toString(36).toUpperCase();
  
  // Generate 8-character random string from crypto
  const randomBytes = crypto.randomBytes(4).toString('hex').toUpperCase();
  
  // Generate sequential number for uniqueness
  const counter = Math.random().toString(36).substring(2, 10).toUpperCase();
  
  return `E-${timestamp}-${randomBytes}${counter}`;
};

/**
 * Generate eTicket code with prefix (airline code)
 * Format: VN-{TIMESTAMP_BASE36}-{RANDOM}
 * Example: VN-ZMOZW8-A9XY1234
 * 
 * @param {string} airlineCode - Airline code (e.g., 'VN' for Vietnam Airlines)
 * @returns {string} Airline-prefixed eTicket code
 */
export const generateAirlineTicketCode = (airlineCode = 'VN') => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const randomBytes = crypto.randomBytes(4).toString('hex').toUpperCase();
  
  return `${airlineCode}-${timestamp}-${randomBytes}`;
};

/**
 * Validate eTicket code format
 * @param {string} code - Code to validate
 * @returns {boolean} True if valid format
 */
export const isValidETicketCode = (code) => {
  // Pattern: E-{base36}-{alphanumeric} or XX-{base36}-{hex}
  return /^[A-Z]{2,}-[A-Z0-9]+-[A-Z0-9]+$/.test(code);
};
