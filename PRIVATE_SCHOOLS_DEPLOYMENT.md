# تعليمات دمج إصدار المدارس الأهلية والخاصة مع GitHub

## قاعدة الدمج
هذه الحزمة مبنية على `platform_v39_reference_github_pages_final_fixed.zip` نفسها. لم يتم استبدال `supabase-bridge.js` العام ولم يتم تغيير مشروع التعليم العام. إصدار المدارس الخاصة يستخدم `private-supabase-bridge.js` ومشروع Supabase `PRIVET-SCHOOLS` فقط.

## ملفات تُستبدل في جذر نسخة العمل / GitHub
- `index.html` — أضيف مدخل إصدار المدارس الأهلية والخاصة مع إبقاء مسار التعليم العام.
- `manager.html` — أضيفت طبقة جلسة المدارس الخاصة، الأقسام المشتركة، إدارة مستخدمي المدرسة والخروج الآمن.
- `agent.html` — أضيفت طبقة جلسة الوكيل الخاص وإدارة الإداريين التابعين له والخروج الآمن.
- `teacher.html` — أضيفت حماية جلسة المعلم والخروج الآمن.

## ملفات تُضاف في الجذر
- `private-supabase-bridge.js`
- `private-entry.html`
- `private-system-admin.html`
- `private-owner-login.html`
- `private-owner-portal.html`
- `private-manager-login.html`
- `private-manager-register.html`
- `private-invite-accept.html`
- `private-staff-login.html`
- `private-compliance.html`
- `private-school-identity.html`
- `private-institutional-outputs.html`
- `student_advisor.html`
- `activity_leader.html`
- `administrative_employee_portal.html`
- `kindergarten_teacher.html`
- `health_advisor.html`
- `openai-engine.js`
- `top-ai-center.js`
- `school-exit-scope.js`
- `section-records-repository.js`
- `performance-file-engine.js`
- `section-dashboard-safe-fix.js`

## ملفات لا تُستبدل بسبب إصدار المدارس الخاصة
- `supabase-bridge.js` العام يبقى كما هو؛ فهو خاص ببنية النسخة المرجعية العامة.
- مجلدات ووظائف التعليم العام لا تُحذف ولا يعاد توجيهها إلى مشروع المدارس الخاصة.

## دورة التشغيل بعد الرفع
1. افتح `index.html` واختر «إصدار المدارس الأهلية والخاصة».
2. مدير النظام يدخل من `private-system-admin.html` بحساب system_admin الموجود في مشروع PRIVET-SCHOOLS.
3. ينشئ مدرسة + مالك رئيسي. العملية تستخدم `private-school-provisioning` وتربط Auth + schools + school_owners + school_members.
4. يفتح رابط المالك الخاص بالمدرسة، ويسجل المالك دخوله.
5. المالك ينشئ دعوة المدير من لوحة المالك.
6. المدير يفتح رابط الدعوة `private-manager-register.html?token=...` ويسجل حسابه؛ يبقى Pending.
7. المالك يفعّل المدير من لوحة المالك.
8. المدير يدخل من `private-manager-login.html?schoolId=...`، ثم يدير مستخدمي المدرسة ويرسل روابط الدعوة.
9. كل مستخدم يقبل الدعوة ويظل Pending حتى تفعيله من المشرف المختص.
10. المستخدم المفعل يدخل من «مستخدمو المدرسة» في `private-entry.html` ويوجهه النظام تلقائياً إلى دوره.

## ملاحظة GitHub Pages
يجب رفع الملفات بنفس الأسماء وفي مستوى الجذر المبين أعلاه لأن الروابط نسبية. لا تغيّر أسماء صفحات `private-*` بعد الرفع إلا مع تحديث الخرائط في `private-supabase-bridge.js`.
