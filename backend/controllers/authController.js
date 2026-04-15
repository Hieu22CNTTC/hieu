import bcrypt from 'bcrypt';
import crypto from 'crypto';
import prisma from '../config/database.js';
import { generateTokens, verifyRefreshToken } from '../utils/jwt.js';
import { ApiError } from '../middleware/errorHandler.js';
import asyncHandler from '../utils/asyncHandler.js';
import logger from '../utils/logger.js';
import { sendPasswordResetEmail, sendAdminNotificationEmail } from '../utils/emailService.js';

// In-memory store for reset tokens (in production, use Redis or database)
const resetTokens = new Map();

// In-memory store for admin approval tokens
const approvalTokens = new Map();

/**
 * Register new user
 * POST /api/auth/register
 */
export const register = asyncHandler(async (req, res) => {
  const { email, password, fullName, phoneNumber } = req.body;

  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email }
  });

  if (existingUser) {
    throw new ApiError(409, 'Email already registered');
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 10);

  // Create user
  const user = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      fullName,
      phoneNumber,
      role: 'USER', // Default role
      isActive: true
    },
    select: {
      id: true,
      email: true,
      fullName: true,
      phoneNumber: true,
      role: true,
      createdAt: true
    }
  });

  // Generate tokens
  const tokens = generateTokens(user);

  logger.info(`New user registered: ${email}`);

  res.status(201).json({
    success: true,
    message: 'Registration successful',
    data: {
      user,
      ...tokens
    }
  });
});

/**
 * Login user
 * POST /api/auth/login
 */
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Find user
  const user = await prisma.user.findUnique({
    where: { email }
  });

  if (!user) {
    throw new ApiError(401, 'Invalid email or password');
  }

  // Check if user is active
  if (!user.isActive) {
    throw new ApiError(403, 'Account is inactive. Please contact support.');
  }

  // Verify password
  const isPasswordValid = await bcrypt.compare(password, user.password);

  if (!isPasswordValid) {
    throw new ApiError(401, 'Invalid email or password');
  }

  // Update last login
  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() }
  });

  // Generate tokens
  const tokens = generateTokens(user);

  // Remove password from response
  const { password: _, ...userWithoutPassword } = user;

  logger.info(`User logged in: ${email}`);

  res.json({
    success: true,
    message: 'Login successful',
    data: {
      user: userWithoutPassword,
      ...tokens
    }
  });
});

/**
 * Refresh access token
 * POST /api/auth/refresh
 */
export const refreshToken = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;

  // Verify refresh token
  let decoded;
  try {
    decoded = verifyRefreshToken(refreshToken);
  } catch (error) {
    throw new ApiError(401, 'Invalid or expired refresh token');
  }

  // Get user
  const user = await prisma.user.findUnique({
    where: { id: decoded.id },
    select: {
      id: true,
      email: true,
      fullName: true,
      role: true,
      isActive: true
    }
  });

  if (!user) {
    throw new ApiError(401, 'User not found');
  }

  if (!user.isActive) {
    throw new ApiError(403, 'Account is inactive');
  }

  // Generate new tokens
  const tokens = generateTokens(user);

  logger.info(`Token refreshed for user: ${user.email}`);

  res.json({
    success: true,
    message: 'Token refreshed successfully',
    data: tokens
  });
});

/**
 * Get current user info
 * GET /api/auth/me
 */
export const getCurrentUser = asyncHandler(async (req, res) => {
  // User is already attached by authenticate middleware
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: {
      id: true,
      email: true,
      fullName: true,
      phoneNumber: true,
      role: true,
      isActive: true,
      createdAt: true,
      lastLoginAt: true
    }
  });

  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  res.json({
    success: true,
    data: user
  });
});

/**
 * Logout user
 * POST /api/auth/logout
 */
export const logout = asyncHandler(async (req, res) => {
  // Note: In a stateless JWT system, logout is typically handled client-side
  // by removing the tokens. Here we just log the event.
  
  logger.info(`User logged out: ${req.user.email}`);

  res.json({
    success: true,
    message: 'Logout successful'
  });
});

/**
 * Forgot password - Generate approval token and notify admin
 * POST /api/auth/forgot-password
 */
export const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  // Find user
  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
      fullName: true,
      isActive: true
    }
  });

  // Always return success to prevent email enumeration
  const successMessage = 'Yêu cầu đặt lại mật khẩu đã được gửi đến quản trị viên. Bạn sẽ nhận được email xác nhận sau khi admin kiểm tra.';
  
  if (!user || !user.isActive) {
    logger.warn(`Password reset requested for non-existent/inactive email: ${email}`);
    return res.json({
      success: true,
      message: successMessage
    });
  }

  // Generate approval token for admin
  const approvalToken = crypto.randomBytes(32).toString('hex');
  const hashedApprovalToken = crypto.createHash('sha256').update(approvalToken).digest('hex');
  
  // Store approval token with user info (expires in 30 minutes)
  const expiresAt = Date.now() + 30 * 60 * 1000;
  approvalTokens.set(hashedApprovalToken, {
    userId: user.id,
    email: user.email,
    fullName: user.fullName,
    expiresAt
  });

  // Clean up expired approval tokens
  for (const [token, data] of approvalTokens.entries()) {
    if (data.expiresAt < Date.now()) {
      approvalTokens.delete(token);
    }
  }

  // Send notification email to admin
  try {
    await sendAdminNotificationEmail(user.email, user.fullName, approvalToken);
    logger.info(`Admin notification sent for password reset request from: ${email}`);
    
    res.json({
      success: true,
      message: successMessage
    });
  } catch (emailError) {
    logger.error('Failed to send admin notification:', emailError);
    // Clean up approval token if email failed
    approvalTokens.delete(hashedApprovalToken);
    return res.status(500).json({
      success: false,
      message: 'Không thể gửi yêu cầu. Vui lòng thử lại sau.'
    });
  }
});

/**
 * Approve password reset - Admin clicks link from email
 * GET /api/auth/approve-reset/:approvalToken
 */
export const approvePasswordReset = asyncHandler(async (req, res) => {
  const { approvalToken } = req.params;

  // Hash the token
  const hashedToken = crypto.createHash('sha256').update(approvalToken).digest('hex');

  // Find approval request
  const approvalData = approvalTokens.get(hashedToken);

  if (!approvalData) {
    return res.status(400).send(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Link không hợp lệ</title>
        <style>
          body { font-family: Arial, sans-serif; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
          .container { background: white; padding: 40px; border-radius: 10px; box-shadow: 0 10px 40px rgba(0,0,0,0.2); text-align: center; max-width: 500px; }
          h1 { color: #dc2626; margin: 0 0 20px 0; }
          p { color: #6b7280; line-height: 1.6; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>❌ Link không hợp lệ</h1>
          <p>Link xác nhận này không tồn tại hoặc đã hết hạn (30 phút).</p>
          <p>Vui lòng kiểm tra lại email hoặc yêu cầu người dùng gửi lại yêu cầu đặt lại mật khẩu.</p>
        </div>
      </body>
      </html>
    `);
  }

  // Check if token expired
  if (approvalData.expiresAt < Date.now()) {
    approvalTokens.delete(hashedToken);
    return res.status(400).send(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Link đã hết hạn</title>
        <style>
          body { font-family: Arial, sans-serif; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
          .container { background: white; padding: 40px; border-radius: 10px; box-shadow: 0 10px 40px rgba(0,0,0,0.2); text-align: center; max-width: 500px; }
          h1 { color: #dc2626; margin: 0 0 20px 0; }
          p { color: #6b7280; line-height: 1.6; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>⌛ Link đã hết hạn</h1>
          <p>Link xác nhận này đã hết hạn (30 phút).</p>
          <p>Vui lòng yêu cầu người dùng gửi lại yêu cầu đặt lại mật khẩu.</p>
        </div>
      </body>
      </html>
    `);
  }

  // Generate reset token for user
  const resetToken = crypto.randomBytes(32).toString('hex');
  const hashedResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
  
  // Store reset token (15 minutes)
  const resetExpiresAt = Date.now() + 15 * 60 * 1000;
  resetTokens.set(hashedResetToken, {
    userId: approvalData.userId,
    email: approvalData.email,
    expiresAt: resetExpiresAt
  });

  // Send reset email to user
  try {
    await sendPasswordResetEmail(approvalData.email, resetToken);
    logger.info(`Password reset email sent to ${approvalData.email} after admin approval`);
    
    // Delete approval token after successful processing
    approvalTokens.delete(hashedToken);

    // Return success page
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Xác nhận thành công</title>
        <style>
          body { font-family: Arial, sans-serif; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
          .container { background: white; padding: 40px; border-radius: 10px; box-shadow: 0 10px 40px rgba(0,0,0,0.2); text-align: center; max-width: 500px; }
          h1 { color: #22c55e; margin: 0 0 20px 0; }
          .icon { font-size: 64px; margin-bottom: 20px; }
          p { color: #6b7280; line-height: 1.6; margin: 10px 0; }
          .email { background: #f3f4f6; padding: 10px; border-radius: 5px; color: #1e3a8a; font-weight: bold; margin: 20px 0; }
          .note { background: #fef3c7; padding: 15px; border-radius: 5px; margin-top: 20px; border-left: 4px solid #f59e0b; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="icon">✅</div>
          <h1>Đã chấp nhận!</h1>
          <p>Email đặt lại mật khẩu đã được gửi đến:</p>
          <div class="email">${approvalData.email}</div>
          <p>Người dùng sẽ nhận được email với link đặt lại mật khẩu trong vài giây nữa.</p>
          <div class="note">
            <strong>🔒 Bảo mật:</strong> Link reset có hiệu lực trong 15 phút và chỉ sử dụng được 1 lần.
          </div>
          <p style="margin-top: 30px; font-size: 14px; color: #9ca3af;">Bạn có thể đóng trang này.</p>
        </div>
      </body>
      </html>
    `);
  } catch (emailError) {
    logger.error('Failed to send reset email after approval:', emailError);
    return res.status(500).send(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Lỗi gửi email</title>
        <style>
          body { font-family: Arial, sans-serif; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
          .container { background: white; padding: 40px; border-radius: 10px; box-shadow: 0 10px 40px rgba(0,0,0,0.2); text-align: center; max-width: 500px; }
          h1 { color: #dc2626; margin: 0 0 20px 0; }
          p { color: #6b7280; line-height: 1.6; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>❌ Lỗi gửi email</h1>
          <p>Không thể gửi email đặt lại mật khẩu cho người dùng.</p>
          <p>Vui lòng thử lại sau hoặc liên hệ kỹ thuật viên.</p>
        </div>
      </body>
      </html>
    `);
  }
});

/**
 * Reset password with token
 * POST /api/auth/reset-password
 */
export const resetPassword = asyncHandler(async (req, res) => {
  const { token, newPassword } = req.body;

  // Hash the token to match stored version
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
  
  // Find token
  const tokenData = resetTokens.get(hashedToken);

  if (!tokenData) {
    throw new ApiError(400, 'Invalid or expired reset token');
  }

  // Check if token is expired
  if (tokenData.expiresAt < Date.now()) {
    resetTokens.delete(hashedToken);
    throw new ApiError(400, 'Reset token has expired');
  }

  // Hash new password
  const hashedPassword = await bcrypt.hash(newPassword, 10);

  // Update user password
  await prisma.user.update({
    where: { id: tokenData.userId },
    data: { 
      password: hashedPassword,
      updatedAt: new Date()
    }
  });

  // Delete used token
  resetTokens.delete(hashedToken);

  logger.info(`Password reset successful for user: ${tokenData.email}`);

  res.json({
    success: true,
    message: 'Password has been reset successfully. You can now login with your new password.'
  });
});
