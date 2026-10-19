// public/hebrewdate.js
(function() {
  'use strict';

  function isoDateFromElement(el) {
    // NodeBB לעיתים שומרת data-timestamp בשניות
    const dataTs = el.getAttribute && el.getAttribute('data-timestamp');
    if (dataTs && /^\d+$/.test(dataTs)) {
      return new Date(parseInt(dataTs, 10) * 1000).toISOString().slice(0,10);
    }

    // נסה את attribute datetime
    const dt = el.getAttribute && (el.getAttribute('datetime') || el.getAttribute('data-datetime'));
    if (dt) {
      const d = new Date(dt);
      if (!isNaN(d)) return d.toISOString().slice(0,10);
    }

    // ניסיון גנרי להמיר טקסט לתאריך
    const text = el.textContent && el.textContent.trim();
    if (text) {
      const d = new Date(text);
      if (!isNaN(d)) return d.toISOString().slice(0,10);
    }

    return null;
  }

  function replaceDates() {
    try {
      // בחר את התגים המוכרים שבהם NodeBB מציג תאריכים
      const elems = Array.from(document.querySelectorAll('time[data-timestamp], time[datetime], span[data-timestamp], span.datetime'));
      const map = {};
      elems.forEach(el => {
        const iso = isoDateFromElement(el);
        if (iso) {
          if (!map[iso]) map[iso] = [];
          map[iso].push(el);
        }
      });

      const dates = Object.keys(map);
      if (!dates.length) return;

      fetch('/api/plugins/hebrewdate/convert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dates: dates })
      })
      .then(res => res.json())
      .then(json => {
        if (json && json.success && json.dates) {
          dates.forEach(d => {
            const heb = json.dates[d] || d;
            map[d].forEach(el => {
              // שמור את הטקסט המקורי לנתון data (אפשר לשחזר)
              if (!el.getAttribute('data-orig-text')) el.setAttribute('data-orig-text', el.textContent);
              el.textContent = heb;
            });
          });
        }
      })
      .catch(err => {
        console.error('HebrewDate plugin error:', err);
      });
    } catch (err) {
      console.error('HebrewDate replaceDates crashed:', err);
    }
  }

  // הפעלה בהטענת הדף ובכל ניווט AJAX (NodeBB משתמש ב-ajaxify)
  document.addEventListener('DOMContentLoaded', replaceDates);
  if (window.$) {
    $(window).on('action:ajaxify.end', function() {
      replaceDates();
    });
  } else {
    // גיבוי: ריצות נוספות
    window.addEventListener('popstate', replaceDates);
    setTimeout(replaceDates, 1500);
  }
})();
