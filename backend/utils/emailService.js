import nodemailer from 'nodemailer';
import logger from './logger.js';

// Create transporter with Gmail
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER, // Gmail của bạn
    pass: process.env.EMAIL_PASSWORD, // App Password (không phải mật khẩu Gmail thường)
  },
});

/**
 * Send admin notification email when user requests password reset
 * @param {string} userEmail - User's email who requested reset
 * @param {string} userName - User's full name
 * @param {string} approvalToken - Token for admin to approve the request
 */
export const sendAdminNotificationEmail = async (userEmail, userName, approvalToken) => {
  const adminEmail = 'duongtrunghieu3004@gmail.com';
  const approvalUrl = `${process.env.BACKEND_URL || 'http://localhost:3000'}/api/auth/approve-reset/${approvalToken}`;
  
  const mailOptions = {
    from: {
      name: 'TrungHieuFlight System',
      address: process.env.EMAIL_USER,
    },
    to: adminEmail,
    subject: '🔐 Yêu cầu đặt lại mật khẩu - Cần xác nhận',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #dc2626 0%, #ef4444 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .header h1 { margin: 0; font-size: 28px; }
          .content { background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; border-top: none; }
          .info-box { background: white; border: 2px solid #e5e7eb; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .info-row { display: flex; padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
          .info-row:last-child { border-bottom: none; }
          .info-label { font-weight: bold; color: #6b7280; width: 120px; }
          .info-value { color: #111827; flex: 1; }
          .button { display: inline-block; background: #22c55e; color: white !important; padding: 15px 40px; text-decoration: none; border-radius: 8px; margin: 20px 0; font-weight: bold; font-size: 16px; }
          .button:hover { background: #16a34a; }
          .warning { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 4px; }
          .footer { background: #f3f4f6; padding: 20px; text-align: center; font-size: 12px; color: #6b7280; border-radius: 0 0 10px 10px; border: 1px solid #e5e7eb; border-top: none; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔐 XÁC NHẬN YÊU CẦU</h1>
            <p>Đặt lại mật khẩu cho người dùng</p>
          </div>
          
          <div class="content">
            <p><strong>Chào Admin,</strong></p>
            <p>Có một yêu cầu đặt lại mật khẩu mới từ người dùng. Vui lòng xác minh và phê duyệt.</p>
            
            <div class="info-box">
              <h3 style="margin-top: 0; color: #1e3a8a;">📋 Thông tin người dùng</h3>
              <div class="info-row">
                <div class="info-label">Họ tên:</div>
                <div class="info-value">${userName || 'N/A'}</div>
              </div>
              <div class="info-row">
                <div class="info-label">Email:</div>
                <div class="info-value">${userEmail}</div>
              </div>
              <div class="info-row">
                <div class="info-label">Thời gian:</div>
                <div class="info-value">${new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })}</div>
              </div>
            </div>
            
            <p>Nếu bạn xác nhận đây là yêu cầu hợp lệ, vui lòng nhấn nút bên dưới để gửi link đặt lại mật khẩu cho người dùng:</p>
            
            <div style="text-align: center;">
              <a href="${approvalUrl}" class="button">✅ Chấp nhận & Gửi link reset</a>
            </div>
            
            <div class="warning">
              <strong>⚠️ Lưu ý:</strong>
              <ul style="margin: 10px 0 0 0; padding-left: 20px;">
                <li>Link chấp nhận có hiệu lực trong <strong>30 phút</strong></li>
                <li>Sau khi chấp nhận, hệ thống sẽ tự động gửi email reset cho người dùng</li>
                <li>Nếu không phải yêu cầu hợp lệ, vui lòng bỏ qua email này</li>
              </ul>
            </div>
          </div>
          
          <div class="footer">
            <p style="margin: 0;"><strong>TrungHieuFlight</strong></p>
            <p style="margin: 5px 0 0 0;">Hệ thống đặt vé máy bay trực tuyến</p>
            <p style="margin: 10px 0 0 0; font-size: 11px;">Email này được gửi tự động, vui lòng không reply</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
YÊU CẦU ĐẶT LẠI MẬT KHẨU

Thông tin người dùng:
- Họ tên: ${userName || 'N/A'}
- Email: ${userEmail}
- Thời gian: ${new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })}

Để chấp nhận và gửi link reset cho người dùng, vui lòng truy cập:
${approvalUrl}

Link có hiệu lực trong 30 phút.

---
TrungHieuFlight - Hệ thống đặt vé máy bay
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    logger.info(`Admin notification email sent for user: ${userEmail}`);
  } catch (error) {
    logger.error('Failed to send admin notification:', error);
    throw new Error('Không thể gửi email thông báo cho admin');
  }
};

/**
 * Send password reset email
 * @param {string} to - Recipient email
 * @param {string} resetToken - Reset token (unencrypted)
 */
export const sendPasswordResetEmail = async (to, resetToken) => {
  const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${resetToken}`;
  
  const mailOptions = {
    from: {
      name: 'TrungHieuFlight',
      address: process.env.EMAIL_USER,
    },
    to: to,
    subject: 'Đặt lại mật khẩu - TrungHieuFlight',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .header h1 { margin: 0; font-size: 28px; }
          .header p { margin: 5px 0 0 0; font-size: 16px; }
          .content { background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; border-top: none; }
          .button { display: inline-block; background: #3b82f6; color: white !important; padding: 15px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; font-weight: bold; }
          .button:hover { background: #2563eb; }
          .link-box { background: #e5e7eb; padding: 15px; word-break: break-all; font-size: 13px; border-radius: 5px; margin: 15px 0; }
          .footer { background: #f3f4f6; padding: 20px; text-align: center; font-size: 12px; color: #6b7280; border-radius: 0 0 10px 10px; border: 1px solid #e5e7eb; border-top: none; }
          .warning { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 4px; }
          .warning strong { color: #d97706; }
          .warning ul { margin: 10px 0 0 0; padding-left: 20px; }
          .warning li { margin: 5px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✈️ TrungHieuFlight</h1>
            <p>Đặt lại mật khẩu</p>
          </div>
          
          <div class="content">
            <p>Xin chào,</p>
            <p>Bạn đã yêu cầu đặt lại mật khẩu cho tài khoản <strong>${to}</strong> tại TrungHieuFlight.</p>
            
            <p>Vui lòng nhấn vào nút bên dưới để đặt lại mật khẩu:</p>
            
            <div style="text-align: center;">
              <a href="${resetUrl}" class="button">Đặt lại mật khẩu</a>
            </div>
            
            <p>Hoặc copy link sau vào trình duyệt:</p>
            <div class="link-box">
              ${resetUrl}
            </div>
            
            <div class="warning">
              <strong>⚠️ Lưu ý quan trọng:</strong>
              <ul>
                <li>Link này chỉ có hiệu lực trong <strong>15 phút</strong></li>
                <li>Link chỉ sử dụng được <strong>1 lần duy nhất</strong></li>
                <li>Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này</li>
              </ul>
            </div>
            
            <p>Cảm ơn bạn đã sử dụng dịch vụ của chúng tôi!</p>
            <p><strong>Đội ngũ TrungHieuFlight</strong></p>
          </div>
          
          <div class="footer">
            <p>© ${new Date().getFullYear()} TrungHieuFlight Airlines. All rights reserved.</p>
            <p>459 Tôn Đức Thắng, Liên Chiểu, Đà Nẵng</p>
            <p>Hotline: 1900 1234 | Email: support@trunghieuflight.vn</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
Xin chào,

Bạn đã yêu cầu đặt lại mật khẩu cho tài khoản ${to} tại TrungHieuFlight.

Vui lòng truy cập link sau để đặt lại mật khẩu:
${resetUrl}

Lưu ý:
- Link này chỉ có hiệu lực trong 15 phút
- Link chỉ sử dụng được 1 lần duy nhất
- Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này

Cảm ơn bạn đã sử dụng dịch vụ của chúng tôi!
Đội ngũ TrungHieuFlight

---
© ${new Date().getFullYear()} TrungHieuFlight Airlines
459 Tôn Đức Thắng, Liên Chiểu, Đà Nẵng
Hotline: 1900 1234
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    logger.info(`Password reset email sent to ${to}`);
    return true;
  } catch (error) {
    logger.error('Error sending email:', error);
    throw new Error('Không thể gửi email. Vui lòng thử lại sau.');
  }
};

/**
 * Verify email configuration on startup
 */
export const verifyEmailConfig = async () => {
  // Check if email credentials are configured
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
    logger.warn('⚠️  Email service not configured');
    logger.warn('⚠️  Please set EMAIL_USER and EMAIL_PASSWORD in .env');
    logger.warn('⚠️  Email features will not work until configured');
    return false;
  }

  try {
    await transporter.verify();
    logger.info('✅ Email service is ready');
    logger.info(`📧 Sending emails from: ${process.env.EMAIL_USER}`);
    return true;
  } catch (error) {
    logger.error('❌ Email service configuration error:', error.message);
    logger.warn('⚠️  Email features will not work. Please check your EMAIL_USER and EMAIL_PASSWORD');
    return false;
  }
};
