(function(){
'use strict';
if(window.ArchiveSaveIntegrity)return;

function sleep(ms){return new Promise(r=>setTimeout(r,ms))}
function parse(v,f){try{return JSON.parse(v)}catch(e){return f}}
function same(a,b){return String(a==null?'':a)===String(b==null?'':b)}
function getArrayRecord(key,id){
  const a=parse(localStorage.getItem(key)||'[]',[]);
  if(!Array.isArray(a))return null;
  return a.find(r=>String(r?.id??r?.recordId??r?.createdAt??'')===String(id))||null;
}
async function waitFor(name,timeout=6000){
  const started=Date.now();
  while(!window[name]){
    if(Date.now()-started>=timeout)return null;
    await sleep(100);
  }
  return window[name];
}
async function verifyViaState(key){
  const guard=await waitFor('PlatformPersistenceGuard',2600);
  const engine=await waitFor('PlatformStateEngine',2600);
  if(!guard||!engine||typeof guard.flush!=='function'||typeof engine.pull!=='function')return null;
  if(typeof guard.track==='function'&&!guard.track(key))return null;
  await guard.flush();
  const scope=typeof guard.scopeFor==='function'?guard.scopeFor(key):'user';
  const d=await engine.pull(guard.moduleKey,scope,[key]);
  const row=(d?.items||[]).find(x=>String(x.state_key)===String(key)&&!x.deleted_at);
  if(!row)return {ok:false,backend:'platform-state',reason:'state_not_found'};
  const cloudValue=row.payload&&Object.prototype.hasOwnProperty.call(row.payload,'value')?String(row.payload.value):'';
  const localValue=localStorage.getItem(key)||'';
  return {ok:same(cloudValue,localValue),backend:'platform-state',reason:same(cloudValue,localValue)?'':'state_mismatch'};
}
async function verifyViaMirror(key){
  const isp=await waitFor('IndependentSchoolPersistence',2600);
  if(!isp||typeof isp.mirrorNow!=='function')return null;
  const raw=localStorage.getItem(key);
  const ok=await isp.mirrorNow(key,raw,'save');
  return {ok:!!ok,backend:'safe-cloud-mirror',reason:ok?'':'mirror_failed'};
}
async function verifyKey(key){
  const raw=localStorage.getItem(key);
  if(raw===null)throw new Error('لم يتم إنشاء بيانات الحفظ المحلية للمفتاح '+key);
  let remote=null;
  try{remote=await verifyViaState(key)}catch(e){remote={ok:false,backend:'platform-state',reason:e?.message||String(e)}}
  if(remote?.ok)return {ok:true,local:true,cloud:true,backend:remote.backend};
  try{
    const mirror=await verifyViaMirror(key);
    if(mirror?.ok)return {ok:true,local:true,cloud:true,backend:mirror.backend};
    if(remote||mirror)return {ok:false,local:true,cloud:false,backend:(mirror||remote)?.backend,reason:(mirror||remote)?.reason};
  }catch(e){return {ok:false,local:true,cloud:false,backend:'safe-cloud-mirror',reason:e?.message||String(e)}}
  return {ok:true,local:true,cloud:false,backend:'local-only'};
}
async function confirmArrayRecord(key,id){
  const rec=getArrayRecord(key,id);
  if(!rec)throw new Error('لم يظهر السجل بعد الحفظ داخل الأرشيف المحلي.');
  const verify=await verifyKey(key);
  if(!verify.ok)throw new Error('تم الحفظ محليًا لكن لم ينجح التحقق السحابي: '+(verify.reason||'سبب غير معروف'));
  return {ok:true,record:rec,...verify};
}
async function confirmObjectKey(key){
  const raw=localStorage.getItem(key);
  if(raw===null)throw new Error('لم يتم العثور على البيانات بعد الحفظ.');
  const verify=await verifyKey(key);
  if(!verify.ok)throw new Error('تم الحفظ محليًا لكن لم ينجح التحقق السحابي: '+(verify.reason||'سبب غير معروف'));
  return verify;
}
window.ArchiveSaveIntegrity={verifyKey,confirmArrayRecord,confirmObjectKey,getArrayRecord};
})();