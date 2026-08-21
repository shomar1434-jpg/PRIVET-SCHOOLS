(function(g){
'use strict';
if(g.__PRIVATE_SCHOOL_PAGE_GUARD_V1__)return;g.__PRIVATE_SCHOOL_PAGE_GUARD_V1__=true;
const page=(location.pathname.split('/').pop()||'').toLowerCase();
const roleByPage={
  'manager.html':['manager'],
  'agent.html':['agent'],
  'teacher.html':['teacher'],
  'student_advisor.html':['student_advisor'],
  'activity_leader.html':['activity_leader'],
  'kindergarten_teacher.html':['kindergarten_teacher'],
  'health_advisor.html':['health_advisor'],
  'administrative_employee_portal.html':['administrative_employee']
};
const publicPages=new Set(['','index.html','school-login.html','private-owner-login.html','private-manager-login.html','private-school-user-register.html','private-invite-accept.html']);
function requestedSchool(){
  try{return new URLSearchParams(location.search||'').get('schoolId')||new URLSearchParams(location.search||'').get('school_id')||''}catch(_){return ''}
}
async function boot(){
  if(publicPages.has(page))return;
  if(!g.PrivateSchoolBridge||typeof g.PrivateSchoolBridge.requireContext!=='function')throw new Error('محرك جلسة المدرسة غير جاهز');
  try{
    const allowed=roleByPage[page]||undefined;
    const ctx=await g.PrivateSchoolBridge.requireContext(allowed);
    const sid=requestedSchool();
    if(sid && String(ctx.schoolId)!==String(sid)) throw new Error('school_context_mismatch');
    document.documentElement.dataset.schoolEdition='private';
    document.documentElement.dataset.privateRole=ctx.role||'';
    window.dispatchEvent(new CustomEvent('private-school-context-ready',{detail:ctx}));
  }catch(err){
    console.warn('Private page guard:',err);
    const sid=requestedSchool()||(()=>{try{return JSON.parse(sessionStorage.getItem('smart_school_private_session_v1')||'null')?.schoolId||''}catch(_){return ''}})();
    const q=new URLSearchParams({edition:'private',reason:'session'});if(sid)q.set('schoolId',sid);
    location.replace('school-login.html?'+q.toString());
  }
}
boot();
})(window);
