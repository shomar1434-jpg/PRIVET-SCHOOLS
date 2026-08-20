(function(g){
'use strict';
const privateMode=localStorage.getItem('smart_school_private_edition')==='private' && !!sessionStorage.getItem('smart_school_private_session_v1');
if(!privateMode||!g.PrivateSchoolBridge)return;
let taskCache=[];
let directoryCache=[];
let busy=false;
const ctx=()=>g.PrivateSchoolBridge.privateContext()||{};
const escText=v=>String(v??'');
const roleNorm=r=>{r=String(r||'').toLowerCase();if(r==='administrative_employee')return'admin_employee';return r};
const extraCode=v=>({'التوجيه الصحي':'health_guidance','موجه صحي':'health_guidance','الموجه الصحي':'health_guidance','health_guidance':'health_guidance','محضر المختبر':'lab_preparator','مختبر':'lab_preparator','مصادر التعلم':'learning_resources','الموهوبين':'gifted_coordinator','منسق الموهوبين':'gifted_coordinator'}[String(v||'').trim()]||String(v||'').trim());
function normalizeTask(t){
 const meta=t?.metadata||{};
 return {...t,
   task_id:t.id||t.task_id,
   assignee_id:t.assigned_to||t.assignee_id||'',
   owner_id:t.created_by||t.owner_id||'',
   owner_email:t.owner_email||'',
   record_key:t.record_key||meta.resolvedDisplayName||t.record_type||'',
   pending_updates:Array.isArray(t.pending_updates)?t.pending_updates:[],
   approved_updates:Array.isArray(t.approved_updates)?t.approved_updates:[],
   evidence:Array.isArray(t.evidence)?t.evidence:[],
   history:Array.isArray(t.history)?t.history:[]
 };
}
function replaceTask(t){const nt=normalizeTask(t),i=taskCache.findIndex(x=>x.task_id===nt.task_id);if(i>=0)taskCache[i]=nt;else taskCache.unshift(nt);return nt}
async function refreshTasks(){const r=await g.PrivateSchoolBridge.tasks('list',{limit:1000});taskCache=(r.tasks||[]).map(normalizeTask);try{renderAll()}catch(_){}}
async function refreshDirectory(){
 const c=ctx(); if(!['owner','manager','agent'].includes(c.role)){directoryCache=[];return}
 const r=await g.PrivateSchoolBridge.directory('list');directoryCache=(r.members||[]).map(m=>({id:m.userId||m.email,name:m.fullName||m.email,email:m.email||'',role:roleNorm(m.role),status:m.status||'active',schoolId:c.schoolId,membershipId:m.membershipId}));
 try{populateUsers()}catch(_){}
}
function showError(err){console.error('[private-school-task-bridge]',err);alert(err?.message||'تعذر تنفيذ العملية السحابية')}
async function run(fn){if(busy)return;busy=true;try{return await fn()}catch(e){showError(e)}finally{busy=false}}
const originalMode=g.mode;
g.mode=function(){const q=new URLSearchParams(location.search).get('mode');if(q)return q;return ['owner','manager','agent'].includes(ctx().role)?'owner':'assignee'};
g.role=function(){return ctx().role||'user'};
g.currentSchoolId=function(){return ctx().schoolId||''};
g.currentAssigneeId=function(){return ctx().userId||''};
g.currentAssigneeEmail=function(){return String(ctx().userEmail||'').toLowerCase()};
g.tasks=function(){return taskCache};
g.saveTasks=function(){};
g.collectUsers=function(){return directoryCache.slice()};
g.isMine=function(t){const c=ctx();return String(t?.assignee_id||t?.assigned_to||'')===String(c.userId||'')||(c.userEmail&&String(t?.assignee_email||'').toLowerCase()===String(c.userEmail).toLowerCase())};
g.routeTaskToAssignee=function(){};g.removeTaskRoute=function(){};g.pushNotice=function(){};
g.populateUsers=function(){const el=document.getElementById('assigneeId');if(!el)return;const admins=directoryCache.filter(u=>u.role==='admin_employee');const others=directoryCache.filter(u=>u.role!=='admin_employee');let html=others.map(u=>`<option value="${esc(u.id)}" data-role="${esc(u.role)}" data-email="${esc(u.email)}">${esc(u.name)} — ${esc(roleLabel(u.role))}</option>`).join('');if(admins.length){html+=(html?'<option disabled>──────── الموظفون الإداريون ────────</option>':'<option disabled>──────── الموظفون الإداريون ────────</option>')+admins.map(u=>`<option value="${esc(u.id)}" data-role="${esc(u.role)}" data-email="${esc(u.email)}">${esc(u.name)} — الموظف/ة الإداري/ة</option>`).join('')}el.innerHTML=html||'<option value="">لا يوجد أعضاء نشطون متاحون للتكليف</option>'};
g.getTask=function(id){return taskCache.find(t=>t.task_id===id)};
g.setTask=function(next){replaceTask(next);try{renderAll()}catch(_){}};
g.createTask=function(e){e.preventDefault();return run(async()=>{
 const sel=document.getElementById('assigneeId'),u=directoryCache.find(x=>String(x.id)===String(sel?.value));if(!u)throw new Error('اختر مستخدمًا مكلفًا من أعضاء المدرسة النشطين');
 const assignmentType=document.getElementById('taskType').value,recordLabel=document.getElementById('recordKey').value,sourceOwner=document.getElementById('sourceOwner').value;
 const r=await g.PrivateSchoolBridge.tasks('create',{
   title:document.getElementById('taskTitle').value,description:document.getElementById('taskDesc').value,
   assignmentType,sourceOwner,recordKey:assignmentType==='additional_role'?extraCode(recordLabel):recordLabel,recordLabel,
   assignedTo:u.id,assigneeEmail:u.email,assigneeName:u.name,assigneeRole:u.role,
   priority:document.getElementById('priority').value,startDate:document.getElementById('startDate').value,dueDate:document.getElementById('dueDate').value,
   ownerLabel:currentOwnerLabel(),requiresApproval:true
 });replaceTask(r.task);resetForm();switchView('active');await g.PrivateSchoolBridge.establishContext(ctx().schoolId,ctx().role);
 })};
g.startWork=function(id){return run(async()=>{let t=g.getTask(id);if(!t)return; if(['active','transferred','returned'].includes(t.status)){const r=await g.PrivateSchoolBridge.tasks('transition',{taskId:id,status:'in_progress',note:'بدأ المكلف العمل على التكليف'});t=replaceTask(r.task);renderAll()} const route=t?.metadata?.resolvedRoute;if(route&&route!=='central_task_center.html'){location.href=route+(route.includes('?')?'&':'?')+'privateEdition=1&source=central_task&task_id='+encodeURIComponent(id)}})};
g.saveUpdate=function(e,id){e.preventDefault();return run(async()=>{
 const title=document.getElementById('updTitle').value,notes=document.getElementById('updDesc').value,link=document.getElementById('updLink').value,file=document.getElementById('updFile').files[0];
 const ur=await g.PrivateSchoolBridge.tasks('add-update',{taskId:id,title,notes,linkUrl:link,updateType:'execution',status:'submitted'});
 if(file){const fr=await g.PrivateSchoolBridge.uploadModuleFile({moduleKey:'private_school_tasks',file,slotKey:id,recordType:'central_task_evidence',recordId:id,displayName:file.name});await g.PrivateSchoolBridge.tasks('attach-evidence',{taskId:id,platformFileId:fr.file.id,updateId:ur.update?.id||''});}
 closeModal();await refreshTasks();renderList();
 })};
g.submitForApproval=function(id){return run(async()=>{const r=await g.PrivateSchoolBridge.tasks('transition',{taskId:id,status:'pending_approval',note:'أرسل المكلف العمل للاعتماد'});replaceTask(r.task);renderList()})};
g.approveTask=function(id){return run(async()=>{const r=await g.PrivateSchoolBridge.tasks('transition',{taskId:id,status:'approved',note:'تم اعتماد التكليف'});replaceTask(r.task);switchView('approved');await g.PrivateSchoolBridge.establishContext(ctx().schoolId)})};
g.returnTask=function(id){const note=prompt('ملاحظات الإعادة للتعديل:')||'';return run(async()=>{const r=await g.PrivateSchoolBridge.tasks('transition',{taskId:id,status:'returned',note});replaceTask(r.task);switchView('returned')})};
g.rejectTask=function(id){const note=prompt('سبب الرفض النهائي:')||'';return run(async()=>{const r=await g.PrivateSchoolBridge.tasks('transition',{taskId:id,status:'rejected',note});replaceTask(r.task);switchView('rejected');await g.PrivateSchoolBridge.establishContext(ctx().schoolId)})};
g.withdrawTask=function(id){if(!confirm('سيتم سحب التكليف وإلغاء التفويض الحالي مع حفظ الأعمال السابقة. هل تريد المتابعة؟'))return;return run(async()=>{const r=await g.PrivateSchoolBridge.tasks('transition',{taskId:id,status:'withdrawn',note:'تم سحب التكليف'});replaceTask(r.task);switchView('withdrawn');await g.PrivateSchoolBridge.establishContext(ctx().schoolId)})};
g.archiveTask=function(id){return run(async()=>{const r=await g.PrivateSchoolBridge.tasks('transition',{taskId:id,status:'archived',note:'تمت أرشفة التكليف'});replaceTask(r.task);switchView('archived');await g.PrivateSchoolBridge.establishContext(ctx().schoolId)})};
g.reassignTask=function(id){return run(async()=>{const u=directoryCache.find(x=>String(x.id)===String(document.getElementById('newAssignee')?.value));if(!u)throw new Error('اختر المكلف الجديد');const r=await g.PrivateSchoolBridge.tasks('reassign',{taskId:id,assignedTo:u.id,assigneeEmail:u.email,assigneeName:u.name,assigneeRole:u.role,reason:document.getElementById('transferNote')?.value||'نقل التكليف'});replaceTask(r.task);closeModal();switchView('active');await g.PrivateSchoolBridge.establishContext(ctx().schoolId)})};
g.showHistory=function(id){return run(async()=>{const r=await g.PrivateSchoolBridge.tasks('get',{taskId:id}),t=replaceTask({...r.task,pending_updates:(r.updates||[]).map(u=>({id:u.id,title:u.title||u.update_type,desc:u.notes,link:u.link_url,at:u.created_at,status:u.status})),evidence:r.evidence||[],history:(r.events||[]).map(ev=>({action:ev.event_type,note:ev.event_note,at:ev.created_at,status:ev.new_values?.status||r.task.status,by:'سحابي'}))});let prev=(r.assignments||[]).filter(a=>!a.is_current).map(p=>`<div class="bg-blue-50 rounded-2xl p-3 mb-2 text-xs font-bold text-blue-900">منفذ سابق: ${esc(p.assignee_name||p.assignee_email||'')} — ${p.ended_at?new Date(p.ended_at).toLocaleString('ar-SA'):'-'} — السبب: ${esc(p.assignment_reason||'')}</div>`).join('');let hist=t.history.map(h=>`<div class="audit-line bg-slate-50 rounded-2xl p-3 mb-2"><div class="font-black text-slate-800 text-sm">${esc(h.action)}</div><div class="text-xs text-slate-500 font-bold">${h.at?new Date(h.at).toLocaleString('ar-SA'):'-'}</div><p class="text-xs text-slate-600 mt-1">${esc(h.note||'')}</p></div>`).join('');openModal('السجل التاريخي للتكليف',prev+hist||'<p class="text-slate-400 text-center font-bold">لا توجد أحداث.</p>')})};
async function init(){try{await Promise.all([refreshTasks(),refreshDirectory()]);const c=ctx();if(!['owner','manager','agent'].includes(c.role))initAssigneeMode();else renderAll()}catch(e){showError(e)}}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
g.__privateSchoolTaskBridge={refreshTasks,refreshDirectory,get cache(){return taskCache}};
})(window);
