-- إتاحة إبقاء خانة تاريخ الامتحان الأول فارغة (اختيارية)
-- تشغيل هذا في Supabase SQL Editor

alter table public.license_records
  alter column exam_date drop not null,
  alter column result drop not null;
