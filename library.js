'use strict';

const axios = require('axios');

const MAX_DATES_PER_REQUEST = 100;
const MAX_CONCURRENT_REQUESTS = 4;
const CACHE_TTL_MS = 60 * 60 * 1000;
const REMOTE_CONVERSION_ENABLED = (process.env.NODEBB_HEBREWDATE_REMOTE || 'true').toLowerCase() !== 'false';
const conversionCache = new Map();
const pendingRequests = new Map();

function pad(value) {
  return String(value).padStart(2, '0');
}

function toLocalDateString(date) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return null;
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function isValidDateString(value) {
  if (typeof value !== 'string') return false;
  const trimmed = value.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return false;
  const date = new Date(`${trimmed}T12:00:00`);
  return !Number.isNaN(date.getTime()) && toLocalDateString(date) === trimmed;
}

function normalizeDateKey(input) {
  if (input === null || input === undefined) return null;

  if (typeof input === 'number' && Number.isFinite(input)) {
    const date = new Date(input);
    if (Number.isNaN(date.getTime())) return null;
    return toLocalDateString(date);
  }

  let value = String(input).trim();
  if (!value) return null;

  if (value.length > 10) {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) {
      value = toLocalDateString(parsed);
    }
  }

  return isValidDateString(value) ? value : null;
}

function extractHebrewDate(data, fallback) {
  if (!data || typeof data !== 'object') return fallback;

  return (
    data.hebrew ||
    data.hdate ||
    data.hebrewDate ||
    data.hebrew_date ||
    data.hebrew_text ||
    fallback
  );
}

function getCachedConversion(dateStr) {
  const cached = conversionCache.get(dateStr);
  if (!cached) return null;

  if (Date.now() - cached.timestamp > CACHE_TTL_MS) {
    conversionCache.delete(dateStr);
    return null;
  }

  return cached.value;
}

async function fetchHebrewDate(dateStr) {
  if (!REMOTE_CONVERSION_ENABLED) return dateStr;

  const cached = getCachedConversion(dateStr);
  if (cached) return cached;

  if (pendingRequests.has(dateStr)) {
    return pendingRequests.get(dateStr);
  }

  const request = (async () => {
    try {
      const response = await axios.get('https://www.hebcal.com/converter', {
        params: {
          cfg: 'json',
          date: dateStr,
          g2h: 1
        },
        timeout: 5000,
        validateStatus: (status) => status >= 200 && status < 500
      });

      const converted = extractHebrewDate(response && response.data, dateStr);
      conversionCache.set(dateStr, { value: converted, timestamp: Date.now() });
      return converted;
    } catch (err) {
      return dateStr;
    }
  })();

  pendingRequests.set(dateStr, request);
  try {
    return await request;
  } finally {
    pendingRequests.delete(dateStr);
  }
}

async function convertDateBatch(dateList) {
  const uniqueDates = [...new Set(dateList.map(normalizeDateKey).filter(Boolean))];
  const limitedDates = uniqueDates.slice(0, MAX_DATES_PER_REQUEST);
  const results = {};

  for (let index = 0; index < limitedDates.length; index += MAX_CONCURRENT_REQUESTS) {
    const batch = limitedDates.slice(index, index + MAX_CONCURRENT_REQUESTS);
    const batchResults = await Promise.all(batch.map(async (dateStr) => {
      const value = await fetchHebrewDate(dateStr);
      results[dateStr] = value;
    }));

    if (index + MAX_CONCURRENT_REQUESTS < limitedDates.length) {
      await new Promise((resolve) => setTimeout(resolve, 75));
    }

    if (batchResults.length === 0) break;
  }

  return results;
}

module.exports = {
  init: function (params, callback) {
    const router = params && params.router;

    if (!router || typeof router.post !== 'function') {
      if (typeof callback === 'function') {
        return callback();
      }
      return;
    }

    router.post('/api/plugins/hebrewdate/convert', async function (req, res) {
      try {
        const rawDates = Array.isArray(req.body && req.body.dates) ? req.body.dates : [];

        if (!rawDates.length) {
          return res.status(400).json({ success: false, error: 'Invalid date payload' });
        }

        const validDates = rawDates.map(normalizeDateKey).filter(Boolean);

        if (!validDates.length) {
          return res.status(400).json({ success: false, error: 'No valid dates supplied' });
        }

        const converted = await convertDateBatch(validDates);
        return res.json({ success: true, dates: converted });
      } catch (err) {
        return res.status(500).json({ success: false, error: 'Unable to convert dates' });
      }
    });

    if (typeof callback === 'function') {
      callback();
    }
  }
};
