# nodebb-node_modules-nodebb-plugin-hebrewdate
# nodebb-plugin-hebrewdate

תוסף פשוט ל-NodeBB שמחליף תצוגת תאריכים לגרסה עברית.

הוא עובד באמצעות:
- סקריפט בצד הלקוח (public/hebrewdate.js) שסורק תגיות <time> ומקבץ תאריכים.
- קריאת POST לנתיב `/api/plugins/hebrewdate/convert` שמחזירה מיפוי תאריך לועזי -> תאריך עברי (ממיר בעזרת Hebcal API).

התקנה
1. העתק את התיקייה של התוסף לתיקיית node_modules בתוך root של NodeBB או שמור במקום שתבחר ואז רשם את התוסף:
   - אופציה מהירה: העתק את התיקייה כ-nodebb-plugin-hebrewdate ל-nodebb/node_modules/
2. התקן תלותיות (אם צריך) מתוך root של NodeBB:
   cd /path/to/nodebb
   npm install
   (אם העברת את התיקייה ל-node_modules, ה-root npm install יתקין את axios בתלות הכללית)
3. בניית NodeBB והפעלה מחדש:
   ./nodebb build
   ./nodebb restart

הוספת הסקריפט ל-frontend
- הדרך הכי פשוטה: Admin -> Appearance -> Custom Header HTML והדבק:
  <script src="/plugins/nodebb-plugin-hebrewdate/static/hebrewdate.js"></script>

- לחלופין, אם התוסף מותקן נכון ו-NodeBB משרת staticDirs, הנתיב יהיה:
  /plugins/nodebb-plugin-hebrewdate/static/hebrewdate.js
