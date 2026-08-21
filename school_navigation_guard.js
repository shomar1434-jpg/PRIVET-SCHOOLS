(function(){
'use strict';
if(window.__SCHOOL_NAVIGATION_GUARD_PRIVATE_V3__)return;window.__SCHOOL_NAVIGATION_GUARD_PRIVATE_V3__=true;

function q(){try{return new URLSearchParams(location.search||'')}catch(_){return new URLSearchParams()}}
function isSystemAdminContext(){
 try{
   var p=q();
   if(p.get('systemAdmin')==='1'||p.get('systemAdminReturn')==='1'||p.get('mode')==='system_admin'||p.get('admin')==='true'||p.get('bypass')==='true')return true;
   if(p.get('returnHome')&&/index\.html/i.test(p.get('returnHome')))return true;
   if(sessionStorage.getItem('system_admin_context')==='1'||sessionStorage.getItem('system_admin_verified')==='true')return true;
   var u=window.currentUser||window.SmartSchoolCurrentUser||null;
   if(u&&(u.isRootAdmin===true||u.isSystemAdmin===true||u.role==='system_admin'))return true;
 }catch(_){}
 return false;
}
function systemAdminHome(){
 try{var r=q().get('returnHome');if(r&&/index\.html/i.test(r))return r}catch(_){}
 return 'index.html?systemAdminReturn=1&edition=private';
}
function privateContext(){
 try{return window.PrivateSchoolBridge?.privateContext?.()||JSON.parse(sessionStorage.getItem('smart_school_private_session_v1')||'null')||{}}catch(_){return {}}
}
function activeSchoolId(){
 try{
   var p=q(),ctx=privateContext();
   return String(p.get('schoolId')||p.get('school_id')||ctx.schoolId||localStorage.getItem('active_school_id')||localStorage.getItem('current_school_id')||localStorage.getItem('school_id')||'').trim();
 }catch(_){return ''}
}
function roleRoot(){
 if(isSystemAdminContext())return systemAdminHome();
 var ctx=privateContext();
 if(window.PrivateSchoolBridge&&ctx&&ctx.role){
   try{
     var landing=window.PrivateSchoolBridge.roleLanding(ctx);
     var u=new URL(landing,location.href);
     u.searchParams.set('edition','private');
     if(ctx.schoolId)u.searchParams.set('schoolId',ctx.schoolId);
     return u.pathname.split('/').pop()+u.search+u.hash;
   }catch(_){}
 }
 const f=(location.pathname.split('/').pop()||'').toLowerCase();
 let root='school-login.html';
 if(/manager/.test(f))root='manager.html';else if(/agent|wakil|deputy/.test(f))root='agent.html';
 else if(/student_advisor/.test(f))root='student_advisor.html';else if(/health_advisor|school_health/.test(f))root='health_advisor.html';
 else if(/kindergarten_teacher/.test(f))root='kindergarten_teacher.html';else if(/activity_leader/.test(f))root='activity_leader.html';
 else if(/administrative_employee|admin_employee/.test(f))root='administrative_employee_portal.html';else if(/teacher/.test(f))root='teacher.html';
 var sid=activeSchoolId(),u=new URL(root,location.href);u.searchParams.set('edition','private');if(sid)u.searchParams.set('schoolId',sid);
 return u.pathname.split('/').pop()+u.search+u.hash;
}
async function systemAdminLogout(){
 try{window.PrivateSessionReset?.clearActiveSchoolContext?.({clearSystemAdmin:true})}catch(_){}
 try{['system_admin_context','system_admin_verified','system_admin_edition','private_system_admin_entry'].forEach(k=>sessionStorage.removeItem(k))}catch(_){}
 if(window.PrivateSessionReset?.systemAdminExit){window.PrivateSessionReset.systemAdminExit();return}
 location.replace('index.html?signedOut=1&fresh=1');
}
async function schoolLogout(){
 var ctx=privateContext(),sid=String(ctx.schoolId||activeSchoolId()||''),role=String(ctx.role||'');
 try{await window.PrivateSchoolBridge?.logout?.()}catch(_){}
 try{window.PlatformCloudSession?.clear?.()}catch(_){}
 try{window.PrivateSessionReset?.clearActiveSchoolContext?.({clearSystemAdmin:true})}catch(_){}
 var target=(role==='owner'?'private-owner-login.html':'school-login.html')+'?fresh=1&edition=private'+(sid?'&schoolId='+encodeURIComponent(sid):'');
 location.replace(target);
}
function logout(){return isSystemAdminContext()?systemAdminLogout():schoolLogout()}
function label(el){return String(el?.textContent||el?.title||el?.getAttribute?.('aria-label')||'').replace(/\s+/g,' ').trim()}
function isHome(el){
 if(!el)return false;var t=label(el),oc=String(el.getAttribute?.('onclick')||'');
 return el.id==='uwHomeHeader'||el.id==='ssBack'||/^(🏠\s*)?(الرئيسية|الصفحة الرئيسية|العودة للرئيسية|العودة للقائمة)$/.test(t)||/\bgoHome\s*\(/.test(oc);
}
function isExit(el){
 if(!el)return false;var t=label(el),oc=String(el.getAttribute?.('onclick')||'');
 return el.id==='uwExitHeader'||el.id==='ssExit'||/^(⏻\s*)?(الخروج|تسجيل الخروج)$/.test(t)||/\b(openExitModal|exitApp|logout)\s*\(/.test(oc);
}
document.addEventListener('click',function(e){
 const el=e.target?.closest?.('a,button,[role="button"]');if(!el)return;
 if(isExit(el)){e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();logout();return}
 if(isHome(el)){e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();location.href=roleRoot()}
},true);
window.SchoolNavigationGuard={roleRoot,logout,isSystemAdminContext,systemAdminHome,activeSchoolId};
})();