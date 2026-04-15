import { validationResult } from 'express-validator';

/**
 * Express validator error handler
 * Checks for validation errors and returns 400 if any exist
 */
export const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }
  next();
};
