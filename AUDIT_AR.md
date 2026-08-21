# تصحيح ثبات دخول مدير المدرسة — الإصدار الثاني

## سبب الارتداد الذي تم عزله
كان `private-school-runtime.js` يعيد المستخدم إلى `school-login.html` عند أي استثناء عام أثناء تحميل طبقات التشغيل، حتى لو كانت جلسة Supabase وسياق المدرسة صحيحين. وبذلك كان فشل شريط تنقل/مبدل/ملف مساعد يُعامل كأنه انتهاء جلسة.

## التصحيح
- `private-school-page-guard.js` أصبح الجهة الوحيدة المخولة بإعادة المستخدم للدخول، وفقط عند فشل الجلسة/الدور/`school_id`.
- Runtime ينتظر اكتمال تحقق الحارس قبل إظهار الصفحة.
- `private-school-nav.js` و`private-multi-school-switcher.js` وباقي الإضافات أصبحت اختيارية؛ فشلها لا يغلق جلسة المدير.
- تمت مطابقة استدعاء `private-school-session` المنشور حاليًا بإرسال `activeRole` و`role`.
- صفحة الدخول تمرر `role` من الرابط إن كان موجودًا.

## الفحوص
{
  "private-school-bridge.js": "PASS",
  "private-school-page-guard.js": "PASS",
  "private-school-runtime.js": "PASS"
}
