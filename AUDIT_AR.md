# إغلاق تعارض بوابات الدخول في المدارس الخاصة

## السبب الجذري
- صفحة المالك كانت تولد رابط المدير إلى `private-manager-login.html`.
- إحدى نسخ `private-manager-login.html` القديمة كانت تستخدم `mock-supabase.js`.
- بعد الانتقال إلى `manager.html` كان الحارس المركزي يبحث عن جلسة Supabase حقيقية، فلا يجدها، فيعيد المدير إلى صفحة الدخول.
- لذلك كانت إصلاحات `school-login.html` السابقة لا تُستخدم أصلًا في مسار المدير القادم من المالك.

## التصحيح النهائي
- رابط المدير من صفحة المالك أصبح:
  `school-login.html?edition=private&schoolId=<school_id>&role=manager`
- `private-manager-login.html` أصبح مجرد Compatibility Redirect إلى نفس البوابة المركزية.
- المدير والوكيل والمعلم والموجهون والإداري يستخدمون الآن محرك جلسة واحد:
  `PrivateSchoolBridge -> private-school-session -> roleLanding`.
- لم يعد يوجد محرك مصادقة مستقل للمدير.

## الفحوص
{
  "private-school-bridge.js": "PASS",
  "private-school-runtime.js": "PASS",
  "private-school-page-guard.js": "PASS"
}
- عدم وجود `mock-supabase.js` في بوابة المدير القديمة: PASS
- عدم وجود fallback إلى `private-manager-login.html` داخل صفحة المالك: PASS
- رابط المالك يثبت `role=manager`: PASS
