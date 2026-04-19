import dotenv from 'dotenv';
import { connectDatabase, disconnectDatabase } from '../config/database.js';
import logger from '../utils/logger.js';
import { crawlAndStoreFlightsFromHtml } from '../services/htmlFlightCrawlerService.js';

dotenv.config();

const AIRPORTS = [
  {
    code: 'HAN',
    url: 'https://r.jina.ai/http://www.airportia.com/vietnam/noi-bai-international-airport/departures/',
  },
  {
    code: 'SGN',
    url: 'https://r.jina.ai/http://www.airportia.com/vietnam/tan-son-nhat-international-airport/departures/',
  },
  {
    code: 'DAD',
    url: 'https://r.jina.ai/http://www.airportia.com/vietnam/da-nang-international-airport/departures/',
  },
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const run = async () => {
  await connectDatabase();

  let totalImported = 0;
  let totalSkipped = 0;

  for (const airport of AIRPORTS) {
    logger.info(`[CrawlAll] Starting crawl for ${airport.code} from ${airport.url}`);
    process.env.CRAWL_SOURCE_URL = airport.url;
    process.env.CRAWL_ORIGIN_CODE = airport.code;
    process.env.CRAWL_SOURCE_MODE = 'markdown';

    try {
      const result = await crawlAndStoreFlightsFromHtml();
      const imported = result.imported || 0;
      const skipped = result.skipped || 0;
      totalImported += imported;
      totalSkipped += skipped;
      logger.info(`[CrawlAll] ${airport.code}: imported=${imported}, skipped=${skipped}`);
    } catch (err) {
      logger.error(`[CrawlAll] ${airport.code} failed: ${err.message}`);
    }

    // Delay between airports to avoid rate limiting
    if (airport !== AIRPORTS[AIRPORTS.length - 1]) {
      logger.info('[CrawlAll] Waiting 3s before next airport...');
      await sleep(3000);
    }
  }

  logger.info(`[CrawlAll] Done. Total imported=${totalImported}, skipped=${totalSkipped}`);
  await disconnectDatabase();
};

run().catch((err) => {
  logger.error(`[CrawlAll] Fatal: ${err.message}`);
  process.exit(1);
});
