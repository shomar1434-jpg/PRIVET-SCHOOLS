(function(){
'use strict';
if(window.__PERFORMANCE_REPORT_ARCHIVE_ENGINE_V6__)return;
window.__PERFORMANCE_REPORT_ARCHIVE_ENGINE_V6__=true;

function parse(v,f){try{return JSON.parse(v||'')??f}catch(e){return f}}
function clean(v){return String(v==null?'':v).replace(/\s+/g,' ').trim()}
function page(){return (location.pathname.split('/').pop()||'').toLowerCase()}
function role(){const p=page();if(p.includes('manager'))return'manager';if(p.includes('agent'))return'agent';if(p.includes('student_advisor'))return'student_advisor';if(p.includes('activity_leader'))return'activity_leader';if(p.includes('health_advisor'))return'health_advisor';if(p.includes('kindergarten_teacher'))return'kindergarten_teacher';return'teacher'}
function archiveKey(){return ['manager','agent'].includes(role())?'school_reports':'reports_archive'}
function isPrivate(){return localStorage.getItem('smart_school_private_edition')==='private'||new URLSearchParams(location.search).get('privateEdition')==='1'||new URLSearchParams(location.search).get('schoolMode')==='private'}
function toast(msg,bad){try{if(typeof window.showToast==='function'){window.showToast(msg);return}}catch(e){} if(bad)console.error(msg);else console.info(msg)}
function categorySelect(){return document.getElementById('categorySelect')}
function root(){return document.getElementById('report-content-container')}
function fieldTitle(){return clean(document.getElementById('field_prog_name')?.innerText||'')||'تقرير تنفيذ'}
function categoryCatalog(){
 const out=[],seen=new Set();
 function add(id,name){id=clean(id);name=clean(name);if(!id||!name||seen.has(id))return;seen.add(id);out.push({id,name})}
 try{if(window.CATEGORY_DATA&&typeof window.CATEGORY_DATA==='object')Object.keys(window.CATEGORY_DATA).forEach(id=>{const c=window.CATEGORY_DATA[id]||{};add(id,c.name||c.title||id)})}catch(e){}
 try{if(Array.isArray(window.ALL_CATEGORIES))window.ALL_CATEGORIES.forEach(c=>add(c.id||c.value,c.name||c.title||c.label||c.id))}catch(e){}
 const s=categorySelect();if(s)Array.from(s.options||[]).forEach(o=>{if(clean(o.value))add(o.value,o.textContent||o.value)});
 return out;
}
function normalizeLabel(s){return clean(s).replace(/^\d+[\.\-–—\s]+/,'')}
function selectedCategory(){
 const s=categorySelect(),raw=clean(s?.value);if(!raw)return null;
 const cats=categoryCatalog();let c=cats.find(x=>x.id===raw);
 if(!c){const label=normalizeLabel(s?.options?.[s.selectedIndex]?.textContent||raw);c=cats.find(x=>normalizeLabel(x.name)===label)}
 return c||{id:raw,name:normalizeLabel(s?.options?.[s.selectedIndex]?.textContent||raw)||raw};
}
function syncControls(){
 const r=root();if(!r)return;
 r.querySelectorAll('select').forEach(s=>{Array.from(s.options||[]).forEach(o=>{if(o.value===s.value)o.setAttribute('selected','selected');else o.removeAttribute('selected')});s.setAttribute('data-saved-value',s.value||'')});
 r.querySelectorAll('input').forEach(i=>{if(i.type==='checkbox'||i.type==='radio'){if(i.checked)i.setAttribute('checked','checked');else i.removeAttribute('checked')}else i.setAttribute('value',i.value||'')});
 r.querySelectorAll('textarea').forEach(t=>t.textContent=t.value||'');
}
function formState(){
 const r=root(),state={selects:{},inputs:{},goals:{}};if(!r)return state;
 r.querySelectorAll('select[id]').forEach(s=>state.selects[s.id]=s.value);
 r.querySelectorAll('input[id],textarea[id]').forEach(i=>state.inputs[i.id]=(i.type==='checkbox'||i.type==='radio')?!!i.checked:i.value);
 r.querySelectorAll('[id^="subGoal-"]').forEach(g=>state.goals[g.id]={html:g.innerHTML,text:g.innerText,userGoal:true});
 return state;
}
function currentId(){try{return typeof currentEditingId!=='undefined'&&currentEditingId!=null&&currentEditingId!==''?currentEditingId:null}catch(e){return null}}
function setCurrentId(v){try{currentEditingId=v}catch(e){}}
function selectedReportDate(){
 const d=document.getElementById('dateInputHeader');if(d&&d.value)return d.value;
 try{if(typeof getSelectedReportDateDisplay==='function')return getSelectedReportDateDisplay()||''}catch(e){}
 return '';
}
function completion(){try{if(typeof checkReportCompletionStatus==='function')return !!checkReportCompletionStatus()?.isComplete}catch(e){}return true}
function getRows(key){const a=parse(localStorage.getItem(key)||'[]',[]);return Array.isArray(a)?a:[]}
function saveRows(key,a){localStorage.setItem(key,JSON.stringify(a))}
function repairRows(key){
 const cats=categoryCatalog(),byId=new Map(cats.map(c=>[c.id,c])),byName=new Map(cats.map(c=>[normalizeLabel(c.name),c]));let rows=getRows(key),changed=false;
 rows=rows.map(r=>{if(!r||typeof r!=='object')return r;let c=byId.get(clean(r.category||r.folderId||''))||byName.get(normalizeLabel(r.categoryName||r.folderName||r.category||''));if(!c)return r;const n=Object.assign({},r);if(n.category!==c.id){n.category=c.id;changed=true}if(n.folderId!==c.id){n.folderId=c.id;changed=true}if(n.folderName!==c.name){n.folderName=c.name;changed=true}if(n.categoryName!==c.name){n.categoryName=c.name;changed=true}return n});
 if(changed)saveRows(key,rows);return rows;
}
async function cloudVerify(key){
 if(!isPrivate())return {ok:true,mode:'local'};
 const guard=window.PlatformPersistenceGuard,engine=window.PlatformStateEngine;
 if(!guard||!engine)throw new Error('محرك المزامنة السحابية لتقارير الأداء غير جاهز. أعد فتح القسم بعد تحديث الصفحة.');
 await guard.flush();
 const scope=typeof guard.scopeFor==='function'?guard.scopeFor(key):'school';
 const res=await engine.pull(guard.moduleKey,scope,[key]);
 const row=(res?.items||[]).find(x=>String(x.state_key)===key&&!x.deleted_at);
 if(!row)throw new Error('لم يظهر أرشيف تقارير الأداء في التخزين السحابي بعد الحفظ.');
 const cloud=String(row.payload&&Object.prototype.hasOwnProperty.call(row.payload,'value')?row.payload.value:'');
 const local=String(localStorage.getItem(key)||'');
 if(cloud!==local)throw new Error('فشل التحقق من تطابق التقرير المحلي مع النسخة السحابية.');
 return {ok:true,mode:'cloud'};
}
async function canonicalSave(){
 const cat=selectedCategory();if(!cat){toast('اختر المجال أولاً ⚠️',true);return false}
 syncControls();
 const key=archiveKey(),state=formState(),rows=repairRows(key),existingId=currentId();
 let idx=existingId!=null?rows.findIndex(r=>String(r?.id)===String(existingId)):-1;
 const id=idx>=0?rows[idx].id:(existingId!=null?existingId:Date.now());
 const previous=idx>=0?rows[idx]:{};
 const now=Date.now(),prep=new Date().toLocaleDateString('ar-SA');
 const data=Object.assign({},previous,{
   id,
   title:fieldTitle(),
   category:cat.id,
   categoryName:cat.name,
   folderId:cat.id,
   folderName:cat.name,
   performanceDomainId:cat.id,
   performanceDomainName:cat.name,
   reportType:'execution_report',
   archiveType:'performance_report',
   content:root()?.innerHTML||previous.content||'',
   formState:state,
   savedDropdowns:state.selects,
   manualDetailedGoals:state.goals,
   reportDate:selectedReportDate()||previous.reportDate||'',
   date:previous.date||prep,
   createdAt:previous.createdAt||prep,
   updatedAt:new Date().toISOString(),
   saveTimestamp:now,
   isComplete:completion()
 });
 if(idx>=0)rows[idx]=data;else rows.push(data);
 saveRows(key,rows);setCurrentId(id);
 const check=getRows(key).find(r=>String(r?.id)===String(id));
 if(!check)throw new Error('لم يتم العثور على التقرير بعد عملية الحفظ.');
 if(String(check.category)!==String(cat.id)||String(check.folderId)!==String(cat.id))throw new Error('حُفظ التقرير لكن لم يرتبط بمجلد المجال المختار.');
 if(String(check.folderName)!==String(cat.name))throw new Error('اسم مجلد المجال لا يطابق المجال المختار.');
 const folderCount=getRows(key).filter(r=>String(r?.category)===String(cat.id)).length;
 if(folderCount<1)throw new Error('فشل اختبار ظهور التقرير داخل مجلد المجال.');
 try{if(typeof refreshDashboardMetrics==='function')refreshDashboardMetrics()}catch(e){}
 try{if(typeof saveDraftSnapshot==='function')saveDraftSnapshot(true)}catch(e){}
 try{if(typeof updateDashboardMetrics==='function')updateDashboardMetrics()}catch(e){}
 toast('تم حفظ تقرير التنفيذ داخل مجلد «'+cat.name+'»، جارٍ التحقق السحابي...');
 try{const cv=await cloudVerify(key);toast(cv.mode==='cloud'?'تم حفظ تقرير التنفيذ والتحقق من مجلد المجال سحابيًا ✅':'تم حفظ تقرير التنفيذ داخل مجلد المجال ✅');return true}
 catch(e){toast('تم حفظ التقرير محليًا داخل المجال، لكن فشل التحقق السحابي: '+(e?.message||e),true);throw e}
}
function install(){
 if(typeof window.saveReportToArchive!=='function')return false;
 window.saveReportToArchive=canonicalSave;
 window.saveReportToArchive.__performanceArchiveV6=true;
 return true;
}
repairRows(archiveKey());
if(!install()){document.addEventListener('DOMContentLoaded',()=>setTimeout(install,0),{once:true});setTimeout(install,500)}
window.PerformanceReportArchiveEngine={version:'6.0.0',archiveKey,selectedCategory,repairRows,save:canonicalSave,cloudVerify};
})();