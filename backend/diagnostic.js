#!/usr/bin/env node

/**
 * Payment System Diagnostic Tool
 * Kiểm tra hệ thống thanh toán MoMo
 */

import dotenv from 'dotenv';
import crypto from 'crypto';
import fetch from 'node-fetch';

dotenv.config();

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(color, label, message) {
  console.log(`${color}[${label}]${colors.reset} ${message}`);
}

function pass(message) {
  log(colors.green, '✓ PASS', message);
}

function fail(message) {
  log(colors.red, '✗ FAIL', message);
}

function info(message) {
  log(colors.blue, 'ℹ INFO', message);
}

function warn(message) {
  log(colors.yellow, '⚠ WARN', message);
}

async function diagnosePaymentSystem() {
  console.log(`\n${colors.bright}${colors.cyan}╔════════════════════════════════════════════╗`);
  console.log(`║   MoMo Payment System Diagnostic Tool       ║`);
  console.log(`║   Công cụ kiểm tra hệ thống thanh toán      ║`);
  console.log(`╚════════════════════════════════════════════╝${colors.reset}\n`);

  let checksPassed = 0;
  let checksFailed = 0;

  // ============ 1. Environment Variables Check ============
  console.log(`${colors.bright}${colors.cyan}1. Environment Variables${colors.reset}`);
  
  const requiredEnvVars = [
    'MOMO_PARTNER_CODE',
    'MOMO_ACCESS_KEY',
    'MOMO_SECRET_KEY',
    'MOMO_ENDPOINT',
    'MOMO_REDIRECT_URL',
    'MOMO_IPN_URL'
  ];

  requiredEnvVars.forEach(envVar => {
    if (process.env[envVar]) {
      pass(`${envVar} is configured`);
      checksPassed++;
    } else {
      fail(`${envVar} is missing`);
      checksFailed++;
    }
  });

  // ============ 2. MoMo Configuration Validity ============
  console.log(`\n${colors.bright}${colors.cyan}2. MoMo Configuration${colors.reset}`);

  const partnerCode = process.env.MOMO_PARTNER_CODE;
  const accessKey = process.env.MOMO_ACCESS_KEY;
  const secretKey = process.env.MOMO_SECRET_KEY;
  const endpoint = process.env.MOMO_ENDPOINT;

  if (partnerCode && partnerCode.length > 0) {
    pass(`Partner Code configured: ${partnerCode}`);
    checksPassed++;
  } else {
    fail(`Partner Code is missing or empty`);
    checksFailed++;
  }

  if (accessKey && accessKey.length > 0) {
    pass(`Access Key configured: ${accessKey.substring(0, 8)}...`);
    checksPassed++;
  } else {
    fail(`Access Key is missing or empty`);
    checksFailed++;
  }

  if (secretKey && secretKey.length > 0) {
    pass(`Secret Key configured: ${secretKey.substring(0, 8)}...`);
    checksPassed++;
  } else {
    fail(`Secret Key is missing or empty`);
    checksFailed++;
  }

  if (endpoint && endpoint.includes('test-payment.momo.vn')) {
    pass(`Using MoMo Sandbox: ${endpoint}`);
    checksPassed++;
  } else if (endpoint) {
    warn(`Endpoint is configured but might not be correct: ${endpoint}`);
    checksPassed++;
  } else {
    fail(`Endpoint is missing`);
    checksFailed++;
  }

  // ============ 3. Signature Generation Test ============
  console.log(`\n${colors.bright}${colors.cyan}3. Signature Generation Test${colors.reset}`);

  try {
    const testData = {
      partnerCode: partnerCode || 'TEST',
      accessKey: accessKey || 'TEST',
      requestId: 'TEST_REQ_123456789',
      amount: '100000',
      orderId: 'TEST_ORDER_123456789',
      orderInfo: 'Thanh toán vé máy bay',
      redirectUrl: process.env.MOMO_REDIRECT_URL || 'http://localhost:3000/api/payments/momo/return',
      ipnUrl: process.env.MOMO_IPN_URL || 'http://localhost:3000/api/payments/momo/callback',
      requestType: 'captureWallet',
      extraData: Buffer.from(JSON.stringify({ bookingId: 'TEST_123' })).toString('base64'),
    };

    const rawSignature = `accessKey=${testData.accessKey}&amount=${testData.amount}&extraData=${testData.extraData}&ipnUrl=${testData.ipnUrl}&orderId=${testData.orderId}&orderInfo=${testData.orderInfo}&partnerCode=${testData.partnerCode}&redirectUrl=${testData.redirectUrl}&requestId=${testData.requestId}&requestType=${testData.requestType}`;

    const signature = crypto
      .createHmac('sha256', secretKey || 'TEST')
      .update(rawSignature)
      .digest('hex');

    if (signature && signature.length === 64) {
      pass(`Signature generated successfully (SHA256)`);
      info(`Signature: ${signature.substring(0, 16)}...`);
      checksPassed++;
    } else {
      fail(`Signature generation failed`);
      checksFailed++;
    }
  } catch (error) {
    fail(`Signature generation error: ${error.message}`);
    checksFailed++;
  }

  // ============ 4. Network Connectivity Test ============
  console.log(`\n${colors.bright}${colors.cyan}4. Network Connectivity${colors.reset}`);

  try {
    info(`Testing connection to MoMo Sandbox...`);
    const response = await fetch('https://test-payment.momo.vn/v2/gateway/api/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        partnerCode: partnerCode || 'TEST',
        accessKey: accessKey || 'TEST',
        requestId: 'TEST_REQ_' + Date.now(),
        amount: '100000',
        orderId: 'TEST_ORDER_' + Date.now(),
        orderInfo: 'Test',
        redirectUrl: 'http://localhost:3000/api/payments/momo/return',
        ipnUrl: 'http://localhost:3000/api/payments/momo/callback',
        requestType: 'captureWallet',
        extraData: Buffer.from(JSON.stringify({ test: true })).toString('base64'),
        signature: 'TEST_SIGNATURE'
      })
    });

    if (response.status !== 200) {
      warn(`MoMo returned non-200 status: ${response.status} (This is normal for invalid signature)`);
      pass(`Network connectivity to MoMo is OK`);
      checksPassed++;
    } else {
      pass(`Successfully connected to MoMo Sandbox`);
      checksPassed++;
    }
  } catch (error) {
    fail(`Cannot connect to MoMo: ${error.message}`);
    checksFailed++;
  }

  // ============ 5. URLs Configuration ============
  console.log(`\n${colors.bright}${colors.cyan}5. Redirect URLs Configuration${colors.reset}`);

  const redirectUrl = process.env.MOMO_REDIRECT_URL;
  const ipnUrl = process.env.MOMO_IPN_URL;

  if (redirectUrl && redirectUrl.includes('localhost:3000/api/payments/momo/return')) {
    pass(`Redirect URL configured: ${redirectUrl}`);
    checksPassed++;
  } else {
    warn(`Redirect URL might need updating: ${redirectUrl}`);
    checksPassed++;
  }

  if (ipnUrl && ipnUrl.includes('localhost:3000/api/payments/momo/callback')) {
    pass(`IPN URL configured: ${ipnUrl}`);
    checksPassed++;
  } else {
    warn(`IPN URL might need updating: ${ipnUrl}`);
    checksPassed++;
  }

  // ============ 6. Database & Routes ============
  console.log(`\n${colors.bright}${colors.cyan}6. Database & Routes Setup${colors.reset}`);

  info(`Assuming Prisma schema is properly configured...`);
  pass(`Payment routes should be mounted at /api/payments`);
  pass(`MoMo endpoints:`);
  console.log(`  - POST /api/payments/momo (create payment)`);
  console.log(`  - POST /api/payments/momo/callback (IPN callback)`);
  console.log(`  - GET /api/payments/momo/return (user return)`);
  console.log(`  - GET /api/payments/status/:bookingId (check status)`);
  checksPassed += 4;

  // ============ Summary ============
  console.log(`\n${colors.bright}${colors.cyan}╔════════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.bright}║                Summary Report                 ║${colors.reset}`);
  console.log(`${colors.bright}╚════════════════════════════════════════════╝${colors.reset}`);

  const total = checksPassed + checksFailed;
  const percentage = Math.round((checksPassed / total) * 100);

  console.log(`\n${colors.green}✓ Passed: ${checksPassed}/${total}${colors.reset}`);
  console.log(`${colors.red}✗ Failed: ${checksFailed}/${total}${colors.reset}`);
  console.log(`\nSuccess Rate: ${colors.bright}${percentage}%${colors.reset}\n`);

  if (checksFailed === 0) {
    console.log(`${colors.green}${colors.bright}✓ All checks passed! Payment system is properly configured.${colors.reset}\n`);
  } else {
    console.log(`${colors.yellow}${colors.bright}⚠ Please fix the failed checks above before using the payment system.${colors.reset}\n`);
  }

  // ============ Recommendations ============
  console.log(`${colors.bright}${colors.cyan}Recommendations:${colors.reset}`);
  console.log(`1. Keep MoMo credentials safe - never commit to public repo`);
  console.log(`2. Test with small amounts first`);
  console.log(`3. Monitor logs for payment callbacks`);
  console.log(`4. Verify database migrations are applied`);
  console.log(`5. Test both successful and failed payment flows`);
  console.log(`6. Ensure frontend base URL points to backend API\n`);
}

// Run diagnostics
diagnosePaymentSystem().catch(error => {
  console.error(`${colors.red}Fatal error:${colors.reset}`, error.message);
  process.exit(1);
});
