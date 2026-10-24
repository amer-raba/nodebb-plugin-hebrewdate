# nodebb-plugin-hebrewdate

תוסף פשוט ל-NodeBB שמחליף תצוגת תאריכים לגרסה עברית.

הוא עומד באמצעות:
- סקריפט בצד הלקוח ב-`public/hebrewdate.js` שסורק תגיות `time`/`span` ומאחד תאריכים.
- בקשה POST ל-`/api/plugins/hebrewdate/convert` שמחזירה מיפוי תאריך לועזי -> תאריך עברי באמצעות Hebcal API.
- Middleware להסגירה אוטומטית של הפורום בשבת, עם אפשרות לדילוג למנהל/ממ"ד באמצעות כותרות או הרשאות משתמש.

## למה התוסף לא מופיע ברשימת התוספים של NodeBB?

ה-repository ב-GitHub הוא רק המקור של התוסף, ולא ה-plugin שכבר מותקן בסביבת ה-NodeBB שלך.
NodeBB בודק תוספים שמותקנים בתוך פרויקט ה-NodeBB עצמו, בדרך כלל ב-`node_modules` או במיקום התוסף של ההתקנה, ולא רק במאגר GitHub.

לכן, גם אם יש `plugin.json`, `library.js` ו-`package.json` ב-GitHub, התוסף לא יופיע באדמין של NodeBB עד שהוא יותקן, נבנה מחדש, וירוץ בתוך סביבת ה-NodeBB.

## התקנה

### דרך npm (התקנה ישירה מה-GitHub)
```bash
cd /path/to/nodebb
npm install git+https://github.com/amer-raba/nodebb-plugin-hebrewdate.git
./nodebb build
./nodebb restart
```

### דרך תיקייה ידנית
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

## סגירה בשבת

ה-plugin יכול לסגור את הפורום אוטומטית משעה 18:00 ביום שישי ועד תחילת הפעילות מחדש לאחר השבת.

### משתני סביבה
- `NODEBB_SHABBAT_ENABLED=true` — הפעל/השבת את הסגירה.
- `NODEBB_SHABBAT_START_HOUR=18` — שעה שבה מתחילה הסגירה ביום שישי.
- `NODEBB_HEBREWDATE_REMOTE=false` — השבתת המרה של תאריכים דרך Hebcal.

### חריגים
- מנהלי פורום ו-`uid === 1` יכולים להיכנס גם בשבת.
- אפשר לעבור את חובת הסגירה גם דרך כותרת HTTP:
  - `x-nodebb-admin: true`
  - `x-nodebb-shabbat-bypass: true`

## הגבלות ותכונות אבטחה
- לכל בקשה מוגבל מקסימום 100 תאריכים.
- המרה מבוצעת ב־4 בקשות במקביל לכל היותר.
- יש מטמון במטמון זיכרון (TTL של שעה) כדי למנוע חישוב חוזר.
- אפשר להשבית את ה-API החיצוני על ידי הגדרת משתנה סביבה: `NODEBB_HEBREWDATE_REMOTE=false`.
- בקלט לא תקין מוחזר כ־400 עם הודעה כללית, ולא עם שגיאת שרת פנימית.

## הטעינה האוטומטית
ה-plugin טוען את ה-script אוטומטית דרך `plugin.json` ו-`scripts`, כך שאין צורך להוסיף אותו ידנית לכותרת האתר.

אם תרצה עדיין להוסיף ידנית, אפשר להשתמש ב:
```html
<script src="/plugins/nodebb-plugin-hebrewdate/static/hebrewdate.js"></script>
```

## תצורה
- התוסף משתמש ב-Hebcal API לצורך המרה של תאריכים.
- אם Hebcal אינו זמין, הוא ישאר על התאריך המקורי במקום להתרסק.
- תאריך נשמר באמצעות תצורת אזור זמן מקומי כדי למנוע שגיאת `toISOString()` בעת חישוב תאריך יום לפני/אחרי.
