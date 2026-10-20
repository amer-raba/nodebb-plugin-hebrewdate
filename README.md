# nodebb-plugin-hebrewdate

תוסף פשוט ל-NodeBB שמחליף תצוגת תאריכים לגרסה עברית.

הוא עובד באמצעות:
- סקריפט בצד הלקוח ב-`public/hebrewdate.js` שסורק תגיות `time`/`span` ומאחד תאריכים.
- בקשה POST ל-`/api/plugins/hebrewdate/convert` שמחזירה מיפוי תאריך לועזי -> ��אריך עברי באמצעות Hebcal API.

## התקנה
1. העתק את התיקייה של התוסף לתוך `node_modules` בתוך שורש NodeBB, או שמור אותו במקום המתאים לפריסה שלך.
2. התקן את התלות:
   ```bash
   cd /path/to/nodebb
   npm install
   ```
3. בנה והפעל מחדש:
   ```bash
   ./nodebb build
   ./nodebb restart
   ```

## הערות
- ה-plugin כולל את ה-script עצמו דרך `plugin.json` ולכן אין צורך להוסיף אותו ידנית דרך `Custom Header HTML`.
- אם יש צורך בבדיקת ידנית, ניתן להפעיל את ה-script דרך `Admin -> Appearance -> Custom Header HTML` עם:
  ```html
  <script src="/plugins/nodebb-plugin-hebrewdate/static/hebrewdate.js"></script>
  ```

## תצורה
- התוסף משתמש ב-Hebcal API לצורך המרה של תאריכים.
- אם Hebcal אינו זמין, הוא נשאר על התאריך המקורי במקום להתרסק.
