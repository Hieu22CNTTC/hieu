/**
 * MoMo Payment API Integration
 * Connect to real MoMo Payment Gateway
 */

import logger from '../utils/logger.js';

/**
 * Create MoMo payment request
 * Calls real MoMo API endpoint
 */
export const fetchMoMoPaymentUrl = async (requestBody, endpoint) => {
  logger.info('Connecting to MoMo API...');
  logger.info(`MoMo Endpoint: ${endpoint}`);
  logger.info(`MoMo Request Body:`, JSON.stringify(requestBody, null, 2));
  
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(requestBody)
  });

  const responseText = await response.text();
  
  logger.info(`MoMo API Status: ${response.status}`);
  logger.info(`MoMo API Response Text: ${responseText}`);
  
  try {
    const momoResponse = JSON.parse(responseText);
    logger.info('✅ Connected to real MoMo API');
    logger.info(`MoMo Response:`, JSON.stringify(momoResponse, null, 2));
    return { success: true, data: momoResponse };
  } catch (parseError) {
    logger.error('❌ Failed to parse MoMo response:', responseText);
    throw new Error('Invalid response from MoMo');
  }
};
