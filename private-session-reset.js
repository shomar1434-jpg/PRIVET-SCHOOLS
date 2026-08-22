(function(g){
'use strict';
if(g.__PRIVATE_SESSION_RESET_SAFE_V2__) return;
g.__PRIVATE_SESSION_RESET_SAFE_V2__=true;
const A=g.PrivateAuthStorage;
const ld=(k)=>A?A.localRemove(k):localStorage.removeItem(k), sd=(k)=>A?A.sessionRemove(k):sessionStorage.removeItem(k);
const CONTEXT_KEYS=['activeSchool','activeSchoolId','active_school','active_school_code','active_school_id','active_school_login_url','active_school_name','current_school_id','current_school_code','current_school_name','school_id','smart_school_id','smart_school_active_role','currentRole','currentUserId','current_user_id','currentUserName','currentUserEmail','smart_school_current_session','persist_school','selected_school_id','selected_school_name','school_name','school_code','active_school_membership_id','smart_school_active_membership_id','smartSchool.currentSchool','smart_school_active_school','smart_school_active_school_id','smart_school_active_school_name','currentSchool','schoolContext','school_context'];
const PRIVATE_SESSION_KEYS=['smart_school_private_session_v1','smart_school_private_schools_v1','smart_school_private_memberships_v1','private_school_session','private_school_schools'];
function clearCompatibility(){CONTEXT_KEYS.forEach(k=>{try{ld(k)}catch(_){}});CONTEXT_KEYS.forEach(k=>{try{sd('private-owned:'+k);sd('private-backup:'+k);sd('private-backup:'+k+':exists')}catch(_){}});}
function clearPrivateContext(){PRIVATE_SESSION_KEYS.forEach(k=>{try{sd(k)}catch(_){}});try{ld('smart_school_private_edition')}catch(_){}}
function clearSystemAdmin(){['system_admin_context','system_admin_verified','system_admin_edition','private_system_admin_entry','private_admin_handoff_pending'].forEach(k=>{try{sd(k)}catch(_){}});}
function clearActiveSchoolContext(opts={}){clearCompatibility();if(opts.clearPrivateSession===true)clearPrivateContext();if(opts.clearSystemAdmin===true)clearSystemAdmin();return true;}
g.PrivateSessionReset=Object.freeze({clearActiveSchoolContext,clearCompatibility,clearPrivateContext,clearSystemAdmin});
})(window);