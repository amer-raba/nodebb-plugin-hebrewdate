# nodebb-plugin-hebrewdate

תוסף פשוט ל-NodeBB שמחליף תצוגת תאריכים לגרסה עברית.

הוא עומד באמצעות:
- סקריפט בצד הלקוח ב-`public/hebrewdate.js` שסורק תגיות `time`/`span` ומאחד תאריכים.
- בקשה POST ל-`/api/plugins/hebrewdate/convert` שמחזירה מיפוי תאריך לועזי -> תאריך עברי באמצעות Hebcal API.

## למה התוסף לא מופיע ברשימת התוספים של NodeBB?

ה-repository ב-GitHub הוא רק המקור של התוסף, ולא ה-plugin שכבר מותקן בסביבת ה-NodeBB שלך.
NodeBB בודק תוספים שמותקנים בתוך פרויקט ה-NodeBB עצמו, בדרך כלל ב-`node_modules` או במיקום התוסף של ההתקנה, ולא רק במאגר GitHub.

לכן, גם אם יש `plugin.json`, `library.js` ו-`package.json` ב-GitHub, התוסף לא יופיע באדמין של NodeBB עד שהוא יותקן, נבנה מחדש, וירוץ בתוך ההתקנה המקומית של ה-NodeBB.

הסיבות הנפוצות הן:
- התוסף לא הותקן בתוך ה-NodeBB (`npm install ...` לא בוצע)
- לא הרצת `./nodebb build` לאחר ההתקנה
- לא restarted את השרת לאחר ההתקנה
- התוסף מותקן במקום שונה מהתיקייה שבה NodeBB מחפש plugins

### דוגמה נכונה להתקנה
```bash
cd /path/to/nodebb
npm install git+https://github.com/amer-raba/nodebb-plugin-hebrewdate.git
./nodebb build
./nodebb restart
```

אם המערכת רצה מ-NodeBB, התוסף אמור להיטען על פי `plugin.json` ולופלוט בממשק התוספים לאחר build ו-restart.

## הגבלות ותכונות אבטחה
- לכל בקשה מוגבל מקסימום 100 תאריכים.
- המרה מבוצעת ב־4 בקשות במקביל לכל היותר.
- יש מטמון במטמון זיכרון (TTL של שעה) כדי למנוע חישוב חוזר.
- אפשר להשבית את ה-API החיצוני על ידי הגדרת משתנה סביבה: `NODEBB_HEBREWDATE_REMOTE=false`.
- בקלט לא תקין מוחזר כ־400 עם הודעה כללית, ולא עם שגיאת שרת פנימית.

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
