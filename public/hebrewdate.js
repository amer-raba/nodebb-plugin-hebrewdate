(function () {
  'use strict';

  function pad(value) {
    return String(value).padStart(2, '0');
  }

  function formatLocalDate(date) {
    if (!(date instanceof Date) || Number.isNaN(date.getTime())) return null;
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  }

  function parseDateString(value) {
    if (!value) return null;
    const text = String(value).trim();
    if (!text) return null;

    if (/^\d{4}-\d{2}-\d{2}$/.test(text)) {
      const d = new Date(`${text}T12:00:00`);
      return Number.isNaN(d.getTime()) ? null : formatLocalDate(d);
    }

    if (/^\d+$/.test(text)) {
      const seconds = Number(text);
      const d = new Date(seconds * 1000);
      return Number.isNaN(d.getTime()) ? null : formatLocalDate(d);
    }

    const d = new Date(text);
    return Number.isNaN(d.getTime()) ? null : formatLocalDate(d);
  }

  function isoDateFromElement(el) {
    if (!el || typeof el.getAttribute !== 'function') return null;

    const dataTs = el.getAttribute('data-timestamp');
    if (dataTs && /^\d+$/.test(String(dataTs))) {
      const d = new Date(Number(dataTs) * 1000);
      if (!Number.isNaN(d.getTime())) return formatLocalDate(d);
    }

    const dt = el.getAttribute('datetime') || el.getAttribute('data-datetime') || el.getAttribute('data-time');
    if (dt) {
      const parsed = parseDateString(dt);
      if (parsed) return parsed;
    }

    const text = (el.textContent || '').trim();
    const parsedText = parseDateString(text);
    if (parsedText) return parsedText;

    return null;
  }

  function isAlreadyConverted(el) {
    return !!(el && el.getAttribute && el.getAttribute('data-hebrewdate-converted') === 'true');
  }

  function chunkArray(list, size) {
    const result = [];
    for (let index = 0; index < list.length; index += size) {
      result.push(list.slice(index, index + size));
    }
    return result;
  }

  function replaceDates() {
    try {
      const elems = Array.from(document.querySelectorAll('time[data-timestamp], time[datetime], span[data-timestamp], span.datetime, [data-datetime], [data-time]'))
        .filter((el) => !isAlreadyConverted(el));

      if (!elems.length) return;

      const map = {};
      elems.forEach((el) => {
        const iso = isoDateFromElement(el);
        if (!iso) return;
        if (!map[iso]) map[iso] = [];
        map[iso].push(el);
      });

      const dates = Object.keys(map).slice(0, 100);
      if (!dates.length) return;

      const batches = chunkArray(dates, 20);

      batches.forEach((batch, batchIndex) => {
        setTimeout(() => {
          fetch('/api/plugins/hebrewdate/convert', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ dates: batch })
          })
            .then(async (res) => {
              if (!res.ok) {
                const text = await res.text();
                throw new Error(text || 'Request failed');
              }
              return res.json();
            })
            .then((json) => {
              if (!json || !json.success || !json.dates) return;

              batch.forEach((date) => {
                const heb = json.dates[date] || date;
                (map[date] || []).forEach((el) => {
                  if (el.getAttribute('data-orig-text') === null) {
                    el.setAttribute('data-orig-text', el.textContent || '');
                  }
                  el.textContent = heb;
                  el.setAttribute('data-hebrewdate-converted', 'true');
                });
              });
            })
            .catch((err) => {
              console.error('HebrewDate plugin error:', err);
            });
        }, batchIndex * 75);
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
