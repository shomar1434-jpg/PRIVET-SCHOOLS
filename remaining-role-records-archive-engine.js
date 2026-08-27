(function(){
'use strict';
if(window.RemainingRoleRecordsArchiveEngine)return;
const CFG={teacher:{key:'teacher_records_archive_v1',catalog:[{"id": "attendance", "name": "كشف متابعة غياب الطلاب"}, {"id": "participation", "name": "سجل متابعة المشاركة والتفاعل الصفي"}, {"id": "student_work", "name": "سجل متابعة أعمال الطلاب"}]},kindergarten:{key:'kindergarten_teacher_records_archive_v1',catalog:[{"id": "attendance", "name": "كشف متابعة غياب أطفال الروضة"}, {"id": "participation", "name": "سجل متابعة المشاركة والتفاعل"}, {"id": "student_work", "name": "سجل متابعة أعمال الأطفال"}]},health:{key:'health_advisor_records_archive_v1',catalog:[{"id": "clinic", "name": "السجل الصحي الشامل"}, {"id": "chronic", "name": "الحالات المزمنة والمعدية"}, {"id": "environment", "name": "البيئة الصحية المدرسية"}, {"id": "programs", "name": "البرامج الصحية"}, {"id": "transfers", "name": "التحويلات الطبية والطوارئ"}]}};
function parse(v,f){try{return JSON.parse(v)}catch(e){return f}}
function safe(v){return String(v==null?'':v).trim()}
function now(){return new Date().toISOString()}
function uid(p){return p+'_'+Date.now()+'_'+Math.random().toString(36).slice(2,8)}
function rows(key){const a=parse(localStorage.getItem(key)||'[]',[]);return Array.isArray(a)?a:[]}
function normalize(role,p){
 const cfg=CFG[role];if(!cfg)throw new Error('نوع الأرشيف غير مدعوم.');
 const folderId=safe(p.folderId||p.recordId),folder=cfg.catalog.find(x=>safe(x.id)===folderId);
 if(!folder)throw new Error('لا يوجد مجلد أرشيف مطابق للسجل: '+folderId);
 const r=Object.assign({},p);r.id=r.id||uid(role+'_record');r.folderId=folder.id;r.folderName=folder.name;r.recordId=r.recordId||folder.id;r.title=r.title||folder.name;r.createdAt=r.createdAt||now();r.updatedAt=now();return r;
}
async function verifyCloud(key){
 if(window.PlatformPersistenceGuard?.flush)await PlatformPersistenceGuard.flush();
 if(window.PlatformStateEngine?.pull && window.PlatformPersistenceGuard?.moduleKey){
  const scope=typeof PlatformPersistenceGuard.scopeFor==='function'?PlatformPersistenceGuard.scopeFor(key):'user';
  const data=await PlatformStateEngine.pull(PlatformPersistenceGuard.moduleKey,scope,[key]);
  const row=(data?.items||[]).find(x=>String(x.state_key)===String(key)&&!x.deleted_at);
  if(row){const cloud=String(row.payload?.value??''),local=String(localStorage.getItem(key)??'');if(cloud!==local)throw new Error('النسخة السحابية لا تطابق النسخة المحلية.');return {cloud:true,backend:'platform_state'};}
 }
 if(window.IndependentSchoolPersistence?.mirrorNow){const ok=await IndependentSchoolPersistence.mirrorNow(key,localStorage.getItem(key),'save');if(!ok)throw new Error('فشل التحقق من المرآة السحابية.');return {cloud:true,backend:'safe_mirror'};}
 return {cloud:false,backend:'local_only'};
}
async function save(role,p){
 const cfg=CFG[role],r=normalize(role,p),list=rows(cfg.key),same=list.filter(x=>safe(x.folderId)===safe(r.folderId));
 r.duplicateNo=r.duplicateNo||same.length+1;r.displayName=r.displayName||((safe(p.baseName||p.personName||p.className)||r.title)+' - نسخة '+r.duplicateNo);
 list.push(r);localStorage.setItem(cfg.key,JSON.stringify(list));
 const check=rows(cfg.key),saved=check.find(x=>safe(x.id)===safe(r.id));if(!saved)throw new Error('لم يظهر السجل بعد الحفظ في الأرشيف.');
 if(safe(saved.folderId)!==safe(r.folderId)||safe(saved.folderName)!==safe(r.folderName))throw new Error('تم حفظ السجل في مجلد غير صحيح.');
 const folderRows=check.filter(x=>safe(x.folderId)===safe(r.folderId));if(!folderRows.some(x=>safe(x.id)===safe(r.id)))throw new Error('السجل غير ظاهر داخل مجلده.');
 const cloud=await verifyCloud(cfg.key);return {ok:true,record:saved,folderCount:folderRows.length,...cloud};
}
async function update(role,id,patch){const cfg=CFG[role],list=rows(cfg.key),i=list.findIndex(x=>safe(x.id)===safe(id));if(i<0)throw new Error('السجل غير موجود.');const next=normalize(role,Object.assign({},list[i],patch||{},{id:list[i].id,createdAt:list[i].createdAt}));list[i]=next;localStorage.setItem(cfg.key,JSON.stringify(list));const saved=rows(cfg.key).find(x=>safe(x.id)===safe(id));if(!saved||safe(saved.folderId)!==safe(next.folderId))throw new Error('فشل التحقق من التعديل.');const cloud=await verifyCloud(cfg.key);return {ok:true,record:saved,...cloud};}
function list(role,folderId){const cfg=CFG[role];return rows(cfg.key).filter(x=>!folderId||safe(x.folderId)===safe(folderId));}
function remove(role,id){const cfg=CFG[role],list=rows(cfg.key),target=list.find(x=>safe(x.id)===safe(id));if(!target)return false;try{const k=cfg.key+':deleted';const d=rows(k);d.unshift({deletedAt:now(),record:target});localStorage.setItem(k,JSON.stringify(d.slice(0,100)))}catch(e){}localStorage.setItem(cfg.key,JSON.stringify(list.filter(x=>safe(x.id)!==safe(id))));return true;}
window.RemainingRoleRecordsArchiveEngine={save,update,list,remove,config:CFG};
})();