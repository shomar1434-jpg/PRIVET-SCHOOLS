# مراجعة تصحيح جلسة المالك وحلقة دخول المدرسة

## السبب الأول — جلسة المالك
- صفحة `private-owner-login.html` كانت تحمل `mock-supabase.js` في نسخة العمل المفحوصة.
- تم استبداله بعميل Supabase الحقيقي `@supabase/supabase-js@2.111.0`.
- تم فصل تخزين جلسة المالك عن جلسة بقية مستخدمي المدرسة:
  - المالك: `PRIVATE_SCHOOLS_OWNER_AUTH_V1`
  - المدير/الوكيل/المستخدمون: `PRIVATE_SCHOOLS_SCHOOL_USER_AUTH_V1`
- فتح/اختبار بوابة مستخدمي المدرسة في تبويب آخر لم يعد يستبدل Refresh Token الخاص بالمالك.

## السبب الثاني — الترحيب ثم الرجوع للدخول
- `private-school-runtime.js` كان يطلب `private-school-page-guard.js` لكن الملف غير موجود في الحزم التشغيلية المفحوصة.
- فشل التحميل كان يدخل إلى catch العام ويعيد الصفحة إلى `school-login.html`.
- تم إنشاء `private-school-page-guard.js` فعليًا، وهو يتحقق من جلسة Supabase وسياق `school_id` والدور قبل السماح بفتح الصفحة المحمية.
- أضيف إصدار query للملف لمنع بقاء 404 قديم في cache.

## الفحوص
{
  "private-school-bridge.js": "PASS",
  "private-school-runtime.js": "PASS",
  "private-school-page-guard.js": "PASS"
}

## نطاق التصحيح
لا توجد تغييرات في قواعد بيانات Supabase أو Edge Functions في هذا التصحيح؛ التغيير خاص بطبقة جلسات المتصفح والبوابة فقط.
