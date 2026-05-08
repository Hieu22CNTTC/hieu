import dotenv from 'dotenv';
import { connectDatabase, disconnectDatabase } from '../config/database.js';
import logger from '../utils/logger.js';
import { crawlAndStoreFlightsFromHtml } from '../services/htmlFlightCrawlerService.js';

dotenv.config();

const run = async () => {
  try {
    process.env.CRAWL_SOURCE_MODE = process.env.CRAWL_SOURCE_MODE || 'routes';
    process.env.CRAWL_SOURCE_URL = process.env.CRAWL_SOURCE_URL || 'https://r.jina.ai/http://www.airportia.com/vietnam/noi-bai-international-airport/routes/';
    await connectDatabase();
    const result = await crawlAndStoreFlightsFromHtml();
    logger.info(`[CrawlOnce] imported=${result.imported || 0}, skipped=${result.skipped || 0}`);
  } catch (error) {
    logger.error(`[CrawlOnce] Failed: ${error.message}`);
    process.exitCode = 1;
  } finally {
    await disconnectDatabase();
  }
};

run();
