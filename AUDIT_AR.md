# تصحيح مركزي: منع إرجاع مستخدمي المدارس الخاصة إلى بوابة الدخول

## التشخيص
صفحات الأدوار كانت تحمل `private-session-reset.js` ثم `private-school-preflight.js` في بداية الصفحة،
بينما محرك Supabase الخاص `private-school-runtime.js` يعمل في نهاية الصفحة.
هذا يسمح لطبقة مبكرة باتخاذ قرار جلسة قبل جاهزية التحقق الحقيقي.

كما أن الصفحات تحتوي طبقات توافق مأخوذة من بنية المدارس المستقلة القديمة؛
تبقى لاستخدام وظائف الملفات والتخزين والتكليفات، لكنها لم تعد سلطة المصادقة في الإصدار الخاص.

## التصحيح
- إزالة تشغيل `private-session-reset.js` تلقائيًا عند فتح صفحات الأدوار المحمية.
- إزالة `private-school-preflight.js` من صفحات الأدوار.
- إضافة `private-role-entry-compat.js` في بداية كل صفحة:
  - لا يعيد التوجيه إطلاقًا.
  - لا يمسح الجلسة.
  - يستعيد `school_id` والدور والمستخدم من سياق Private الذي أنشأته بوابة الدخول.
  - يجهز مفاتيح التوافق اللازمة للسكربتات القديمة.
- التحقق الأمني الوحيد الذي يملك حق إعادة المستخدم للدخول أصبح:
  `private-school-page-guard.js` بعد جاهزية Supabase و`PrivateSchoolBridge`.
- الموظف الإداري أصبح يقبل سياق Private الصحيح قبل الحارس الإداري القديم.

## صفحات الأدوار المغلقة في التصحيح
{
  "manager.html": {
    "preflight_removed": true,
    "reset_removed": true,
    "compat_loaded": true,
    "runtime_loaded": true
  },
  "agent.html": {
    "preflight_removed": true,
    "reset_removed": true,
    "compat_loaded": true,
    "runtime_loaded": true
  },
  "teacher.html": {
    "preflight_removed": true,
    "reset_removed": true,
    "compat_loaded": true,
    "runtime_loaded": true
  },
  "student_advisor.html": {
    "preflight_removed": true,
    "reset_removed": true,
    "compat_loaded": true,
    "runtime_loaded": true
  },
  "activity_leader.html": {
    "preflight_removed": true,
    "reset_removed": true,
    "compat_loaded": true,
    "runtime_loaded": true
  },
  "kindergarten_teacher.html": {
    "preflight_removed": true,
    "reset_removed": true,
    "compat_loaded": true,
    "runtime_loaded": true
  },
  "health_advisor.html": {
    "preflight_removed": true,
    "reset_removed": true,
    "compat_loaded": true,
    "runtime_loaded": true
  },
  "administrative_employee_portal.html": {
    "preflight_removed": true,
    "reset_removed": true,
    "compat_loaded": true,
    "runtime_loaded": true
  }
}

## فحوص JavaScript والمحاكاة
{
  "private-role-entry-compat.js": "PASS",
  "private-school-bridge.js": "PASS",
  "private-school-runtime.js": "PASS",
  "private-school-page-guard.js": "PASS",
  "compat_context_simulation": "PASS"
}
