(function(g){
'use strict';
if(g.__PRIVATE_SCHOOL_PAGE_GUARD_V4__)return;g.__PRIVATE_SCHOOL_PAGE_GUARD_V4__=true;
const page=(location.pathname.split('/').pop()||'').toLowerCase();
const roleByPage={
 'manager.html':['manager'],'agent.html':['agent'],'teacher.html':['teacher'],'student_advisor.html':['student_advisor'],
 'activity_leader.html':['activity_leader'],'kindergarten_teacher.html':['kindergarten_teacher'],'health_advisor.html':['health_advisor'],
 'school_health_unified_registry.html':['health_advisor'],'administrative_employee_portal.html':['administrative_employee']
};
const publicPages=new Set(['','index.html','school-login.html','private-owner-login.html','private-manager-login.html','private-school-user-register.html','private-invite-accept.html']);
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
function sid(){try{const q=new URLSearchParams(location.search||'');return q.get('schoolId')||q.get('school_id')||g.PrivateSchoolBridge?.privateContext?.()?.schoolId||''}catch(_){return ''}}
function markVerified(ctx){
 document.documentElement.dataset.schoolEdition='private';
 document.documentElement.dataset.privateRole=ctx?.role||'';
 document.documentElement.dataset.privateAuthVerified='1';
 document.documentElement.classList.remove('private-auth-pending');
 try{window.dispatchEvent(new CustomEvent('private-school-context-ready',{detail:ctx}))}catch(_){}
 return ctx;
}
function sameSchool(ctx){const requested=sid();return !requested||String(ctx?.schoolId||'')===String(requested)}
function roleAllowed(ctx,allowed){return !Array.isArray(allowed)||!allowed.length||allowed.includes(ctx?.role)}
async function cachedAuthenticatedContext(allowed){
 try{
  const ctx=g.PrivateSchoolBridge?.privateContext?.();
  if(!ctx||ctx.edition!=='private'||!sameSchool(ctx)||!roleAllowed(ctx,allowed))return null;
  const sb=g.PrivateSchoolBridge?.getClient?.(ctx.role||'');
  if(!sb)return null;
  const r=await sb.auth.getSession();
  const session=r?.data?.session;
  if(!session?.user?.id||String(session.user.id)!==String(ctx.userId||''))return null;
  try{g.PrivateSchoolBridge.applyCompatibility?.(ctx)}catch(_){}
  return ctx;
 }catch(_){return null}
}
function goToOwnRole(ctx){
 try{
  const target=g.PrivateSchoolBridge?.roleLanding?.(ctx);
  if(!target)return false;
  const current=(location.pathname.split('/').pop()||'').toLowerCase();
  if(String(target).toLowerCase()===current)return false;
  const u=new URL(target,location.href);u.searchParams.set('privateEdition','1');u.searchParams.set('schoolId',ctx.schoolId);location.replace(u.href);return true;
 }catch(_){return false}
}
function goToSchoolLogin(){
 const schoolId=sid();
 const login=g.PrivateSchoolBridge?.schoolLoginPath?.(schoolId)||('school-login.html?edition=private'+(schoolId?'&schoolId='+encodeURIComponent(schoolId):''));
 location.replace(login);
}
async function verify(){
 if(publicPages.has(page))return {public:true};
 if(!g.PrivateSchoolBridge?.requireContext)throw new Error('محرك جلسة المدرسة غير جاهز');
 const allowed=roleByPage[page]||undefined;
 let last=null;
 for(const wait of [0,180,450,900]){
  if(wait)await sleep(wait);
  try{
   const ctx=await g.PrivateSchoolBridge.requireContext(allowed);
   if(!sameSchool(ctx))throw new Error('school_context_mismatch');
   return markVerified(ctx);
  }catch(e){last=e}
 }
 // A recent, matching Supabase auth session is sufficient to keep an already authenticated
 // user inside the role interface if a transient context/Edge request failed during page boot.
 const cached=await cachedAuthenticatedContext(allowed);
 if(cached)return markVerified(cached);
 // If the user is authenticated but landed on a page for another role, send them to their own
 // role interface instead of a login or verification screen.
 const anyCtx=g.PrivateSchoolBridge?.privateContext?.();
 if(anyCtx&&anyCtx.edition==='private'&&sameSchool(anyCtx)){
  const sb=g.PrivateSchoolBridge?.getClient?.(anyCtx.role||'');
  try{
   const r=await sb?.auth?.getSession?.();
   if(r?.data?.session?.user?.id===anyCtx.userId && goToOwnRole(anyCtx))return anyCtx;
  }catch(_){}
 }
 throw last||new Error('انتهت جلسة الدخول');
}
g.__privateSchoolGuardReady=(async()=>{
 try{return await verify()}
 catch(e){
  console.warn('[private-page-guard]',e);
  // No intermediate verification/error screen. A genuinely missing/expired session returns only
  // to the canonical login page for the same school.
  goToSchoolLogin();
  throw e;
 }
})();
})(window);
