# تصحيح المرحلة الحالية — 2026-08-21

الملفات التي تستبدل في جذر المشروع:
- private-compliance.html
- private-output-preview.html
- private-school-bridge.js
- manager.html

ملف جديد يضاف إلى جذر المشروع:
- private-school-user-register.html

ملفات Supabase التي تستبدل/تضاف:
- supabase/functions/private-school-compliance/index.ts
- supabase/functions/private-school-registration-link/index.ts
- supabase/functions/private-school-registration/index.ts
- supabase/config.toml

النطاق فقط:
1. إزالة خيار «لا ينطبق» من فحص الالتزام.
2. إزالة/استبدال/إضافة شاهد صورة أو PDF.
3. طباعة A4 صارمة ومنع انقسام الصفحة وتمدد الشاهد.
4. رابط تسجيل عام لمستخدمي المدرسة من حساب المدير دون دعوة فردية.
5. تجديد جلسة Supabase تلقائيًا للمالك والمستخدمين قبل انتهاء access token.
