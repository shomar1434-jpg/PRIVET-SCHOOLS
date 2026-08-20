
(function(g){
'use strict';
if(g.PrivateSessionReset)return;

const ACTIVE_LOCAL_KEYS=[
  'activeSchool','activeSchoolId','active_school','active_school_id','active_school_name','active_school_code',
  'active_school_login_url','active_school_token','active_school_membership_id',
  'current_school_id','current_school_name','current_school_code','currentSchool',
  'selected_school_id','selected_school_name','school_id','school_name','school_code','school_token','persist_school',
  'smart_school_id','smart_school_name','smart_school_active_school','smart_school_active_school_id','smart_school_active_school_name',
  'smart_school_active_role','currentRole','user_role','currentUserId','current_user_id','currentUserName','currentUserEmail',
  'smart_school_current_session','smartSchool.currentSchool','smart_school_current_school',
  'smart_school_active_membership_id','platform_file_session_school_id','platform_file_session_role',
  'administrative_employee_tab_session_v1','private_school_mode'
];

const ACTIVE_SESSION_KEYS=[
  'smart_school_private_session_v1','smart_school_private_schools_v1',
  'smart_school_current_session','smart_school_tab_school_v1','smart_school_tab_membership_v1','smart_school_tab_role_v1',
  'active_school_id','active_school_name','current_school_id','current_school_name',
  'private_school_mode','smartSchool:activeSchool','administrative_employee_tab_session_v1'
];

function clearMarkers(){
  try{
    const remove=[];
    for(let i=0;i<sessionStorage.length;i++){
      const rawKey=sessionStorage.key(i)||'';
      const k=rawKey.startsWith('PRIVATE_STANDALONE::')?rawKey.slice('PRIVATE_STANDALONE::'.length):rawKey;
      if(k&&(k.startsWith('private-owned:')||k.startsWith('private-backup:'))) remove.push(k);
    }
    remove.forEach(k=>sessionStorage.removeItem(k));
  }catch(_){}
}

function clearActiveSchoolContext(opts){
  opts=opts||{};
  try{ACTIVE_LOCAL_KEYS.forEach(k=>localStorage.removeItem(k));}catch(_){}
  try{ACTIVE_SESSION_KEYS.forEach(k=>sessionStorage.removeItem(k));}catch(_){}
  clearMarkers();
  try{localStorage.removeItem('smart_school_private_edition');}catch(_){}
  if(opts.keepSystemAdmin){
    try{
      sessionStorage.setItem('system_admin_context','1');
      sessionStorage.setItem('system_admin_verified','true');
      sessionStorage.setItem('system_admin_edition','private');
    }catch(_){}
  }else if(opts.clearSystemAdmin){
    try{
      ['system_admin_context','system_admin_verified','system_admin_edition','private_system_admin_entry'].forEach(k=>sessionStorage.removeItem(k));
    }catch(_){}
  }
  return true;
}

function systemAdminExit(){
  clearActiveSchoolContext({clearSystemAdmin:true});
  location.replace('index.html?signedOut=1&fresh=1');
}

function schoolUserExit(target){
  clearActiveSchoolContext({clearSystemAdmin:true});
  location.replace(target||'school-login.html?fresh=1');
}

g.PrivateSessionReset=Object.freeze({clearActiveSchoolContext,systemAdminExit,schoolUserExit});
})(window);
