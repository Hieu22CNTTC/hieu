import Joi from 'joi';

// ==================== AIRPORTS VALIDATION ====================

/**
 * Validation schema for getting all airports
 */
export const getAllAirportsSchema = {
  query: Joi.object({
    city: Joi.string().optional(),
    country: Joi.string().optional(),
    search: Joi.string().optional(),
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
    sortBy: Joi.string().valid('createdAt', 'updatedAt', 'code', 'name', 'city').default('createdAt'),
    sortOrder: Joi.string().valid('asc', 'desc').default('desc')
  })
};

/**
 * Validation schema for creating an airport
 */
export const createAirportSchema = {
  body: Joi.object({
    code: Joi.string().length(3).uppercase().required()
      .messages({
        'string.length': 'Airport code must be exactly 3 characters',
        'string.empty': 'Airport code is required',
        'any.required': 'Airport code is required'
      }),
    name: Joi.string().min(3).required()
      .messages({
        'string.min': 'Airport name must be at least 3 characters',
        'string.empty': 'Airport name is required',
        'any.required': 'Airport name is required'
      }),
    city: Joi.string().min(2).required()
      .messages({
        'string.min': 'City must be at least 2 characters',
        'string.empty': 'City is required',
        'any.required': 'City is required'
      }),
    country: Joi.string().min(2).required()
      .messages({
        'string.min': 'Country must be at least 2 characters',
        'string.empty': 'Country is required',
        'any.required': 'Country is required'
      }),
    timezone: Joi.string().optional().default('Asia/Ho_Chi_Minh')
      .messages({
        'string.base': 'Timezone must be a valid IANA timezone string'
      })
  })
};

/**
 * Validation schema for updating an airport
 */
export const updateAirportSchema = {
  body: Joi.object({
    name: Joi.string().min(3).optional(),
    city: Joi.string().min(2).optional(),
    country: Joi.string().min(2).optional(),
    timezone: Joi.string().optional()
  }).min(1).messages({
    'object.min': 'At least one field must be provided for update'
  })
};

// ==================== AIRCRAFT VALIDATION ====================

/**
 * Validation schema for getting all aircraft
 */
export const getAllAircraftSchema = {
  query: Joi.object({
    model: Joi.string().optional(),
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
    sortBy: Joi.string().valid('createdAt', 'updatedAt', 'model', 'totalSeats').default('createdAt'),
    sortOrder: Joi.string().valid('asc', 'desc').default('desc')
  })
};

/**
 * Validation schema for creating aircraft
 */
export const createAircraftSchema = {
  body: Joi.object({
    model: Joi.string().min(3).required()
      .messages({
        'string.min': 'Aircraft model must be at least 3 characters',
        'string.empty': 'Aircraft model is required',
        'any.required': 'Aircraft model is required'
      }),
    totalSeats: Joi.number().integer().positive().required()
      .messages({
        'number.base': 'Total seats must be a number',
        'number.positive': 'Total seats must be positive',
        'any.required': 'Total seats is required'
      }),
    businessSeats: Joi.number().integer().min(0).required()
      .messages({
        'number.base': 'Business seats must be a number',
        'number.min': 'Business seats must be at least 0',
        'any.required': 'Business seats is required'
      }),
    economySeats: Joi.number().integer().min(0).required()
      .messages({
        'number.base': 'Economy seats must be a number',
        'number.min': 'Economy seats must be at least 0',
        'any.required': 'Economy seats is required'
      })
  })
};

/**
 * Validation schema for updating aircraft
 */
export const updateAircraftSchema = {
  body: Joi.object({
    model: Joi.string().min(3).optional(),
    businessSeats: Joi.number().integer().min(0).optional(),
    economySeats: Joi.number().integer().min(0).optional()
  }).min(1).messages({
    'object.min': 'At least one field must be provided for update'
  })
};

// ==================== COUPONS VALIDATION ====================

/**
 * Validation schema for getting all coupons
 */
export const getAllCouponsSchema = {
  query: Joi.object({
    isActive: Joi.string().valid('true', 'false').optional(),
    code: Joi.string().optional(),
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
    sortBy: Joi.string().valid('createdAt', 'updatedAt', 'code', 'validFrom', 'validUntil').default('createdAt'),
    sortOrder: Joi.string().valid('asc', 'desc').default('desc')
  })
};

/**
 * Validation schema for creating a coupon
 */
export const createCouponSchema = {
  body: Joi.object({
    code: Joi.string().min(4).max(20).uppercase().required()
      .messages({
        'string.min': 'Coupon code must be at least 4 characters',
        'string.max': 'Coupon code must not exceed 20 characters',
        'string.empty': 'Coupon code is required',
        'any.required': 'Coupon code is required'
      }),
    description: Joi.string().max(500).optional().allow(null, '')
      .messages({
        'string.max': 'Description must not exceed 500 characters'
      }),
    discount: Joi.number().min(1).max(100).required()
      .messages({
        'number.base': 'Discount must be a number',
        'number.min': 'Discount must be at least 1%',
        'number.max': 'Discount must not exceed 100%',
        'any.required': 'Discount is required'
      }),
    minPurchase: Joi.number().positive().optional().allow(null)
      .messages({
        'number.base': 'Minimum purchase must be a number',
        'number.positive': 'Minimum purchase must be positive'
      }),
    maxDiscount: Joi.number().positive().optional().allow(null)
      .messages({
        'number.base': 'Maximum discount must be a number',
        'number.positive': 'Maximum discount must be positive'
      }),
    validFrom: Joi.date().iso().required()
      .messages({
        'date.base': 'Valid from must be a valid date',
        'any.required': 'Valid from is required'
      }),
    validUntil: Joi.date().iso().greater(Joi.ref('validFrom')).required()
      .messages({
        'date.base': 'Valid until must be a valid date',
        'date.greater': 'Valid until must be after valid from',
        'any.required': 'Valid until is required'
      }),
    usageLimit: Joi.number().integer().positive().optional().allow(null)
      .messages({
        'number.base': 'Usage limit must be a number',
        'number.positive': 'Usage limit must be positive'
      }),
    isActive: Joi.boolean().optional().default(true)
  })
};

/**
 * Validation schema for updating a coupon
 */
export const updateCouponSchema = {
  body: Joi.object({
    description: Joi.string().max(500).optional().allow(null, ''),
    discount: Joi.number().min(1).max(100).optional(),
    minPurchase: Joi.number().positive().optional().allow(null),
    maxDiscount: Joi.number().positive().optional().allow(null),
    validFrom: Joi.date().iso().optional(),
    validUntil: Joi.date().iso().when('validFrom', {
      is: Joi.exist(),
      then: Joi.date().greater(Joi.ref('validFrom')),
      otherwise: Joi.date()
    }).optional()
      .messages({
        'date.greater': 'Valid until must be after valid from'
      }),
    usageLimit: Joi.number().integer().positive().optional().allow(null),
    isActive: Joi.boolean().optional()
  }).min(1).messages({
    'object.min': 'At least one field must be provided for update'
  })
};

// ==================== USERS VALIDATION ====================

/**
 * Validation schema for getting all users
 */
export const getAllUsersSchema = {
  query: Joi.object({
    role: Joi.string().valid('USER', 'SALES', 'MANAGER', 'ADMIN').optional(),
    isActive: Joi.string().valid('true', 'false').optional(),
    search: Joi.string().optional(),
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
    sortBy: Joi.string().valid('createdAt', 'updatedAt', 'email', 'fullName', 'lastLoginAt').default('createdAt'),
    sortOrder: Joi.string().valid('asc', 'desc').default('desc')
  })
};

/**
 * Validation schema for creating a user
 */
export const createUserSchema = {
  body: Joi.object({
    email: Joi.string().email().required()
      .messages({
        'string.email': 'Please provide a valid email address',
        'string.empty': 'Email is required',
        'any.required': 'Email is required'
      }),
    password: Joi.string().min(6).required()
      .messages({
        'string.min': 'Password must be at least 6 characters',
        'string.empty': 'Password is required',
        'any.required': 'Password is required'
      }),
    fullName: Joi.string().min(2).required()
      .messages({
        'string.min': 'Full name must be at least 2 characters',
        'string.empty': 'Full name is required',
        'any.required': 'Full name is required'
      }),
    phoneNumber: Joi.string().pattern(/^[0-9]{10,11}$/).optional().allow(null, '')
      .messages({
        'string.pattern.base': 'Phone number must be 10-11 digits'
      }),
    role: Joi.string().valid('USER', 'SALES', 'MANAGER', 'ADMIN').default('USER')
      .messages({
        'any.only': 'Role must be one of: USER, SALES, MANAGER, ADMIN'
      })
  })
};

/**
 * Validation schema for updating a user
 */
export const updateUserSchema = {
  body: Joi.object({
    email: Joi.string().email().optional()
      .messages({
        'string.email': 'Please provide a valid email address'
      }),
    password: Joi.string().min(6).optional()
      .messages({
        'string.min': 'Password must be at least 6 characters'
      }),
    fullName: Joi.string().min(2).optional()
      .messages({
        'string.min': 'Full name must be at least 2 characters'
      }),
    phoneNumber: Joi.string().pattern(/^[0-9]{10,11}$/).optional().allow(null, '')
      .messages({
        'string.pattern.base': 'Phone number must be 10-11 digits'
      }),
    role: Joi.string().valid('USER', 'SALES', 'MANAGER', 'ADMIN').optional()
      .messages({
        'any.only': 'Role must be one of: USER, SALES, MANAGER, ADMIN'
      })
  }).min(1).messages({
    'object.min': 'At least one field must be provided for update'
  })
};

/**
 * Validation schema for updating user role
 */
export const updateUserRoleSchema = {
  body: Joi.object({
    role: Joi.string().valid('USER', 'SALES', 'MANAGER', 'ADMIN').required()
      .messages({
        'any.only': 'Role must be one of: USER, SALES, MANAGER, ADMIN',
        'any.required': 'Role is required'
      })
  })
};

// ==================== STATISTICS VALIDATION ====================

/**
 * Validation schema for revenue statistics
 */
export const revenueStatisticsSchema = {
  query: Joi.object({
    startDate: Joi.date().iso().required()
      .messages({
        'date.base': 'Start date must be a valid date',
        'any.required': 'Start date is required'
      }),
    endDate: Joi.date().iso().min(Joi.ref('startDate')).required()
      .messages({
        'date.base': 'End date must be a valid date',
        'date.min': 'End date must be after start date',
        'any.required': 'End date is required'
      }),
    groupBy: Joi.string().valid('day', 'week', 'month').default('day')
      .messages({
        'any.only': 'Group by must be one of: day, week, month'
      })
  })
};
