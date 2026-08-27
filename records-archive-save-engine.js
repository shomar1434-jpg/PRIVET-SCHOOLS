(function(){
'use strict';
if(window.RecordsArchiveSaveEngine)return;

const CFG={
 manager:{key:'school_manager_records_archive_v1',moduleKey:'manager_records_archive_state'},
 agent:{key:'wakil_records_pdf_archive_v3',moduleKey:'agent_records_archive_state'}
};
function parse(v,f){try{return JSON.parse(v)}catch(e){return f}}
function safe(v){return String(v==null?'':v).trim()}
function now(){return new Date().toISOString()}
function arr(key){const a=parse(localStorage.getItem(key)||'[]',[]);return Array.isArray(a)?a:[]}
function uniqueId(prefix){return prefix+'_'+Date.now()+'_'+Math.random().toString(36).slice(2,8)}
function normalize(role,record,catalog){
 const cfg=CFG[role]; if(!cfg)throw new Error('نوع الأرشيف غير مدعوم');
 const r=Object.assign({},record||{});
 const folderId=safe(r.folderId||r.formId||r.recordId);
 const folder=(catalog||[]).find(x=>safe(x.id)===folderId);
 if(!folderId)throw new Error('تعذر تحديد معرف السجل المراد حفظه.');
 if(!folder)throw new Error('السجل لا يملك مجلدًا مطابقًا داخل أرشيف السجلات: '+folderId);
 r.folderId=folder.id;
 r.folderName=folder.name;
 r.formId=r.formId||folder.id;
 r.recordId=r.recordId||folder.id;
 r.title=r.title||folder.name;
 r.id=r.id||uniqueId(role==='manager'?'manager_record':'agent_record');
 r.createdAt=r.createdAt||now();
 r.updatedAt=now();
 return r;
}
async function verifyCloud(role,key){
 try{
   if(window.PlatformPersistenceGuard?.flush){
     await PlatformPersistenceGuard.flush();
   }
   if(window.PlatformStateEngine?.pull && window.PlatformPersistenceGuard?.moduleKey){
     const scope=typeof PlatformPersistenceGuard.scopeFor==='function'?PlatformPersistenceGuard.scopeFor(key):'user';
     const data=await PlatformStateEngine.pull(PlatformPersistenceGuard.moduleKey,scope,[key]);
     const row=(data?.items||[]).find(x=>String(x.state_key)===String(key)&&!x.deleted_at);
     if(row){
       const cloud=String(row.payload?.value??'');
       const local=String(localStorage.getItem(key)??'');
       if(cloud!==local)throw new Error('النسخة السحابية لا تطابق النسخة المحلية.');
       return {cloud:true,backend:'platform_state'};
     }
   }
   if(window.IndependentSchoolPersistence?.mirrorNow){
     const ok=await IndependentSchoolPersistence.mirrorNow(key,localStorage.getItem(key),'save');
     if(!ok)throw new Error('تعذر التحقق من المرآة السحابية.');
     return {cloud:true,backend:'safe_mirror'};
   }
   return {cloud:false,backend:'local_only'};
 }catch(e){
   throw new Error('تم الحفظ محليًا لكن فشل التحقق السحابي: '+(e?.message||e));
 }
}
async function save(role,record,catalog){
 const cfg=CFG[role],r=normalize(role,record,catalog);
 const rows=arr(cfg.key);
 const same=rows.filter(x=>safe(x.folderId)===safe(r.folderId));
 if(!r.duplicateNo)r.duplicateNo=same.length+1;
 if(!r.displayName)r.displayName=(r.title||r.folderName)+' - نسخة '+r.duplicateNo;
 rows.push(r);
 localStorage.setItem(cfg.key,JSON.stringify(rows));

 // التحقق من أن السجل ظهر فعلًا في المجلد المرتبط باسمه/معرفه.
 const reread=arr(cfg.key);
 const saved=reread.find(x=>safe(x.id)===safe(r.id));
 if(!saved)throw new Error('لم يظهر السجل بعد الحفظ داخل أرشيف السجلات.');
 if(safe(saved.folderId)!==safe(r.folderId))throw new Error('تم حفظ السجل في مجلد غير صحيح.');
 const folderRows=reread.filter(x=>safe(x.folderId)===safe(r.folderId));
 if(!folderRows.some(x=>safe(x.id)===safe(r.id)))throw new Error('السجل غير ظاهر عند فتح مجلد السجل.');
 const cloud=await verifyCloud(role,cfg.key);
 return {ok:true,record:saved,folderCount:folderRows.length,...cloud};
}
async function update(role,id,patch,catalog){
 const cfg=CFG[role],rows=arr(cfg.key),idx=rows.findIndex(x=>safe(x.id)===safe(id));
 if(idx<0)throw new Error('تعذر العثور على السجل المراد تعديله.');
 const next=normalize(role,Object.assign({},rows[idx],patch||{}, {id:rows[idx].id,createdAt:rows[idx].createdAt}),catalog);
 rows[idx]=next;
 localStorage.setItem(cfg.key,JSON.stringify(rows));
 const reread=arr(cfg.key),saved=reread.find(x=>safe(x.id)===safe(id));
 if(!saved||safe(saved.folderId)!==safe(next.folderId))throw new Error('فشل التحقق من حفظ التعديل داخل المجلد الصحيح.');
 const cloud=await verifyCloud(role,cfg.key);
 return {ok:true,record:saved,...cloud};
}
window.RecordsArchiveSaveEngine={version:'1.0.0',save,update,normalize,managerKey:CFG.manager.key,agentKey:CFG.agent.key};
})();