import express from 'express';
import {
  // Routes Management
  getAllRoutes,
  getRouteById,
  createRoute,
  updateRoute,
  deleteRoute,
  
  // Flights Management
  getAllFlights,
  getFlightById,
  createFlight,
  updateFlight,
  deleteFlight,
  
  // Ticket Types Management
  getAllTicketTypes,
  getTicketTypeById,
  createTicketType,
  updateTicketType,
  
  // Seat Inventory Management
  getFlightSeatInventory,
  updateFlightSeatInventory,
  
  // Statistics & Reports
  getRouteStatistics,
  getFlightStatistics
} from '../controllers/managerController.js';
import { authenticate, requireManager } from '../middleware/auth.js';
import validateJoi from '../middleware/validateJoi.js';
import {
  // Route validators
  getAllRoutesSchema,
  createRouteSchema,
  updateRouteSchema,
  
  // Flight validators
  getAllFlightsSchema,
  createFlightSchema,
  updateFlightSchema,
  
  // Ticket type validators
  createTicketTypeSchema,
  updateTicketTypeSchema,
  
  // Seat inventory validators
  updateSeatInventorySchema,
  
  // Statistics validators
  routeStatisticsSchema,
  flightStatisticsSchema
} from '../validators/managerValidator.js';

const router = express.Router();

// All routes require authentication and MANAGER role (or higher)
router.use(authenticate);
router.use(requireManager);

// ==================== ROUTES MANAGEMENT ====================

/**
 * @route   GET /api/manager/routes
 * @desc    Get all routes with filters and pagination
 * @access  Private (MANAGER, ADMIN)
 */
router.get('/routes', validateJoi(getAllRoutesSchema), getAllRoutes);

/**
 * @route   GET /api/manager/routes/:id
 * @desc    Get route details by ID
 * @access  Private (MANAGER, ADMIN)
 */
router.get('/routes/:id', getRouteById);

/**
 * @route   POST /api/manager/routes
 * @desc    Create new route
 * @access  Private (MANAGER, ADMIN)
 */
router.post('/routes', validateJoi(createRouteSchema), createRoute);

/**
 * @route   PUT /api/manager/routes/:id
 * @desc    Update route
 * @access  Private (MANAGER, ADMIN)
 */
router.put('/routes/:id', validateJoi(updateRouteSchema), updateRoute);

/**
 * @route   DELETE /api/manager/routes/:id
 * @desc    Delete route
 * @access  Private (MANAGER, ADMIN)
 */
router.delete('/routes/:id', deleteRoute);

// ==================== FLIGHTS MANAGEMENT ====================

/**
 * @route   GET /api/manager/flights
 * @desc    Get all flights with filters and pagination
 * @access  Private (MANAGER, ADMIN)
 */
router.get('/flights', validateJoi(getAllFlightsSchema), getAllFlights);

/**
 * @route   GET /api/manager/flights/:id
 * @desc    Get flight details by ID
 * @access  Private (MANAGER, ADMIN)
 */
router.get('/flights/:id', getFlightById);

/**
 * @route   POST /api/manager/flights
 * @desc    Create new flight
 * @access  Private (MANAGER, ADMIN)
 */
router.post('/flights', validateJoi(createFlightSchema), createFlight);

/**
 * @route   PUT /api/manager/flights/:id
 * @desc    Update flight
 * @access  Private (MANAGER, ADMIN)
 */
router.put('/flights/:id', validateJoi(updateFlightSchema), updateFlight);

/**
 * @route   DELETE /api/manager/flights/:id
 * @desc    Delete flight
 * @access  Private (MANAGER, ADMIN)
 */
router.delete('/flights/:id', deleteFlight);

// ==================== SEAT INVENTORY MANAGEMENT ====================

/**
 * @route   GET /api/manager/flights/:flightId/seats
 * @desc    Get seat inventory for a flight
 * @access  Private (MANAGER, ADMIN)
 */
router.get('/flights/:flightId/seats', getFlightSeatInventory);

/**
 * @route   PUT /api/manager/flights/:flightId/seats
 * @desc    Update seat inventory for a flight
 * @access  Private (MANAGER, ADMIN)
 */
router.put('/flights/:flightId/seats', validateJoi(updateSeatInventorySchema), updateFlightSeatInventory);

// ==================== TICKET TYPES MANAGEMENT ====================

/**
 * @route   GET /api/manager/ticket-types
 * @desc    Get all ticket types
 * @access  Private (MANAGER, ADMIN)
 */
router.get('/ticket-types', getAllTicketTypes);

/**
 * @route   GET /api/manager/ticket-types/:id
 * @desc    Get ticket type by ID
 * @access  Private (MANAGER, ADMIN)
 */
router.get('/ticket-types/:id', getTicketTypeById);

/**
 * @route   POST /api/manager/ticket-types
 * @desc    Create new ticket type
 * @access  Private (MANAGER, ADMIN)
 */
router.post('/ticket-types', validateJoi(createTicketTypeSchema), createTicketType);

/**
 * @route   PUT /api/manager/ticket-types/:id
 * @desc    Update ticket type
 * @access  Private (MANAGER, ADMIN)
 */
router.put('/ticket-types/:id', validateJoi(updateTicketTypeSchema), updateTicketType);

// ==================== STATISTICS & REPORTS ====================

/**
 * @route   GET /api/manager/statistics/routes
 * @desc    Get route performance statistics
 * @access  Private (MANAGER, ADMIN)
 */
router.get('/statistics/routes', validateJoi(routeStatisticsSchema), getRouteStatistics);

/**
 * @route   GET /api/manager/statistics/flights
 * @desc    Get flight statistics
 * @access  Private (MANAGER, ADMIN)
 */
router.get('/statistics/flights', validateJoi(flightStatisticsSchema), getFlightStatistics);

export default router;

