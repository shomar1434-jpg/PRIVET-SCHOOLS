(function(){
'use strict';
if(window.RemainingRoleRecordsArchiveEngine?.version==='2.0.0')return;

const CFG={
 teacher:{key:'teacher_records_archive_v1',catalog:[
   {id:'attendance',name:'كشف متابعة غياب الطلاب'},
   {id:'participation',name:'سجل متابعة المشاركة والتفاعل الصفي'},
   {id:'student_work',name:'سجل متابعة أعمال الطلاب'}
 ]},
 kindergarten:{key:'kindergarten_teacher_records_archive_v1',catalog:[
   {id:'attendance',name:'كشف متابعة غياب أطفال الروضة'},
   {id:'participation',name:'سجل متابعة المشاركة والتفاعل'},
   {id:'student_work',name:'سجل متابعة أعمال الأطفال'}
 ]},
 health:{key:'health_advisor_records_archive_v1',catalog:[
   {id:'clinic',name:'السجل الصحي الشامل'},
   {id:'chronic',name:'الحالات المزمنة والمعدية'},
   {id:'environment',name:'البيئة الصحية المدرسية'},
   {id:'programs',name:'البرامج الصحية'},
   {id:'transfers',name:'التحويلات الطبية والطوارئ'}
 ]}
};

function parse(v,f){try{return JSON.parse(v)}catch(e){return f}}
function safe(v){return String(v==null?'':v).trim()}
function now(){return new Date().toISOString()}
function uid(p){return p+'_'+Date.now()+'_'+Math.random().toString(36).slice(2,8)}
function rows(key){const a=parse(localStorage.getItem(key)||'[]',[]);return Array.isArray(a)?a:[]}

function normalizeSemester(v){
  const s=safe(v).replace(/\s+/g,' ');
  if(/الثاني|2|second/i.test(s))return 'الفصل الدراسي الثاني';
  if(/الثالث|3|third/i.test(s))return 'الفصل الدراسي الثالث';
  return 'الفصل الدراسي الأول';
}
function normalizeYear(v){
  const s=safe(v);
  const m=s.match(/14\d{2}|15\d{2}/);
  return m?m[0]:s||'غير محدد';
}
function activeAcademicContext(){
  let year='',semester='';
  try{
    const g=parse(localStorage.getItem('followup_global_v3')||'{}',{});
    year=g.year||g.academicYear||'';
    semester=g.semester||g.term||'';
  }catch(e){}
  if(!year)year=localStorage.getItem('academic_year')||localStorage.getItem('school_academic_year')||'';
  if(!semester)semester=localStorage.getItem('semester')||localStorage.getItem('current_semester')||'';
  return {academicYear:normalizeYear(year),semester:normalizeSemester(semester)};
}
function contextKey(record){
  const y=normalizeYear(record.academicYear||record.year||activeAcademicContext().academicYear);
  const s=normalizeSemester(record.semester||record.term||activeAcademicContext().semester);
  return y+'|'+s;
}
function normalize(role,p){
  const cfg=CFG[role];if(!cfg)throw new Error('نوع الأرشيف غير مدعوم.');
  const folderId=safe(p.folderId||p.recordId),folder=cfg.catalog.find(x=>safe(x.id)===folderId);
  if(!folder)throw new Error('لا يوجد مجلد أرشيف مطابق للسجل: '+folderId);
  const ctx=activeAcademicContext();
  const r=Object.assign({},p);
  r.id=r.id||uid(role+'_record');
  r.folderId=folder.id;
  r.folderName=folder.name;
  r.recordId=r.recordId||folder.id;
  r.title=r.title||folder.name;
  r.academicYear=normalizeYear(r.academicYear||r.year||ctx.academicYear);
  r.semester=normalizeSemester(r.semester||r.term||ctx.semester);
  r.academicContextKey=r.academicYear+'|'+r.semester;
  r.createdAt=r.createdAt||now();
  r.updatedAt=now();
  return r;
}
async function verifyCloud(key){
  if(window.PlatformPersistenceGuard?.flush)await PlatformPersistenceGuard.flush();
  if(window.PlatformStateEngine?.pull && window.PlatformPersistenceGuard?.moduleKey){
    const scope=typeof PlatformPersistenceGuard.scopeFor==='function'?PlatformPersistenceGuard.scopeFor(key):'user';
    const data=await PlatformStateEngine.pull(PlatformPersistenceGuard.moduleKey,scope,[key]);
    const row=(data?.items||[]).find(x=>String(x.state_key)===String(key)&&!x.deleted_at);
    if(row){
      const cloud=String(row.payload?.value??''),local=String(localStorage.getItem(key)??'');
      if(cloud!==local)throw new Error('النسخة السحابية لا تطابق النسخة المحلية.');
      return {cloud:true,backend:'platform_state'};
    }
  }
  if(window.IndependentSchoolPersistence?.mirrorNow){
    const ok=await IndependentSchoolPersistence.mirrorNow(key,localStorage.getItem(key),'save');
    if(!ok)throw new Error('فشل التحقق من المرآة السحابية.');
    return {cloud:true,backend:'safe_mirror'};
  }
  return {cloud:false,backend:'local_only'};
}
async function save(role,p){
  const cfg=CFG[role],r=normalize(role,p),list=rows(cfg.key);
  const same=list.filter(x=>
    safe(x.folderId)===safe(r.folderId) &&
    normalizeYear(x.academicYear||x.year)===r.academicYear &&
    normalizeSemester(x.semester||x.term)===r.semester
  );
  r.duplicateNo=r.duplicateNo||same.length+1;
  r.displayName=r.displayName||((safe(p.baseName||p.personName||p.className)||r.title)+' - '+r.semester+' - نسخة '+r.duplicateNo);
  list.push(r);
  localStorage.setItem(cfg.key,JSON.stringify(list));

  const check=rows(cfg.key),saved=check.find(x=>safe(x.id)===safe(r.id));
  if(!saved)throw new Error('لم يظهر السجل بعد الحفظ في الأرشيف.');
  if(safe(saved.folderId)!==safe(r.folderId)||safe(saved.folderName)!==safe(r.folderName))throw new Error('تم حفظ السجل في مجلد غير صحيح.');
  if(normalizeYear(saved.academicYear)!==r.academicYear||normalizeSemester(saved.semester)!==r.semester)throw new Error('تم حفظ السجل في فصل/عام غير صحيح.');
  const folderRows=check.filter(x=>
    safe(x.folderId)===safe(r.folderId) &&
    normalizeYear(x.academicYear||x.year)===r.academicYear &&
    normalizeSemester(x.semester||x.term)===r.semester
  );
  if(!folderRows.some(x=>safe(x.id)===safe(r.id)))throw new Error('السجل غير ظاهر داخل مجلده وفي نطاق الفصل الدراسي الصحيح.');
  const cloud=await verifyCloud(cfg.key);
  return {ok:true,record:saved,folderCount:folderRows.length,...cloud};
}
async function update(role,id,patch){
  const cfg=CFG[role],list=rows(cfg.key),i=list.findIndex(x=>safe(x.id)===safe(id));
  if(i<0)throw new Error('السجل غير موجود.');
  const next=normalize(role,Object.assign({},list[i],patch||{},{
    id:list[i].id,createdAt:list[i].createdAt,
    academicYear:(patch&&patch.academicYear)||list[i].academicYear,
    semester:(patch&&patch.semester)||list[i].semester
  }));
  list[i]=next;
  localStorage.setItem(cfg.key,JSON.stringify(list));
  const saved=rows(cfg.key).find(x=>safe(x.id)===safe(id));
  if(!saved||safe(saved.folderId)!==safe(next.folderId))throw new Error('فشل التحقق من التعديل.');
  if(normalizeYear(saved.academicYear)!==next.academicYear||normalizeSemester(saved.semester)!==next.semester)throw new Error('فشل الحفاظ على نطاق الفصل الدراسي أثناء التعديل.');
  const cloud=await verifyCloud(cfg.key);
  return {ok:true,record:saved,...cloud};
}
function list(role,folderId,filters){
  const cfg=CFG[role],f=filters||{},ctx=activeAcademicContext();
  const year=normalizeYear(f.academicYear||ctx.academicYear);
  const semester=normalizeSemester(f.semester||ctx.semester);
  return rows(cfg.key).filter(x=>{
    if(folderId&&safe(x.folderId)!==safe(folderId))return false;
    if(f.allTerms===true)return true;
    return normalizeYear(x.academicYear||x.year)===year && normalizeSemester(x.semester||x.term)===semester;
  });
}
function all(role){const cfg=CFG[role];return rows(cfg.key)}
function remove(role,id){
  const cfg=CFG[role],list=rows(cfg.key),target=list.find(x=>safe(x.id)===safe(id));
  if(!target)return false;
  try{
    const k=cfg.key+':deleted',d=rows(k);
    d.unshift({deletedAt:now(),record:target});
    localStorage.setItem(k,JSON.stringify(d.slice(0,100)));
  }catch(e){}
  localStorage.setItem(cfg.key,JSON.stringify(list.filter(x=>safe(x.id)!==safe(id))));
  return true;
}
window.RemainingRoleRecordsArchiveEngine={
  version:'2.0.0',save,update,list,all,remove,config:CFG,
  activeAcademicContext,normalizeYear,normalizeSemester,contextKey
};
})();