(function(g){
'use strict';
if(g.PrivateAuthStorage) return;
const LS=window.localStorage, SS=window.sessionStorage;
const LGet=Storage.prototype.getItem.bind(LS), LSet=Storage.prototype.setItem.bind(LS), LDel=Storage.prototype.removeItem.bind(LS);
const SGet=Storage.prototype.getItem.bind(SS), SSet=Storage.prototype.setItem.bind(SS), SDel=Storage.prototype.removeItem.bind(SS);
function adapter(get,set,del){return {getItem:(k)=>{try{return get(String(k))}catch(_){return null}},setItem:(k,v)=>{try{set(String(k),String(v))}catch(_){}},removeItem:(k)=>{try{del(String(k))}catch(_){}}};}
const local=adapter(LGet,LSet,LDel), session=adapter(SGet,SSet,SDel);
const SCHOOL_AUTH='PRIVATE_SCHOOLS_SCHOOL_USER_AUTH_V1', OWNER_AUTH='PRIVATE_SCHOOLS_OWNER_AUTH_V1';
g.PrivateAuthStorage=Object.freeze({local,session,SCHOOL_AUTH,OWNER_AUTH,
 localGet:(k)=>local.getItem(k),localSet:(k,v)=>local.setItem(k,v),localRemove:(k)=>local.removeItem(k),
 sessionGet:(k)=>session.getItem(k),sessionSet:(k,v)=>session.setItem(k,v),sessionRemove:(k)=>session.removeItem(k),
 diagnostics(){const safe=(v)=>v?{present:true,length:String(v).length}:{present:false,length:0};return {schoolAuth:safe(local.getItem(SCHOOL_AUTH)),ownerAuth:safe(local.getItem(OWNER_AUTH)),privateSession:safe(session.getItem('smart_school_private_session_v1')),currentSession:safe(local.getItem('smart_school_current_session'))};}
});
})(window);