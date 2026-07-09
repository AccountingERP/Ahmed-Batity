# ملفات مصدر الـ CSS

هذه الملفات (`variables.css`, `main.css`, `components.css`, `responsive.css`, `rtl.css`)
هي **الملفات المصدرية** التي تُستخدم للتعديل والصيانة فقط.

المشروع فعليًا يحمّل نسخة مدمجة منها في:
`assets/css/app.css`

## عند تعديل أي تنسيق:
1. عدّل الملف المناسب هنا داخل `src/`.
2. أعد دمج الملفات بنفس الترتيب (الترتيب مهم بسبب الأولوية/الـ cascade):
   ```
   variables.css → main.css → components.css → responsive.css → rtl.css
   ```
   مثال أمر الدمج (Linux/Mac):
   ```bash
   cat variables.css main.css components.css responsive.css rtl.css > ../app.css
   ```
3. لا تنسَ رفع رقم نسخة الكاش في `service-worker.js` (`CACHE_NAME`, `STATIC_CACHE`...) بعد أي تعديل، حتى يحصل المستخدمون على النسخة الجديدة فورًا.
