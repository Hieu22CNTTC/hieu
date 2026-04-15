import Joi from 'joi';

// ==================== ROUTES VALIDATION ====================

/**
 * Validation schema for getting all routes
 */
export const getAllRoutesSchema = {
  query: Joi.object({
    departureId: Joi.string().optional(),
    arrivalId: Joi.string().optional(),
    isActive: Joi.string().valid('true', 'false').optional(),
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
    sortBy: Joi.string().valid('createdAt', 'updatedAt', 'standardPrice').default('createdAt'),
    sortOrder: Joi.string().valid('asc', 'desc').default('desc')
  })
};

/**
 * Validation schema for creating a route
 */
export const createRouteSchema = {
  body: Joi.object({
    departureId: Joi.string().required()
      .messages({
        'string.empty': 'Departure airport ID is required',
        'any.required': 'Departure airport ID is required'
      }),
    arrivalId: Joi.string().required()
      .invalid(Joi.ref('departureId'))
      .messages({
        'string.empty': 'Arrival airport ID is required',
        'any.required': 'Arrival airport ID is required',
        'any.invalid': 'Arrival airport must be different from departure airport'
      }),
    distance: Joi.number().integer().positive().optional()
      .messages({
        'number.base': 'Distance must be a number',
        'number.positive': 'Distance must be positive'
      }),
    duration: Joi.number().integer().positive().optional()
      .messages({
        'number.base': 'Duration must be a number',
        'number.positive': 'Duration must be positive'
      }),
    standardPrice: Joi.number().positive().optional()
      .messages({
        'number.base': 'Standard price must be a number',
        'number.positive': 'Standard price must be positive'
      })
  })
};

/**
 * Validation schema for updating a route
 */
export const updateRouteSchema = {
  body: Joi.object({
    distance: Joi.number().integer().positive().optional(),
    duration: Joi.number().integer().positive().optional(),
    standardPrice: Joi.number().positive().optional(),
    isActive: Joi.boolean().optional()
  }).min(1).messages({
    'object.min': 'At least one field must be provided for update'
  })
};

// ==================== FLIGHTS VALIDATION ====================

/**
 * Validation schema for getting all flights
 */
export const getAllFlightsSchema = {
  query: Joi.object({
    routeId: Joi.string().optional(),
    aircraftId: Joi.string().optional(),
    flightNumber: Joi.string().optional(),
    startDate: Joi.date().iso().optional(),
    endDate: Joi.date().iso().min(Joi.ref('startDate')).optional()
      .messages({
        'date.min': 'End date must be after start date'
      }),
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
    sortBy: Joi.string().valid('departureTime', 'arrivalTime', 'basePrice', 'createdAt').default('departureTime'),
    sortOrder: Joi.string().valid('asc', 'desc').default('asc')
  })
};

/**
 * Validation schema for creating a flight
 */
export const createFlightSchema = {
  body: Joi.object({
    flightNumber: Joi.string().uppercase().pattern(/^[A-Z]{2}\d{3,4}$/).required()
      .messages({
        'string.empty': 'Flight number is required',
        'any.required': 'Flight number is required',
        'string.pattern.base': 'Flight number must be in format: VN101 (2 letters + 3-4 digits)'
      }),
    routeId: Joi.string().required()
      .messages({
        'string.empty': 'Route ID is required',
        'any.required': 'Route ID is required'
      }),
    aircraftId: Joi.string().required()
      .messages({
        'string.empty': 'Aircraft ID is required',
        'any.required': 'Aircraft ID is required'
      }),
    departureTime: Joi.date().iso().greater('now').required()
      .messages({
        'date.base': 'Departure time must be a valid date',
        'date.greater': 'Departure time must be in the future',
        'any.required': 'Departure time is required'
      }),
    arrivalTime: Joi.date().iso().greater(Joi.ref('departureTime')).required()
      .messages({
        'date.base': 'Arrival time must be a valid date',
        'date.greater': 'Arrival time must be after departure time',
        'any.required': 'Arrival time is required'
      }),
    basePrice: Joi.number().positive().required()
      .messages({
        'number.base': 'Base price must be a number',
        'number.positive': 'Base price must be positive',
        'any.required': 'Base price is required'
      }),
    businessPrice: Joi.number().positive().min(Joi.ref('basePrice')).required()
      .messages({
        'number.base': 'Business price must be a number',
        'number.positive': 'Business price must be positive',
        'number.min': 'Business price must be greater than or equal to base price',
        'any.required': 'Business price is required'
      }),
    promotionId: Joi.string().optional().allow(null),
    notes: Joi.string().max(500).optional().allow(null, '')
      .messages({
        'string.max': 'Notes must not exceed 500 characters'
      })
  })
};

/**
 * Validation schema for updating a flight
 */
export const updateFlightSchema = {
  body: Joi.object({
    departureTime: Joi.date().iso().greater('now').optional()
      .messages({
        'date.base': 'Departure time must be a valid date',
        'date.greater': 'Departure time must be in the future'
      }),
    arrivalTime: Joi.date().iso().when('departureTime', {
      is: Joi.exist(),
      then: Joi.date().greater(Joi.ref('departureTime')),
      otherwise: Joi.date()
    }).optional()
      .messages({
        'date.base': 'Arrival time must be a valid date',
        'date.greater': 'Arrival time must be after departure time'
      }),
    basePrice: Joi.number().positive().optional(),
    businessPrice: Joi.number().positive().when('basePrice', {
      is: Joi.exist(),
      then: Joi.number().min(Joi.ref('basePrice')),
      otherwise: Joi.number()
    }).optional()
      .messages({
        'number.min': 'Business price must be greater than or equal to base price'
      }),
    promotionId: Joi.string().optional().allow(null),
    notes: Joi.string().max(500).optional().allow(null, '')
      .messages({
        'string.max': 'Notes must not exceed 500 characters'
      })
  }).min(1).messages({
    'object.min': 'At least one field must be provided for update'
  })
};

// ==================== TICKET TYPES VALIDATION ====================

/**
 * Validation schema for creating a ticket type
 */
export const createTicketTypeSchema = {
  body: Joi.object({
    name: Joi.string().uppercase().valid('ADULT', 'CHILD', 'INFANT', 'STUDENT', 'SENIOR').required()
      .messages({
        'string.empty': 'Ticket type name is required',
        'any.required': 'Ticket type name is required',
        'any.only': 'Invalid ticket type name'
      }),
    pricePercentage: Joi.number().min(0).max(100).required()
      .messages({
        'number.base': 'Price percentage must be a number',
        'number.min': 'Price percentage must be at least 0',
        'number.max': 'Price percentage must not exceed 100',
        'any.required': 'Price percentage is required'
      }),
    minAge: Joi.number().integer().min(0).optional().allow(null)
      .messages({
        'number.base': 'Minimum age must be a number',
        'number.min': 'Minimum age must be at least 0'
      }),
    maxAge: Joi.number().integer().min(0).when('minAge', {
      is: Joi.exist(),
      then: Joi.number().greater(Joi.ref('minAge')),
      otherwise: Joi.number()
    }).optional().allow(null)
      .messages({
        'number.base': 'Maximum age must be a number',
        'number.greater': 'Maximum age must be greater than minimum age'
      }),
    description: Joi.string().max(500).optional().allow(null, '')
      .messages({
        'string.max': 'Description must not exceed 500 characters'
      })
  })
};

/**
 * Validation schema for updating a ticket type
 */
export const updateTicketTypeSchema = {
  body: Joi.object({
    pricePercentage: Joi.number().min(0).max(100).optional()
      .messages({
        'number.min': 'Price percentage must be at least 0',
        'number.max': 'Price percentage must not exceed 100'
      }),
    minAge: Joi.number().integer().min(0).optional().allow(null),
    maxAge: Joi.number().integer().min(0).when('minAge', {
      is: Joi.exist(),
      then: Joi.number().greater(Joi.ref('minAge')),
      otherwise: Joi.number()
    }).optional().allow(null)
      .messages({
        'number.greater': 'Maximum age must be greater than minimum age'
      }),
    description: Joi.string().max(500).optional().allow(null, '')
      .messages({
        'string.max': 'Description must not exceed 500 characters'
      })
  }).min(1).messages({
    'object.min': 'At least one field must be provided for update'
  })
};

// ==================== SEAT INVENTORY VALIDATION ====================

/**
 * Validation schema for updating seat inventory
 */
export const updateSeatInventorySchema = {
  body: Joi.object({
    inventory: Joi.array().items(
      Joi.object({
        ticketClass: Joi.string().uppercase().valid('ECONOMY', 'BUSINESS').required()
          .messages({
            'string.empty': 'Ticket class is required',
            'any.required': 'Ticket class is required',
            'any.only': 'Ticket class must be either ECONOMY or BUSINESS'
          }),
        availableSeats: Joi.number().integer().min(0).required()
          .messages({
            'number.base': 'Available seats must be a number',
            'number.min': 'Available seats must be at least 0',
            'any.required': 'Available seats is required'
          })
      })
    ).min(1).required()
      .messages({
        'array.min': 'At least one inventory item must be provided',
        'any.required': 'Inventory is required'
      })
  })
};

// ==================== STATISTICS VALIDATION ====================

/**
 * Validation schema for route statistics
 */
export const routeStatisticsSchema = {
  query: Joi.object({
    startDate: Joi.date().iso().optional(),
    endDate: Joi.date().iso().min(Joi.ref('startDate')).optional()
      .messages({
        'date.min': 'End date must be after start date'
      }),
    routeId: Joi.string().optional()
  })
};

/**
 * Validation schema for flight statistics
 */
export const flightStatisticsSchema = {
  query: Joi.object({
    startDate: Joi.date().iso().optional(),
    endDate: Joi.date().iso().min(Joi.ref('startDate')).optional()
      .messages({
        'date.min': 'End date must be after start date'
      }),
    routeId: Joi.string().optional(),
    groupBy: Joi.string().valid('day', 'week', 'month').default('day')
      .messages({
        'any.only': 'Group by must be one of: day, week, month'
      })
  })
};
