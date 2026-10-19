// library.js
const axios = require('axios');

module.exports = {
  init: function(params, callback) {
    const router = params.router;

    // API לקבלת המרות תאריכים (מקבל body: { dates: [ "YYYY-MM-DD", ... ] })
    router.post('/api/plugins/hebrewdate/convert', async function(req, res) {
      try {
        const dates = Array.isArray(req.body && req.body.dates) ? req.body.dates : [];
        const uniqueDates = [...new Set(dates)];
        const results = {};

        await Promise.all(uniqueDates.map(async (d) => {
          // קו פרוטוקול: אם התקבל מחרוזת ISO מלאה, נחלץ את ה-YYYY-MM-DD
          let dateStr = d;
          if (d && d.length > 10) {
            const dt = new Date(d);
            if (!isNaN(dt)) dateStr = dt.toISOString().slice(0,10);
          }

          try {
            const resp = await axios.get('https://www.hebcal.com/converter', {
              params: {
                cfg: 'json',
                date: dateStr,
                g2h: 1
              },
              timeout: 5000
            });
            // Hebcal מחזיר שדה 'hebrew' במבנה JSON
            if (resp.data && resp.data.hebrew) {
              results[d] = resp.data.hebrew;
            } else {
              results[d] = dateStr;
            }
          } catch (err) {
            // במקרה של כשל, נשאיר התאריך המקורי
            results[d] = dateStr;
          }
        }));

        res.json({ success: true, dates: results });
      } catch (err) {
        res.status(500).json({ success: false, error: err.message });
      }
    });

    if (typeof callback === 'function') callback();
  }
};
