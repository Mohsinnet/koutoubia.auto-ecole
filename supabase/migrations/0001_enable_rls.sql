-- =============================================================================
-- إصلاح أمني: تفعيل أمان مستوى الصفوف (Row Level Security) على قاعدة البيانات
-- وسلة تخزين صور المترشحين، وتقييد الوصول على المسؤول الوحيد فقط.
--
-- طريقة التطبيق (اختر واحدة):
--   A) من لوحة تحكم Supabase: Project Settings → SQL Editor → لصق هذا الكود → Run
--   B) أو عبر CLI:  supabase db push  (بعد ربط المشروع)
--
-- الملف قابل لإعادة التشغيل (idempotent) بأمان.
-- =============================================================================

-- -------------------------------------------------------------------------
-- 1) جدول سجلات المترشحين: تفعيل RLS
-- -------------------------------------------------------------------------
ALTER TABLE public.license_records ENABLE ROW LEVEL SECURITY;

-- حذف السياسات السابقة إن وجدت (لتكرار آمن)
DROP POLICY IF EXISTS "admin_all_license_records" ON public.license_records;

-- السياسة الوحيدة: المسؤول المصرح به فقط (البريد المحدد) يستطيع كل العمليات
CREATE POLICY "admin_all_license_records"
  ON public.license_records
  FOR ALL
  TO authenticated
  USING (auth.jwt() ->> 'email' = 'koutoubiauto@gmail.com')
  WITH CHECK (auth.jwt() ->> 'email' = 'koutoubiauto@gmail.com');

-- -------------------------------------------------------------------------
-- 2) سلة التخزين "candidate-photos": إغلاق الوصول العمومي والقراءة المباشرة
-- -------------------------------------------------------------------------
-- منع أي قراءة عامة عبر الروابط المباشرة (الوضع الافتراضي للدلو كان public)
UPDATE storage.buckets
   SET public = false
 WHERE id = 'candidate-photos';

-- تنظيف أي سياسات قديمة مرتبطة بهذه السلة (بما في ذلك السياسات التلقائية للوحة)
DO $$
DECLARE
  p RECORD;
  expr text;
BEGIN
  FOR p IN SELECT polname
             FROM pg_policy
            WHERE polrelid = 'storage.objects'::regclass
  LOOP
    SELECT pg_get_expr(polqual, polrelid)
         || ' ' || coalesce(pg_get_expr(polwithcheck, polrelid), '')
      INTO expr
      FROM pg_policy
     WHERE polname = p.polname
       AND polrelid = 'storage.objects'::regclass;

    IF expr LIKE '%candidate-photos%' THEN
      EXECUTE format('DROP POLICY %I ON storage.objects', p.polname);
    END IF;
  END LOOP;
END $$;

-- سياسات جديدة على الكائنات داخل السلة:
--   - القراءة: للمسؤول المصرح به فقط
--   - الإضافة/التعديل/الحذف: للمسؤول، داخل مجلده فقط
DROP POLICY IF EXISTS "candidate_photos_select_admin"  ON storage.objects;
DROP POLICY IF EXISTS "candidate_photos_insert_admin" ON storage.objects;
DROP POLICY IF EXISTS "candidate_photos_update_admin" ON storage.objects;
DROP POLICY IF EXISTS "candidate_photos_delete_admin" ON storage.objects;

CREATE POLICY "candidate_photos_select_admin"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (bucket_id = 'candidate-photos'
         AND auth.jwt() ->> 'email' = 'koutoubiauto@gmail.com');

CREATE POLICY "candidate_photos_insert_admin"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'candidate-photos'
              AND auth.jwt() ->> 'email' = 'koutoubiauto@gmail.com'
              AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "candidate_photos_update_admin"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (bucket_id = 'candidate-photos'
         AND auth.jwt() ->> 'email' = 'koutoubiauto@gmail.com'
         AND (storage.foldername(name))[1] = auth.uid()::text)
  WITH CHECK (bucket_id = 'candidate-photos'
              AND auth.jwt() ->> 'email' = 'koutoubiauto@gmail.com');

CREATE POLICY "candidate_photos_delete_admin"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'candidate-photos'
         AND auth.jwt() ->> 'email' = 'koutoubiauto@gmail.com'
         AND (storage.foldername(name))[1] = auth.uid()::text);

-- =============================================================================
-- ملاحظات:
--  * التطبيق يستخدم الآن روابط موقعة (signed URLs) لسحب الصور بدل الروابط العامة.
--  * أي شخص يفتح الموقع دون تسجيل دخول (أو أي مستخدم غير البريد المخصص) لن يرى
--    صفًا واحدًا من الجدول ولا صورة.
-- =============================================================================