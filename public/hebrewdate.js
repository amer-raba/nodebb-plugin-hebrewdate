// public/hebrewdate.js
(function () {
  'use strict';

  function isoDateFromElement(el) {
    if (!el || typeof el.getAttribute !== 'function') return null;

    const dataTs = el.getAttribute('data-timestamp');
    if (dataTs && /^\d+$/.test(String(dataTs))) {
      const d = new Date(parseInt(dataTs, 10) * 1000);
      if (!Number.isNaN(d.getTime())) return d.toISOString().slice(0, 10);
    }

    const dt = el.getAttribute('datetime') || el.getAttribute('data-datetime') || el.getAttribute('data-time');
    if (dt) {
      const d = new Date(dt);
      if (!Number.isNaN(d.getTime())) return d.toISOString().slice(0, 10);
    }

    const text = (el.textContent || '').trim();
    if (text) {
      const d = new Date(text);
      if (!Number.isNaN(d.getTime())) return d.toISOString().slice(0, 10);
    }

    return null;
  }

  function isAlreadyConverted(el) {
    return !!el.getAttribute && el.getAttribute('data-hebrewdate-converted') === 'true';
  }

  function replaceDates() {
    try {
      const elems = Array.from(document.querySelectorAll('time[data-timestamp], time[datetime], span[data-timestamp], span.datetime, [data-datetime], [data-time]'))
        .filter(el => !isAlreadyConverted(el));

      if (!elems.length) return;

      const map = {};
      elems.forEach(el => {
        const iso = isoDateFromElement(el);
        if (!iso) return;
        if (!map[iso]) map[iso] = [];
        map[iso].push(el);
      });

      const dates = Object.keys(map);
      if (!dates.length) return;

      fetch('/api/plugins/hebrewdate/convert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dates })
      })
        .then(async res => {
          if (!res.ok) {
            const text = await res.text();
            throw new Error(text || 'Request failed');
          }
          return res.json();
        })
        .then(json => {
          if (!json || !json.success || !json.dates) return;

          dates.forEach(date => {
            const heb = json.dates[date] || date;
            map[date].forEach(el => {
              if (el.getAttribute('data-orig-text') === null) {
                el.setAttribute('data-orig-text', el.textContent || '');
              }
              el.textContent = heb;
              el.setAttribute('data-hebrewdate-converted', 'true');
            });
          });
        })
        .catch(err => {
          console.error('HebrewDate plugin error:', err);
        });
    } catch (err) {
      console.error('HebrewDate replaceDates crashed:', err);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', replaceDates);
  } else {
    replaceDates();
  }

  if (window.jQuery) {
    jQuery(window).on('action:ajaxify.end', function () {
      replaceDates();
    });
  } else {
    window.addEventListener('popstate', replaceDates);
    setTimeout(replaceDates, 1500);
  }
})();
