(function(g){
'use strict';
if(g.__PRIVATE_SCHOOL_STRICT_ISOLATION_V1__)return;g.__PRIVATE_SCHOOL_STRICT_ISOLATION_V1__=true;
const ACTIVE_KEY='private_workspace_active_school_v1';
const VAULT_PREFIX='privateSchoolWorkspaceVault:';
const SCOPE_RX=/(reports?_archive|category_goals|readiness|meeting|attendance|survey|evaluation|improvement|evidence|portfolio|discipline|student[_-]|teacher[_-]records|advisor[_-]|activity[_-]|weekly[_-]tasks|section[_-]library|records?_index|records?_participation|records?_attendance|records?_student|school_data|schoolData|operational|execution|plan_data|draft|compliance|self[_-]?evaluation|performance|task|assignment|permission|absence|late|archive)/i;
const GLOBAL_RX=/(supabase|session|token|password|currentuser|current_user|currentrole|active_school|current_school|school_id|school_name|membership|multischool|theme|app_activated|device|microsoft|onedrive|system_admin|smart_school_schools|smartSchool\.currentSchool|cloud|auth|private_workspace|privateSchoolWorkspaceVault)/i;
function ctx(){try{return JSON.parse(sessionStorage.getItem('smart_school_private_session_v1')||'null')}catch(_){return null}}
function isAdmin(){try{const q=new URLSearchParams(location.search||'');return q.get('systemAdmin')==='1'||q.get('systemAdminReturn')==='1'||sessionStorage.getItem('system_admin_context')==='1'||sessionStorage.getItem('system_admin_verified')==='true'}catch(_){return false}}
function keys(){const out=[];for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i)||'';if(k&&SCOPE_RX.test(k)&&!GLOBAL_RX.test(k))out.push(k)}return out}
function snapshot(){const d={};keys().forEach(k=>{try{d[k]=localStorage.getItem(k)}catch(_){}});return d}
function save(sid){if(!sid)return;try{localStorage.setItem(VAULT_PREFIX+sid,JSON.stringify(snapshot()))}catch(_){}}
function clearScoped(){keys().forEach(k=>{try{localStorage.removeItem(k)}catch(_){}})}
function restore(sid){if(!sid)return;clearScoped();let d={};try{d=JSON.parse(localStorage.getItem(VAULT_PREFIX+sid)||'{}')||{}}catch(_){};Object.keys(d).forEach(k=>{try{localStorage.setItem(k,d[k])}catch(_){}})}
function activate(sid){if(!sid||isAdmin())return;const prev=localStorage.getItem(ACTIVE_KEY)||'';if(prev&&prev!==sid)save(prev);if(prev!==sid)restore(sid);localStorage.setItem(ACTIVE_KEY,sid);document.documentElement.setAttribute('data-private-isolated-school',sid)}
function beforeUnload(){const c=ctx();if(c&&c.schoolId&&!isAdmin())save(c.schoolId)}
function boot(){if(isAdmin())return;const c=ctx();if(c&&c.schoolId)activate(String(c.schoolId))}
window.addEventListener('private-school-session-established',e=>{const c=e.detail&&e.detail.context;if(c&&c.schoolId)activate(String(c.schoolId))});
window.addEventListener('private-school-context-ready',e=>{const c=e.detail;if(c&&c.schoolId)activate(String(c.schoolId))});
window.addEventListener('pagehide',beforeUnload);window.addEventListener('beforeunload',beforeUnload);
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
g.PrivateSchoolIsolation=Object.freeze({activate,save,restore,current:()=>localStorage.getItem(ACTIVE_KEY)||'',scopedKeys:keys});
})(window);
