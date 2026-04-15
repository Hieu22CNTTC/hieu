/**
 * Joi Validation middleware factory
 * @param {Object} schema - Joi schema object with body, query, params
 */
const validateJoi = (schema) => {
  return async (req, res, next) => {
    try {
      const validationOptions = {
        abortEarly: false, // Return all errors
        stripUnknown: true // Remove unknown fields
      };

      // Validate request body
      if (schema.body) {
        const { error, value } = schema.body.validate(req.body, validationOptions);
        if (error) {
          const errors = error.details.map(detail => ({
            field: detail.path.join('.'),
            message: detail.message
          }));
          return res.status(400).json({
            success: false,
            message: 'Validation failed',
            errors
          });
        }
        req.body = value;
      }

      // Validate query params
      if (schema.query) {
        const { error, value } = schema.query.validate(req.query, validationOptions);
        if (error) {
          const errors = error.details.map(detail => ({
            field: detail.path.join('.'),
            message: detail.message
          }));
          return res.status(400).json({
            success: false,
            message: 'Validation failed',
            errors
          });
        }
        req.query = value;
      }

      // Validate URL params
      if (schema.params) {
        const { error, value } = schema.params.validate(req.params, validationOptions);
        if (error) {
          const errors = error.details.map(detail => ({
            field: detail.path.join('.'),
            message: detail.message
          }));
          return res.status(400).json({
            success: false,
            message: 'Validation failed',
            errors
          });
        }
        req.params = value;
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

export default validateJoi;
