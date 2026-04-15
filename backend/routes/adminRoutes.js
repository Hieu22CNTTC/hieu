import express from 'express';
import {
  // Airports Management
  getAllAirports,
  getAirportById,
  createAirport,
  updateAirport,
  deleteAirport,
  
  // Aircraft Management
  getAllAircraft,
  getAircraftById,
  createAircraft,
  updateAircraft,
  deleteAircraft,
  
  // Coupons Management
  getAllCoupons,
  getCouponById,
  createCoupon,
  updateCoupon,
  deleteCoupon,
  toggleCoupon,
  
  // Users Management
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  updateUserRole,
  toggleUser,
  
  // Dashboard & Statistics
  getDashboard,
  getRevenueStatistics,
  getUserStatistics,
  getStatistics
} from '../controllers/adminController.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';
import validateJoi from '../middleware/validateJoi.js';
import {
  // Airport validators
  getAllAirportsSchema,
  createAirportSchema,
  updateAirportSchema,
  
  // Aircraft validators
  getAllAircraftSchema,
  createAircraftSchema,
  updateAircraftSchema,
  
  // Coupon validators
  getAllCouponsSchema,
  createCouponSchema,
  updateCouponSchema,
  
  // User validators
  getAllUsersSchema,
  createUserSchema,
  updateUserSchema,
  updateUserRoleSchema,
  
  // Statistics validators
  revenueStatisticsSchema
} from '../validators/adminValidator.js';

const router = express.Router();

// All routes require authentication and ADMIN role
router.use(authenticate);
router.use(requireAdmin);

// ==================== AIRPORTS MANAGEMENT ====================

/**
 * @route   GET /api/admin/airports
 * @desc    Get all airports with filters and pagination
 * @access  Private (ADMIN)
 */
router.get('/airports', validateJoi(getAllAirportsSchema), getAllAirports);

/**
 * @route   GET /api/admin/airports/:id
 * @desc    Get airport by ID
 * @access  Private (ADMIN)
 */
router.get('/airports/:id', getAirportById);

/**
 * @route   POST /api/admin/airports
 * @desc    Create new airport
 * @access  Private (ADMIN)
 */
router.post('/airports', validateJoi(createAirportSchema), createAirport);

/**
 * @route   PUT /api/admin/airports/:id
 * @desc    Update airport
 * @access  Private (ADMIN)
 */
router.put('/airports/:id', validateJoi(updateAirportSchema), updateAirport);

/**
 * @route   DELETE /api/admin/airports/:id
 * @desc    Delete airport
 * @access  Private (ADMIN)
 */
router.delete('/airports/:id', deleteAirport);

// ==================== AIRCRAFT MANAGEMENT ====================

/**
 * @route   GET /api/admin/aircraft
 * @desc    Get all aircraft with pagination
 * @access  Private (ADMIN)
 */
router.get('/aircraft', validateJoi(getAllAircraftSchema), getAllAircraft);
router.get('/aircrafts', validateJoi(getAllAircraftSchema), getAllAircraft); // Alias

/**
 * @route   GET /api/admin/aircraft/:id
 * @desc    Get aircraft by ID
 * @access  Private (ADMIN)
 */
router.get('/aircraft/:id', getAircraftById);
router.get('/aircrafts/:id', getAircraftById); // Alias

/**
 * @route   POST /api/admin/aircraft
 * @desc    Create new aircraft
 * @access  Private (ADMIN)
 */
router.post('/aircraft', validateJoi(createAircraftSchema), createAircraft);
router.post('/aircrafts', validateJoi(createAircraftSchema), createAircraft); // Alias

/**
 * @route   PUT /api/admin/aircraft/:id
 * @desc    Update aircraft
 * @access  Private (ADMIN)
 */
router.put('/aircraft/:id', validateJoi(updateAircraftSchema), updateAircraft);
router.put('/aircrafts/:id', validateJoi(updateAircraftSchema), updateAircraft); // Alias

/**
 * @route   DELETE /api/admin/aircraft/:id
 * @desc    Delete aircraft
 * @access  Private (ADMIN)
 */
router.delete('/aircraft/:id', deleteAircraft);
router.delete('/aircrafts/:id', deleteAircraft); // Alias

// ==================== COUPONS MANAGEMENT ====================

/**
 * @route   GET /api/admin/coupons
 * @desc    Get all coupons with filters
 * @access  Private (ADMIN)
 */
router.get('/coupons', validateJoi(getAllCouponsSchema), getAllCoupons);

/**
 * @route   GET /api/admin/coupons/:id
 * @desc    Get coupon by ID
 * @access  Private (ADMIN)
 */
router.get('/coupons/:id', getCouponById);

/**
 * @route   POST /api/admin/coupons
 * @desc    Create new coupon
 * @access  Private (ADMIN)
 */
router.post('/coupons', validateJoi(createCouponSchema), createCoupon);

/**
 * @route   PUT /api/admin/coupons/:id
 * @desc    Update coupon
 * @access  Private (ADMIN)
 */
router.put('/coupons/:id', validateJoi(updateCouponSchema), updateCoupon);

/**
 * @route   DELETE /api/admin/coupons/:id
 * @desc    Delete coupon
 * @access  Private (ADMIN)
 */
router.delete('/coupons/:id', deleteCoupon);

/**
 * @route   PATCH /api/admin/coupons/:id/toggle
 * @desc    Toggle coupon active status
 * @access  Private (ADMIN)
 */
router.patch('/coupons/:id/toggle', toggleCoupon);

// ==================== USERS MANAGEMENT ====================

/**
 * @route   GET /api/admin/users
 * @desc    Get all users with filters
 * @access  Private (ADMIN)
 */
router.get('/users', validateJoi(getAllUsersSchema), getAllUsers);

/**
 * @route   GET /api/admin/users/:id
 * @desc    Get user by ID
 * @access  Private (ADMIN)
 */
router.get('/users/:id', getUserById);

/**
 * @route   POST /api/admin/users
 * @desc    Create new user
 * @access  Private (ADMIN)
 */
router.post('/users', validateJoi(createUserSchema), createUser);

/**
 * @route   PUT /api/admin/users/:id
 * @desc    Update user
 * @access  Private (ADMIN)
 */
router.put('/users/:id', validateJoi(updateUserSchema), updateUser);

/**
 * @route   DELETE /api/admin/users/:id
 * @desc    Delete user
 * @access  Private (ADMIN)
 */
router.delete('/users/:id', deleteUser);

/**
 * @route   PUT /api/admin/users/:id/role
 * @desc    Update user role
 * @access  Private (ADMIN)
 */
router.put('/users/:id/role', validateJoi(updateUserRoleSchema), updateUserRole);

/**
 * @route   PATCH /api/admin/users/:id/toggle
 * @desc    Toggle user active status
 * @access  Private (ADMIN)
 */
router.patch('/users/:id/toggle', toggleUser);

// ==================== DASHBOARD & STATISTICS ====================

/**
 * @route   GET /api/admin/dashboard
 * @desc    Get dashboard overview
 * @access  Private (ADMIN)
 */
router.get('/dashboard', getDashboard);

/**
 * @route   GET /api/admin/statistics
 * @desc    Get statistics with date range
 * @access  Private (ADMIN)
 */
router.get('/statistics', getStatistics);

/**
 * @route   GET /api/admin/statistics/revenue
 * @desc    Get revenue statistics
 * @access  Private (ADMIN)
 */
router.get('/statistics/revenue', validateJoi(revenueStatisticsSchema), getRevenueStatistics);

/**
 * @route   GET /api/admin/statistics/users
 * @desc    Get user statistics
 * @access  Private (ADMIN)
 */
router.get('/statistics/users', getUserStatistics);

export default router;

