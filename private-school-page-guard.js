(function(g){
'use strict';
if(g.__PRIVATE_SCHOOL_PAGE_GUARD_V2__)return;
g.__PRIVATE_SCHOOL_PAGE_GUARD_V2__=true;
const page=(location.pathname.split('/').pop()||'').toLowerCase();
const roleByPage={
  'manager.html':['manager'],
  'agent.html':['agent'],
  'teacher.html':['teacher'],
  'student_advisor.html':['student_advisor'],
  'activity_leader.html':['activity_leader'],
  'kindergarten_teacher.html':['kindergarten_teacher'],
  'health_advisor.html':['health_advisor'],
  'school_health_unified_registry.html':['health_advisor'],
  'administrative_employee_portal.html':['administrative_employee']
};
const publicPages=new Set(['','index.html','school-login.html','private-owner-login.html','private-manager-login.html','private-school-user-register.html','private-invite-accept.html']);
function requestedSchool(){
  try{
    const q=new URLSearchParams(location.search||'');
    return q.get('schoolId')||q.get('school_id')||'';
  }catch(_){return ''}
}
function loginUrl(sid,reason){
  const q=new URLSearchParams({edition:'private',reason:reason||'session'});
  if(sid)q.set('schoolId',sid);
  return 'school-login.html?'+q.toString();
}
async function verify(){
  if(publicPages.has(page))return {public:true};
  if(!g.PrivateSchoolBridge||typeof g.PrivateSchoolBridge.requireContext!=='function')
    throw new Error('private_bridge_unavailable');

  const allowed=roleByPage[page]||undefined;
  const ctx=await g.PrivateSchoolBridge.requireContext(allowed);
  const sid=requestedSchool();
  if(sid && String(ctx.schoolId)!==String(sid)) throw new Error('school_context_mismatch');

  document.documentElement.dataset.schoolEdition='private';
  document.documentElement.dataset.privateRole=ctx.role||'';
  document.documentElement.dataset.privateAuthVerified='1';
  window.dispatchEvent(new CustomEvent('private-school-context-ready',{detail:ctx}));
  return ctx;
}
g.__privateSchoolGuardReady=(async()=>{
  try{
    return await verify();
  }catch(err){
    console.warn('Private page guard rejected protected page:',err);
    let sid=requestedSchool();
    if(!sid){
      try{sid=JSON.parse(sessionStorage.getItem('smart_school_private_session_v1')||'null')?.schoolId||''}catch(_){}
    }
    // Only this explicit auth/context rejection may return the user to login.
    location.replace(loginUrl(sid,'auth'));
    throw err;
  }
})();
})(window);
