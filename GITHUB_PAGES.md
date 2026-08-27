# نشر سيارة التعليم الكتبية على GitHub Pages

المشروع أصبح نسخة Vite ثابتة تُنشر من خلال GitHub Actions، بينما تبقى البيانات في Supabase.

## أسرار المستودع المطلوبة

من GitHub افتح المستودع `koutoubia.auto-ecole` ثم:

`Settings → Secrets and variables → Actions → New repository secret`

أضف السرّين التاليين:

| الاسم | القيمة |
|---|---|
| `VITE_SUPABASE_URL` | Project URL من Supabase |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Publishable key أو anon public key |

لا تضف `service_role` أو أي مفتاح سري إلى GitHub أو الواجهة.

## تفعيل النشر

افتح:

`Settings → Pages`

واجعل **Source** هو **GitHub Actions**. بعد ذلك ادفع أي تغيير إلى فرع `main` أو شغّل Workflow يدويًا من تبويب **Actions**.

الرابط المتوقع للموقع هو:

`https://mohsinnet.github.io/koutoubia.auto-ecole/`

لأن التطبيق يعمل تحت مسار مستودع وليس تحت النطاق الجذري للحساب.

## المصادقة

النسخة الثابتة تستخدم Supabase Auth بالبريد الإلكتروني وكلمة المرور. يجب إنشاء مستخدم من شاشة إنشاء الحساب أو من Supabase Dashboard. يجب أيضًا إضافة رابط الموقع أعلاه ضمن:

`Authentication → URL Configuration → Site URL`

وإضافته ضمن **Redirect URLs** إذا طلبت إعدادات المصادقة ذلك.
