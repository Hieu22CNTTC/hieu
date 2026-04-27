import axios from 'axios';
import prisma from '../config/database.js';
import logger from '../utils/logger.js';

const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 13_6) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36'
];

const defaultSelectorConfig = {
  item: '.flightsTable tr.flightsTable-parentFlight',
  flightNumber: 'td.flightsTable-number a',
  destinationCell: 'td:nth-child(2)',
  scheduledTime: 'td:nth-child(4)',
  basePrice: '.price'
};

const normalizeAirportCode = (value = '') => {
  const text = String(value).trim().toUpperCase();
  if (!text) return '';
  const parts = text.split('-');
  return parts[parts.length - 1];
};

const parsePrice = (value) => {
  if (value === undefined || value === null) return 0;
  const digits = String(value).replace(/[^0-9]/g, '');
  return digits ? Number(digits) : 0;
};

const extractIataCode = (value = '') => {
  const matches = String(value).toUpperCase().match(/[A-Z]{3}/g);
  if (!matches || matches.length === 0) return '';
  return matches[matches.length - 1];
};

const MONTH_INDEX = {
  jan: 0,
  feb: 1,
  mar: 2,
  apr: 3,
  may: 4,
  jun: 5,
  jul: 6,
  aug: 7,
  sep: 8,
  oct: 9,
  nov: 10,
  dec: 11
};

const parseDepartureDateTime = (value, crawlDate) => {
  if (!value) return null;

  const trimmed = String(value).trim();
  const referenceDate = crawlDate ? new Date(crawlDate) : new Date();

  const monthDayMatch = trimmed.match(/^([A-Za-z]{3,9})\s+(\d{1,2})(?:,?\s+(\d{4}))?(?:\s+(\d{1,2}):(\d{2}))?$/);
  if (monthDayMatch && !Number.isNaN(referenceDate.getTime())) {
    const [, monthText, dayStr, yearStr, hourStr = '0', minuteStr = '0'] = monthDayMatch;
    const monthIndex = MONTH_INDEX[monthText.slice(0, 3).toLowerCase()];

    if (monthIndex !== undefined) {
      return new Date(
        Number(yearStr || referenceDate.getFullYear()),
        monthIndex,
        Number(dayStr),
        Number(hourStr),
        Number(minuteStr),
        0,
        0
      );
    }
  }

  const fullDate = new Date(trimmed);
  if (!Number.isNaN(fullDate.getTime())) return fullDate;

  const match = trimmed.match(/(\d{1,2}):(\d{2})/);
  if (!match) return null;

  const [_, hourStr, minuteStr] = match;
  const base = referenceDate;
  if (Number.isNaN(base.getTime())) return null;

  base.setHours(Number(hourStr), Number(minuteStr), 0, 0);
  return base;
};

const parseDateTime = (value) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date;
};

const stripMarkdownLink = (value = '') => {
  const trimmed = String(value).trim();
  const match = trimmed.match(/^\[([^\]]+)\]\([^\)]+\)/);
  return match ? match[1].trim() : trimmed;
};

const withRetry = async (fn, retries = 3, baseDelayMs = 1200) => {
  let lastError = null;
  for (let attempt = 1; attempt <= retries; attempt += 1) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (attempt === retries) break;
      const delayMs = baseDelayMs * attempt;
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
  throw lastError;
};

const getSelectorConfig = () => {
  if (!process.env.CRAWL_SELECTOR_JSON) return defaultSelectorConfig;
  try {
    return {
      ...defaultSelectorConfig,
      ...JSON.parse(process.env.CRAWL_SELECTOR_JSON)
    };
  } catch (error) {
    logger.warn(`[Crawl] Invalid CRAWL_SELECTOR_JSON, fallback to defaults: ${error.message}`);
    return defaultSelectorConfig;
  }
};

const loadCheerio = async () => {
  const cheerio = await import('cheerio');
  return cheerio;
};

const parseFlightsFromHtml = async (html, selectorConfig) => {
  const cheerio = await loadCheerio();
  const $ = cheerio.load(html);
  const flights = [];

  $(selectorConfig.item).each((index, element) => {
    const item = $(element);
    const destinationText = item.find(selectorConfig.destinationCell).first().text().trim();
    const destinationCode = extractIataCode(destinationText);
    const originCode = normalizeAirportCode(process.env.CRAWL_ORIGIN_CODE || 'HAN');

    const extracted = {
      flightNumber: item.find(selectorConfig.flightNumber).first().text().trim(),
      originCode,
      destinationCode,
      destinationText,
      departureTime: item.find(selectorConfig.scheduledTime).first().text().trim(),
      arrivalTime: null,
      basePrice: item.find(selectorConfig.basePrice).first().text().trim()
    };

    if (!extracted.flightNumber) {
      extracted.flightNumber = `CRAWL-${Date.now()}-${index}`;
    }

    flights.push(extracted);
  });

  return flights;
};

const parseFlightsFromMarkdownTable = (text) => {
  const lines = String(text || '').split(/\r?\n/);
  const flights = [];
  const originCode = normalizeAirportCode(process.env.CRAWL_ORIGIN_CODE || 'HAN');

  for (const line of lines) {
    if (!line.startsWith('|')) continue;
    const columns = line.split('|').map((v) => v.trim()).filter(Boolean);
    if (columns.length < 6) continue;

    const flightNumberText = stripMarkdownLink(columns[0]);
    if (!/^[A-Z]{1,3}\d{2,5}$/i.test(flightNumberText)) continue;

    const destinationText = stripMarkdownLink(columns[1]);
    const dateText = stripMarkdownLink(columns[3]);
    const scheduledTime = stripMarkdownLink(columns[4]);

    flights.push({
      flightNumber: flightNumberText,
      originCode,
      destinationCode: extractIataCode(destinationText),
      destinationText,
      departureTime: `${dateText} ${scheduledTime}`.trim(),
      arrivalTime: null,
      basePrice: ''
    });
  }

  return flights;
};

// Map airline IATA prefix → preferred aircraft model
// Vietnamese domestic carriers mostly use A321; widebody for long-haul
const AIRLINE_AIRCRAFT_MAP = {
  VN: 'Airbus A321',      // Vietnam Airlines domestic
  VJ: 'Airbus A321',      // VietJet Air
  QH: 'Airbus A321',      // Bamboo Airways domestic
  BL: 'Airbus A321',      // Pacific Airlines
  VU: 'Airbus A321',      // Vietravel Airlines
  // International wide-body
  TG: 'Boeing 787-9',
  MH: 'Boeing 787-9',
  KE: 'Boeing 787-9',
  OZ: 'Boeing 787-9',
  CX: 'Airbus A350-900',
  JL: 'Airbus A350-900',
  SQ: 'Airbus A350-900',
};

const resolveAircraftByFlightNumber = (flightNumber, allAircraft, defaultAircraft) => {
  const prefix = String(flightNumber).match(/^([A-Z]{2})/i)?.[1]?.toUpperCase();
  if (!prefix) return defaultAircraft;
  const preferredModel = AIRLINE_AIRCRAFT_MAP[prefix];
  if (!preferredModel) return defaultAircraft;
  return allAircraft.find(a => a.model === preferredModel) || defaultAircraft;
};

const resolveAirportByCode = async (rawCode) => {
  const code = normalizeAirportCode(rawCode);
  if (!code) return null;

  const exact = await prisma.airport.findFirst({
    where: {
      OR: [
        { code },
        { code: { endsWith: `-${code}` } }
      ]
    }
  });

  return exact;
};

const ensureRoute = async (departureId, arrivalId, fallbackDuration, fallbackPrice) => {
  let route = await prisma.route.findFirst({
    where: { departureId, arrivalId }
  });

  if (route) return route;

  route = await prisma.route.create({
    data: {
      departureId,
      arrivalId,
      duration: fallbackDuration || 90,
      standardPrice: fallbackPrice || 1000000,
      isActive: true
    }
  });

  return route;
};

const ensureSeatInventory = async (flightId, aircraft) => {
  const existing = await prisma.seatInventory.findMany({ where: { flightId } });
  if (existing.length > 0) return;

  await prisma.seatInventory.createMany({
    data: [
      {
        flightId,
        ticketClass: 'ECONOMY',
        availableSeats: aircraft.economySeats,
        bookedSeats: 0
      },
      {
        flightId,
        ticketClass: 'BUSINESS',
        availableSeats: aircraft.businessSeats,
        bookedSeats: 0
      }
    ]
  });
};

const upsertCrawledFlight = async (rawFlight, allAircraft, defaultAircraft) => {
  const originAirport = await resolveAirportByCode(rawFlight.originCode);
  const destinationAirport = await resolveAirportByCode(rawFlight.destinationCode);

  if (!originAirport || !destinationAirport) {
    return { status: 'skipped', reason: 'airport_not_found' };
  }

  const aircraft = resolveAircraftByFlightNumber(rawFlight.flightNumber, allAircraft, defaultAircraft);

  const crawlDate = process.env.CRAWL_TARGET_DATE || new Date().toISOString().slice(0, 10);
  const departureTime = parseDepartureDateTime(rawFlight.departureTime, crawlDate);
  const fallbackDurationMinutes = Number(process.env.CRAWL_DEFAULT_DURATION_MINUTES || 120);
  let arrivalTime = parseDateTime(rawFlight.arrivalTime);
  if (!arrivalTime && departureTime) {
    arrivalTime = new Date(departureTime.getTime() + fallbackDurationMinutes * 60000);
  }

  if (!departureTime || !arrivalTime) {
    return { status: 'skipped', reason: 'invalid_datetime' };
  }

  const durationMinutes = Math.max(30, Math.round((arrivalTime.getTime() - departureTime.getTime()) / 60000));

  const route = await ensureRoute(originAirport.id, destinationAirport.id, durationMinutes, parsePrice(rawFlight.basePrice));
  const inferredBasePrice = parsePrice(rawFlight.basePrice) || Number(route.standardPrice || process.env.CRAWL_FALLBACK_PRICE || 1200000);
  const basePrice = Math.max(100000, inferredBasePrice);
  const businessPrice = Math.round(basePrice * 1.35);

  const flight = await prisma.flight.upsert({
    where: { flightNumber: rawFlight.flightNumber },
    update: {
      routeId: route.id,
      aircraftId: aircraft.id,
      departureTime,
      arrivalTime,
      basePrice,
      businessPrice,
      isActive: true,
      notes: 'Auto-imported by HTML crawler job'
    },
    create: {
      flightNumber: rawFlight.flightNumber,
      routeId: route.id,
      aircraftId: aircraft.id,
      departureTime,
      arrivalTime,
      basePrice,
      businessPrice,
      isActive: true,
      notes: 'Auto-imported by HTML crawler job'
    }
  });

  await ensureSeatInventory(flight.id, aircraft);

  return { status: 'ok', flightNumber: flight.flightNumber };
};

export const crawlAndStoreFlightsFromHtml = async () => {
  const crawlUrl = process.env.CRAWL_SOURCE_URL || 'https://r.jina.ai/http://www.airportia.com/vietnam/noi-bai-international-airport/departures/';
  if (!crawlUrl) {
    logger.warn('[Crawl] CRAWL_SOURCE_URL is empty, skip run');
    return { imported: 0, skipped: 0, reason: 'missing_url' };
  }

  const selectorConfig = getSelectorConfig();
  const userAgent = USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
  const timeout = Number(process.env.CRAWL_TIMEOUT_MS || 15000);

  const allAircraft = await prisma.aircraft.findMany({ where: { totalSeats: { gt: 0 } } });

  const defaultAircraft = allAircraft.sort((a, b) => b.totalSeats - a.totalSeats)[0];

  if (!defaultAircraft) {
    logger.warn('[Crawl] No aircraft found in database, skip run');
    return { imported: 0, skipped: 0, reason: 'missing_aircraft' };
  }

  const response = await withRetry(() => axios.get(crawlUrl, {
    timeout,
    headers: {
      'User-Agent': userAgent,
      Accept: 'text/html,application/xhtml+xml'
    }
  }));

  const sourceMode = String(process.env.CRAWL_SOURCE_MODE || '').toLowerCase();
  let rawFlights = [];

  if (sourceMode === 'markdown' || crawlUrl.includes('r.jina.ai/')) {
    rawFlights = parseFlightsFromMarkdownTable(response.data);
  }

  if (rawFlights.length === 0) {
    rawFlights = await parseFlightsFromHtml(response.data, selectorConfig);
  }

  if (rawFlights.length === 0) {
    logger.warn('[Crawl] No flight item found from HTML, check selectors');
    return { imported: 0, skipped: 0, reason: 'no_items' };
  }

  let imported = 0;
  let skipped = 0;

  for (const rawFlight of rawFlights) {
    try {
      const result = await upsertCrawledFlight(rawFlight, allAircraft, defaultAircraft);
      if (result.status === 'ok') {
        imported += 1;
      } else {
        skipped += 1;
      }
    } catch (error) {
      skipped += 1;
      logger.warn(`[Crawl] Skip flight ${rawFlight.flightNumber}: ${error.message}`);
    }
  }

  logger.info(`[Crawl] Completed. imported=${imported}, skipped=${skipped}, source=${crawlUrl}`);
  return { imported, skipped };
};
