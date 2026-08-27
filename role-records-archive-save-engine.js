(function(){
'use strict';
if(window.RoleRecordsArchiveSaveEngine)return;
const CFG={
 activity:{key:'activity_leader_records_archive_v2',catalog:[{"id": "basic", "name": "البيانات الأولية لمسؤول/ة النشاط"}, {"id": "training", "name": "الدورات التدريبية لمسؤول/ة النشاط"}, {"id": "goals", "name": "أهداف النشاط الطلابي"}, {"id": "tasks", "name": "مهام مسؤول/ة النشاط"}, {"id": "assignment", "name": "قرار تكليف مسؤول/ة النشاط"}, {"id": "council", "name": "مجلس النشاط الطلابي"}, {"id": "classleaders", "name": "مسؤولو/مسؤولات الفصول"}, {"id": "fields", "name": "مجالات النشاط الطلابي"}, {"id": "annualPlan", "name": "الخطة العامة للنشاط"}, {"id": "weeklyPlan", "name": "خطة النشاط الأسبوعية"}, {"id": "supervisors", "name": "المشرفون على المجالات"}, {"id": "attendance", "name": "سجل حضور الطلاب لمجالات النشاط"}, {"id": "permission", "name": "موافقة ولي الأمر على مشاركة الطالب"}, {"id": "circulars", "name": "سجل متابعة التعاميم الواردة"}, {"id": "talented", "name": "الطلاب المميزون في النشاط"}, {"id": "external", "name": "المشاركون على مستوى الإدارة"}, {"id": "implemented", "name": "استمارة حصر البرامج المنفذة"}, {"id": "clubs", "name": "أعضاء الأندية الطلابية"}, {"id": "events", "name": "الأيام والمناسبات"}, {"id": "followup", "name": "التوجيهات والمتابعة"}]},
 advisor:{key:'advisor_records_archive_v1',catalog:[{"id": "care-tab", "name": "استمارة الرعاية الفردية"}, {"id": "case-tab", "name": "دراسة حالة طالب/ـة (سري للغاية)"}, {"id": "emergency-tab", "name": "سجل المواقف اليومية الطارئة"}, {"id": "report-tab", "name": "تقرير برنامج توجيهي"}, {"id": "group-tab", "name": "جلسة الإرشاد الجمعي"}, {"id": "individual-tab", "name": "جلسة الإرشاد الفردي"}, {"id": "martyrs-tab", "name": "حصر أبناء/بنات الشهداء والمرابطين/المرابطات"}, {"id": "delay-tab", "name": "حصر التأخر الصباحي"}, {"id": "absence-tab", "name": "حصر الغياب المتكرر"}, {"id": "social-tab", "name": "حصر الحالات الاجتماعية"}, {"id": "economic-tab", "name": "حصر الحالات الاقتصادية"}, {"id": "health-psych-tab", "name": "حصر الحالات النفسية والصحية"}, {"id": "parent-visits-tab", "name": "متابعة زيارات ولي الأمر"}, {"id": "student-affairs-tab", "name": "نموذج أحوال الطالب/ـة الشامل"}]}
};
function parse(v,f){try{return JSON.parse(v)}catch(e){return f}}
function safe(v){return String(v==null?'':v).trim()}
function now(){return new Date().toISOString()}
function id(prefix){return prefix+'_'+Date.now()+'_'+Math.random().toString(36).slice(2,8)}
function rows(key){const x=parse(localStorage.getItem(key)||'[]',[]);return Array.isArray(x)?x:[]}
function normalizeYear(v){const m=safe(v).match(/14\d{2}/);return m?m[0]:(safe(v)||'غير محدد')}
function normalizeSemester(v){const s=safe(v);if(/الثاني|2|second/i.test(s))return 'الفصل الدراسي الثاني';if(/الثالث|3|third/i.test(s))return 'الفصل الدراسي الثالث';return 'الفصل الدراسي الأول'}
function activeAcademicContext(){
 let year='',semester='';
 try{const g=window.SchoolAcademicContext||window.AcademicContext||{};year=g.academicYear||g.year||'';semester=g.semester||g.term||'';}catch(e){}
 if(!year)year=localStorage.getItem('school_info_academic_year')||localStorage.getItem('school_academic_year')||localStorage.getItem('academic_year')||'';
 if(!semester)semester=localStorage.getItem('semester')||localStorage.getItem('current_semester')||localStorage.getItem('school_semester')||'';
 return {academicYear:normalizeYear(year),semester:normalizeSemester(semester)};
}
function matchesContext(r,ctx){
 if(!r)return false;
 if(!r.academicYear&&!r.year&&!r.semester&&!r.term)return true; // توافق خلفي للسجلات القديمة
 ctx=ctx||activeAcademicContext();
 return normalizeYear(r.academicYear||r.year)===ctx.academicYear&&normalizeSemester(r.semester||r.term)===ctx.semester;
}
function normalize(role,p){
 const c=CFG[role];if(!c)throw new Error('نوع الأرشيف غير مدعوم.');
 const folderId=safe(p.folderId||p.formId||p.recordId),folder=c.catalog.find(x=>safe(x.id)===folderId);
 if(!folder)throw new Error('لا يوجد مجلد أرشيف مطابق لهذا السجل: '+folderId);
 const r=Object.assign({},p);
 r.id=r.id||id(role+'_record');r.folderId=folder.id;r.folderName=folder.name;
 r.recordId=r.recordId||folder.id;r.formId=r.formId||folder.id;r.title=r.title||folder.name;
 const ctx=activeAcademicContext();
 r.academicYear=normalizeYear(r.academicYear||r.year||ctx.academicYear);
 r.semester=normalizeSemester(r.semester||r.term||ctx.semester);
 r.academicContextKey=r.academicYear+'|'+r.semester;
 r.createdAt=r.createdAt||now();r.updatedAt=now();return r;
}
async function verifyCloud(key){
 if(window.PlatformPersistenceGuard?.flush)await PlatformPersistenceGuard.flush();
 if(window.PlatformStateEngine?.pull && window.PlatformPersistenceGuard?.moduleKey){
  const scope=typeof PlatformPersistenceGuard.scopeFor==='function'?PlatformPersistenceGuard.scopeFor(key):'user';
  const d=await PlatformStateEngine.pull(PlatformPersistenceGuard.moduleKey,scope,[key]);
  const row=(d?.items||[]).find(x=>String(x.state_key)===String(key)&&!x.deleted_at);
  if(row){
   const cloud=String(row.payload?.value??''),local=String(localStorage.getItem(key)??'');
   if(cloud!==local)throw new Error('النسخة السحابية لا تطابق النسخة المحلية.');
   return true;
  }
 }
 return !!window.PlatformPersistenceGuard;
}
async function save(role,p){
 const c=CFG[role],r=normalize(role,p),list=rows(c.key);
 const same=list.filter(x=>safe(x.folderId)===safe(r.folderId)&&normalizeYear(x.academicYear||x.year||r.academicYear)===r.academicYear&&normalizeSemester(x.semester||x.term||r.semester)===r.semester);
 r.duplicateNo=r.duplicateNo||same.length+1;
 r.displayName=r.displayName||((safe(p.personName||p.baseName)||r.title)+' - نسخة '+r.duplicateNo);
 list.push(r);localStorage.setItem(c.key,JSON.stringify(list));
 const check=rows(c.key),saved=check.find(x=>safe(x.id)===safe(r.id));
 if(!saved)throw new Error('لم يظهر السجل بعد الحفظ في الأرشيف.');
 if(safe(saved.folderId)!==safe(r.folderId)||safe(saved.folderName)!==safe(r.folderName))throw new Error('السجل محفوظ في مجلد غير صحيح.');
 if(!check.filter(x=>safe(x.folderId)===safe(r.folderId)&&matchesContext(x,{academicYear:r.academicYear,semester:r.semester})).some(x=>safe(x.id)===safe(r.id)))throw new Error('السجل غير ظاهر داخل مجلده وفي نطاق الفصل الدراسي الصحيح.');
 const cloud=await verifyCloud(c.key);return {ok:true,record:saved,folderCount:check.filter(x=>safe(x.folderId)===safe(r.folderId)&&matchesContext(x,{academicYear:r.academicYear,semester:r.semester})).length,cloud};
}
async function update(role,recordId,patch){
 const c=CFG[role],list=rows(c.key),i=list.findIndex(x=>safe(x.id)===safe(recordId));if(i<0)throw new Error('السجل غير موجود.');
 const next=normalize(role,Object.assign({},list[i],patch,{id:list[i].id,createdAt:list[i].createdAt}));list[i]=next;
 localStorage.setItem(c.key,JSON.stringify(list));const saved=rows(c.key).find(x=>safe(x.id)===safe(recordId));
 if(!saved||safe(saved.folderId)!==safe(next.folderId))throw new Error('فشل التحقق من التعديل.');
 const cloud=await verifyCloud(c.key);return {ok:true,record:saved,cloud};
}
window.RoleRecordsArchiveSaveEngine={save,update,activeAcademicContext,matchesCurrent:(r)=>matchesContext(r,activeAcademicContext()),list:(role,currentOnly=true)=>{const c=CFG[role];if(!c)return[];const a=rows(c.key);return currentOnly?a.filter(x=>matchesContext(x,activeAcademicContext())):a;},activityKey:CFG.activity.key,advisorKey:CFG.advisor.key,activityCatalog:CFG.activity.catalog,advisorCatalog:CFG.advisor.catalog};
})();