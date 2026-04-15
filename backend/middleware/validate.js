import { z } from 'zod';

/**
 * Validation middleware factory
 * @param {Object} schema - Zod schema object with body, query, params
 */
const validate = (schema) => {
  return async (req, res, next) => {
    try {
      // Validate request body
      if (schema.body) {
        req.body = await schema.body.parseAsync(req.body);
      }

      // Validate query params
      if (schema.query) {
        req.query = await schema.query.parseAsync(req.query);
      }

      // Validate URL params
      if (schema.params) {
        req.params = await schema.params.parseAsync(req.params);
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

export default validate;
