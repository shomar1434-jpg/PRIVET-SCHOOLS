(function(g){
'use strict';
if(g.__PRIVATE_ROLE_ENTRY_COMPAT_V1__) return;
g.__PRIVATE_ROLE_ENTRY_COMPAT_V1__=true;
g.__PRIVATE_EDITION_BUILD__=true;

function j(v,d){try{return JSON.parse(v||'')||d}catch(_){return d}}
function s(v){return String(v==null?'':v).trim()}
function put(k,v){
  try{localStorage.setItem(k,typeof v==='string'?v:JSON.stringify(v))}catch(_){}
}
function mark(k){
  try{sessionStorage.setItem('private-owned:'+k,'1')}catch(_){}
}
function set(k,v){put(k,v);mark(k)}
function boot(){
  const ctx=j(sessionStorage.getItem('smart_school_private_session_v1'),null) ||
            j(sessionStorage.getItem('private_school_session'),null);
  if(!ctx || s(ctx.edition)!=='private' || !s(ctx.schoolId)){
    // Do not redirect here. The real Supabase page guard decides later.
    document.documentElement.classList.add('private-auth-pending');
    return;
  }

  document.documentElement.classList.add('private-auth-pending');
  document.documentElement.dataset.schoolEdition='private';
  document.documentElement.dataset.privateEntryPrepared='1';
  try{localStorage.setItem('smart_school_private_edition','private')}catch(_){}

  const roleMap={
    owner:'owner', manager:'leadership', agent:'agency', teacher:'performance',
    student_advisor:'student_advisor', activity_leader:'activity_leader',
    kindergarten_teacher:'kindergarten_teacher', health_advisor:'health_advisor',
    administrative_employee:'administrative_employee'
  };
  const appRole=roleMap[s(ctx.role)]||s(ctx.role);

  [
    ['activeSchoolId',ctx.schoolId],['active_school_id',ctx.schoolId],
    ['current_school_id',ctx.schoolId],['school_id',ctx.schoolId],['smart_school_id',ctx.schoolId],
    ['active_school_code',ctx.schoolCode||''],['current_school_code',ctx.schoolCode||''],
    ['active_school_name',ctx.schoolName||''],['current_school_name',ctx.schoolName||''],
    ['currentRole',appRole],['smart_school_active_role',appRole],
    ['currentUserId',ctx.userId||''],['current_user_id',ctx.userId||''],
    ['currentUserName',ctx.userName||''],['currentUserEmail',ctx.userEmail||'']
  ].forEach(([k,v])=>set(k,s(v)));

  const school={id:ctx.schoolId,schoolId:ctx.schoolId,schoolName:ctx.schoolName||'',schoolCode:ctx.schoolCode||'',schoolEdition:'private'};
  set('activeSchool',school);
  set('active_school',school);
  set('smart_school_current_session',{
    id:ctx.userId||'',name:ctx.userName||'',email:ctx.userEmail||'',
    role:appRole,dbRole:ctx.role||'',schoolId:ctx.schoolId,schoolName:ctx.schoolName||'',
    schoolCode:ctx.schoolCode||'',schoolEdition:'private',privateSchool:true,
    loginMode:'private-auth',availableRoles:Array.isArray(ctx.availableRoles)?ctx.availableRoles:[],
    roleVariant:ctx.roleVariant||ctx.role_variant||'',role_variant:ctx.roleVariant||ctx.role_variant||'',
    membershipId:ctx.membershipId||'',authenticatedAt:ctx.authenticatedAt||''
  });

  // Explicit marker for legacy modules: they may consume compatibility values,
  // but they are not the authentication authority in the private edition.
  try{
    sessionStorage.setItem('private_school_auth_authority','private-school-session');
    sessionStorage.setItem('private_school_entry_school_id',s(ctx.schoolId));
    sessionStorage.setItem('private_school_entry_role',s(ctx.role));
  }catch(_){}
}
boot();
})(window);
