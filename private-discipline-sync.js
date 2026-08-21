(function(g){
'use strict';
if(g.__privateDisciplineSyncLoaded)return;g.__privateDisciplineSyncLoaded=true;
const wait=ms=>new Promise(r=>setTimeout(r,ms));
function dates(a,b){const out=[],s=new Date(String(a||'')+'T00:00:00'),e=new Date(String(b||a||'')+'T00:00:00');if(!a||isNaN(s)||isNaN(e))return out;for(let d=new Date(s);d<=e&&out.length<370;d.setDate(d.getDate()+1))out.push(d.toISOString().slice(0,10));return out}
async function boot(){
  try{
    for(let i=0;i<30&&!g.PrivateSchoolBridge;i++)await wait(100);
    if(!g.PrivateSchoolBridge)return;
    const ctx=await g.PrivateSchoolBridge.requireContext();
    if(!['manager','agent'].includes(ctx.role))return;
    for(let i=0;i<30;i++){try{if(typeof state!=='undefined'&&state.records&&state.staff)break}catch(_){}await wait(100)}
    if(typeof state==='undefined'||!Array.isArray(state.records)||!Array.isArray(state.staff))return;
    const [mr,dr]=await Promise.all([g.PrivateSchoolBridge.workflows('list_discipline_movements'),g.PrivateSchoolBridge.directory('list')]);
    const users=new Map((dr.users||dr.members||[]).map(u=>[String(u.userId||u.user_id),u]));
    let changed=false;
    for(const m of mr.movements||[]){
      const uid=String(m.user_id||''),u=users.get(uid)||{};
      if(uid&&!state.staff.some(x=>String(x.id)===uid)){state.staff.push({id:uid,name:u.fullName||u.full_name||u.email||'مستخدم المدرسة',title:u.role||'',dept:'',phone:'',status:'على رأس العمل',source:'private-school-directory'});changed=true}
      const ds=m.request_type==='permission'?[String(m.start_at||'').slice(0,10)]:dates(m.start_at,m.end_at);
      for(const day of ds){if(!day)continue;const rid='approved-request:'+m.request_id+':'+day;if(state.records.some(x=>String(x.id)===rid))continue;const type=m.request_type==='permission'?'استئذان':'غياب بعذر';const excuse=m.request_type==='leave'?'إجازة معتمدة':'طلب '+(m.request_type==='absence'?'غياب':'استئذان')+' معتمد';state.records.unshift({id:rid,date:day,employeeId:uid,type,minutes:m.request_type==='permission'?Number(m.minutes||0):0,excuse,excuseStatus:'مقبول',notes:'حركة آلية من طلب حالة انضباط معتمد نهائيًا',source:'approved_employee_request',sourceRequestId:m.request_id,sourceMovementId:m.id,createdAt:m.approved_at,updatedAt:m.updated_at||m.approved_at,lockedFromApproval:true});changed=true}
    }
    if(changed){try{localStorage.setItem(DBKEY,JSON.stringify(state))}catch(_){};if(typeof renderAll==='function')renderAll();if(typeof scheduleDisciplineCloudSave==='function')scheduleDisciplineCloudSave();if(typeof toast==='function')toast('تمت مزامنة الطلبات المعتمدة مع سجل الانضباط')}
  }catch(e){console.warn('[private-discipline-sync]',e)}
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(boot,500));else setTimeout(boot,500);
})(window);
