'use strict';

const axios = require('axios');

function normalizeDateKey(input) {
  if (input === null || input === undefined) return null;

  let value = String(input).trim();
  if (!value) return null;

  if (value.length > 10) {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) {
      value = parsed.toISOString().slice(0, 10);
    }
  }

  return /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : null;
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
        const dates = Array.isArray(req.body && req.body.dates) ? req.body.dates : [];
        const uniqueDates = [...new Set(dates.map(normalizeDateKey).filter(Boolean))];
        const results = {};

        if (!uniqueDates.length) {
          return res.json({ success: true, dates: results });
        }

        await Promise.all(uniqueDates.map(async (dateStr) => {
          try {
            const response = await axios.get('https://www.hebcal.com/converter', {
              params: {
                cfg: 'json',
                date: dateStr,
                g2h: 1
              },
              timeout: 5000
            });

            const converted = extractHebrewDate(response && response.data, dateStr);
            results[dateStr] = converted;
          } catch (err) {
            results[dateStr] = dateStr;
          }
        }));

        return res.json({ success: true, dates: results });
      } catch (err) {
        return res.status(500).json({ success: false, error: err && err.message ? err.message : 'Unknown error' });
      }
    });

    if (typeof callback === 'function') {
      callback();
    }
  }
};
