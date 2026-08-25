(function(){
'use strict';
if(window.IndependentSchoolPersistence)return;

const PREFIX='ISP_SAFE_V1:';
const HISTORY_PREFIX=PREFIX+'history:';
const CLOUD_REF_PREFIX=PREFIX+'cloudRef:';
const DIAG_PREFIX=PREFIX+'diag:';
const MAX_HISTORY=12;
const nativeSet=Storage.prototype.setItem;
const nativeGet=Storage.prototype.getItem;
const nativeRemove=Storage.prototype.removeItem;

function safe(v){return String(v==null?'':v)}
function parse(v,d){try{return JSON.parse(v)}catch(e){return d}}
function now(){return new Date().toISOString()}
function schoolId(){
  try{
    const s=parse(nativeGet.call(localStorage,'smartSchool.currentSchool')||nativeGet.call(localStorage,'activeSchool')||'{}',{});
    return safe(nativeGet.call(localStorage,'current_school_id')||nativeGet.call(localStorage,'active_school_id')||nativeGet.call(localStorage,'smart_school_id')||s.id||s.school_id||'independent-school');
  }catch(e){return 'independent-school'}
}
function userId(){
  try{
    const u=parse(nativeGet.call(localStorage,'smartSchool.currentUser')||nativeGet.call(localStorage,'currentUser')||'{}',{});
    return safe(nativeGet.call(localStorage,'current_user_id')||nativeGet.call(localStorage,'user_id')||u.id||u.user_id||u.email||'user');
  }catch(e){return 'user'}
}
function monitored(key){
  const k=safe(key);
  if(!k || k.startsWith(PREFIX))return false;
  return /(^|:|_)(reports_archive|school_reports|manager_self_evaluation_archive|self_evaluation_archive|school_manager_records_archive|manager_records_archive|admin_employee_plans|administrative_employee_plans|ss_meeting_template_saved|ss_meeting_template_html|deputyWeeklyTeacherManualProfiles|deputyWeeklyFollowup|weeklyFollowup|minutes_)/i.test(k)
    || /_minutes_(manager|agent|teacher|student_advisor|activity_leader|health_advisor|kindergarten_teacher)/i.test(k);
}
function histKey(key){return HISTORY_PREFIX+schoolId()+':'+key}
function diagKey(){return DIAG_PREFIX+schoolId()}
function cloudRefKey(key){return CLOUD_REF_PREFIX+schoolId()+':'+key}
function addHistory(key,oldValue,reason){
  if(oldValue==null)return;
  try{
    const hk=histKey(key);
    let arr=parse(nativeGet.call(localStorage,hk)||'[]',[]);
    if(!Array.isArray(arr))arr=[];
    if(arr.length && arr[0] && arr[0].value===oldValue)return;
    arr.unshift({at:now(),reason:reason||'update',value:oldValue});
    arr=arr.slice(0,MAX_HISTORY);
    nativeSet.call(localStorage,hk,JSON.stringify(arr));
  }catch(e){}
}
function addDiag(evt){
  try{
    const dk=diagKey();
    let arr=parse(nativeGet.call(localStorage,dk)||'[]',[]);
    if(!Array.isArray(arr))arr=[];
    arr.unshift(Object.assign({at:now()},evt||{}));
    nativeSet.call(localStorage,dk,JSON.stringify(arr.slice(0,80)));
  }catch(e){}
}
function safeName(key){return safe(key).replace(/[\\/:*?"<>|]+/g,'-').replace(/\s+/g,'_').slice(0,120)||'state'}
const mirrorTimers=new Map();
async function waitCloud(timeout=4500){
  const start=Date.now();
  while(!window.CloudFileEngine){
    if(Date.now()-start>=timeout)return null;
    await new Promise(r=>setTimeout(r,120));
  }
  return window.CloudFileEngine;
}
async function mirrorNow(key,value,operation){
  try{
    const engine=await waitCloud();
    if(!engine){addDiag({type:'cloud-skip',key,reason:'CloudFileEngine unavailable'});return false}
    const filename=safeName(key)+'.json';
    const payloadText=JSON.stringify({
      schema:'independent-school-safe-state-v1',
      schoolId:schoolId(),
      userId:userId(),
      key,
      operation:operation||'save',
      savedAt:now(),
      value: value==null?null:parse(value,value)
    },null,2);
    const file=new File([payloadText],filename,{type:'application/json;charset=utf-8'});
    const refKey=cloudRefKey(key);
    const previous=nativeGet.call(localStorage,refKey)||'';
    const request={
      file,
      ownershipScope:'user',
      moduleKey:'independent_school_safe_state',
      recordType:'pdf_archive',
      recordId:key,
      relationType:'state_snapshot',
      displayName:filename,
      metadata:{
        source:'independent_school_persistence_core',
        stateKey:key,
        schoolId:schoolId(),
        userId:userId(),
        operation:operation||'save',
        safeState:true
      }
    };
    if(previous)request.replaceFileId=previous;
    const result=await engine.upload(request);
    const id=safe(result?.file?.id||result?.fileId||result?.id||'');
    if(id)nativeSet.call(localStorage,refKey,id);
    // Verify via list when supported; verification failure is diagnostic only.
    if(typeof engine.list==='function' && id){
      try{
        const list=await engine.list({moduleKey:'independent_school_safe_state',recordType:'pdf_archive',limit:1000});
        const ok=(list?.files||[]).some(f=>safe(f.id)===id);
        if(!ok)throw new Error('saved file did not appear in list verification');
      }catch(e){
        addDiag({type:'cloud-verify-warning',key,message:safe(e?.message||e)});
      }
    }
    addDiag({type:'cloud-ok',key,id,operation:operation||'save'});
    return true;
  }catch(e){
    addDiag({type:'cloud-error',key,message:safe(e?.message||e),operation:operation||'save'});
    return false;
  }
}
function scheduleMirror(key,value,operation){
  clearTimeout(mirrorTimers.get(key));
  mirrorTimers.set(key,setTimeout(()=>{mirrorTimers.delete(key);mirrorNow(key,value,operation)},180));
}
function installedSetItem(key,value){
  key=safe(key); value=safe(value);
  if(this===localStorage && monitored(key)){
    let old=null;try{old=nativeGet.call(localStorage,key)}catch(e){}
    if(old!==value)addHistory(key,old,'before-save');
    const out=nativeSet.call(this,key,value);
    addDiag({type:'local-save',key,size:value.length});
    scheduleMirror(key,value,'save');
    return out;
  }
  return nativeSet.call(this,key,value);
}
function installedRemoveItem(key){
  key=safe(key);
  if(this===localStorage && monitored(key)){
    let old=null;try{old=nativeGet.call(localStorage,key)}catch(e){}
    addHistory(key,old,'before-delete');
    const out=nativeRemove.call(this,key);
    addDiag({type:'local-delete',key});
    scheduleMirror(key,null,'delete');
    return out;
  }
  return nativeRemove.call(this,key);
}
if(!Storage.prototype.setItem.__ispSafeV1){
  installedSetItem.__ispSafeV1=true;
  installedRemoveItem.__ispSafeV1=true;
  Storage.prototype.setItem=installedSetItem;
  Storage.prototype.removeItem=installedRemoveItem;
}

function array(key){const v=parse(nativeGet.call(localStorage,key)||'[]',[]);return Array.isArray(v)?v:[]}
function saveArray(key,arr){localStorage.setItem(key,JSON.stringify(Array.isArray(arr)?arr:[]))}
function upsert(key,record){
  const rows=array(key), id=safe(record?.id||record?.recordId||record?.createdAt||Date.now());
  const idx=rows.findIndex(x=>safe(x?.id||x?.recordId||x?.createdAt)===id);
  const next=Object.assign({},idx>=0?rows[idx]:{},record||{},{
    id:(record&&record.id)!=null?record.id:id,
    updatedAt:now()
  });
  if(idx>=0)rows[idx]=next;else rows.unshift(Object.assign({createdAt:now()},next));
  saveArray(key,rows);return next;
}
function removeRecord(key,id){
  const rows=array(key), wanted=safe(id);
  const item=rows.find(x=>safe(x?.id||x?.recordId||x?.createdAt)===wanted);
  if(item){
    const deletedKey=PREFIX+'deleted:'+schoolId()+':'+key;
    const deleted=parse(nativeGet.call(localStorage,deletedKey)||'[]',[]);
    deleted.unshift({deletedAt:now(),record:item});
    nativeSet.call(localStorage,deletedKey,JSON.stringify(deleted.slice(0,100)));
  }
  saveArray(key,rows.filter(x=>safe(x?.id||x?.recordId||x?.createdAt)!==wanted));
  return !!item;
}
function history(key){return parse(nativeGet.call(localStorage,histKey(key))||'[]',[])}
function diagnostics(){return parse(nativeGet.call(localStorage,diagKey())||'[]',[])}

window.IndependentSchoolPersistence={
  version:'1.0.0',
  schoolId,userId,monitored,history,diagnostics,
  upsertArrayRecord:upsert,
  deleteArrayRecord:removeRecord,
  mirrorNow,
  verifyLocalKey:function(key){return nativeGet.call(localStorage,key)!==null}
};
})();