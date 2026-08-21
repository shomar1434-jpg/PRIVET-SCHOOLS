(function(g){
 'use strict';
 if(g.__privateSchoolRuntimeLoaded)return;g.__privateSchoolRuntimeLoaded=true;
 const q=new URLSearchParams(location.search);
 const page=(location.pathname.split('/').pop()||'').toLowerCase();
 const explicit=g.__PRIVATE_EDITION_BUILD__===true||q.get('privateEdition')==='1'||q.get('edition')==='private';
 const systemAdminBypass=q.get('systemAdmin')==='1'||q.get('systemAdminReturn')==='1'||q.get('admin')==='true'||q.get('bypass')==='true'||q.get('mode')==='system_admin'||sessionStorage.getItem('system_admin_context')==='1'||sessionStorage.getItem('system_admin_verified')==='true';
 const sessionKey='smart_school_private_session_v1';
 const listKey='smart_school_private_schools_v1';
 const hasStoredContext=!!sessionStorage.getItem(sessionKey);
 const hasMarker=localStorage.getItem('smart_school_private_edition')==='private';
 const privateMode=!systemAdminBypass&&(explicit||(hasMarker&&hasStoredContext));
 const unhide=()=>document.documentElement.classList.remove('private-auth-pending');
 function clearOwnedCompatWithoutBridge(){
   try{
     if(g.PrivateSessionReset?.clearActiveSchoolContext){
       g.PrivateSessionReset.clearActiveSchoolContext({});
       return;
     }
     const keys=[];
     for(let i=0;i<sessionStorage.length;i++){
       const rawKey=sessionStorage.key(i)||'';
       const k=rawKey.startsWith('PRIVATE_STANDALONE::')?rawKey.slice('PRIVATE_STANDALONE::'.length):rawKey;
       if(k&&k.startsWith('private-owned:'))keys.push(k);
     }
     for(const markerKey of keys){
       const key=markerKey.slice('private-owned:'.length),backupKey='private-backup:'+key;
       localStorage.removeItem(key);
       sessionStorage.removeItem(markerKey);sessionStorage.removeItem(backupKey);sessionStorage.removeItem(backupKey+':exists');
     }
     ['persist_school','selected_school_id','selected_school_name','school_name','school_code','smartSchool.currentSchool',
      'smart_school_active_school','smart_school_active_school_id','smart_school_active_school_name','currentSchool','schoolContext','school_context'
     ].forEach(k=>localStorage.removeItem(k));
     sessionStorage.removeItem(sessionKey);sessionStorage.removeItem(listKey);localStorage.removeItem('smart_school_private_edition');
   }catch(_){}
 }
 if(systemAdminBypass){
   if(page==='school-login.html'||page==='register.html'||page==='administrative_employee_login.html'||page==='private-owner-login.html'){location.replace('index.html?systemAdminReturn=1&edition=private');return}
   document.documentElement.dataset.systemAdminBypass='1';
   try{sessionStorage.setItem('system_admin_context','1');sessionStorage.setItem('system_admin_verified','true');sessionStorage.setItem('system_admin_edition','private')}catch(_){}
   const returnHome=q.get('returnHome')||'index.html?systemAdminReturn=1&edition=private';
   const decorate=(href)=>{try{if(!href||/^(?:https?:|mailto:|tel:|javascript:|#|data:)/i.test(href))return href;const u=new URL(href,location.href);const currentOrigin=new URL(location.href).origin;if(u.origin!==currentOrigin&&location.protocol!=='file:')return href;const file=(u.pathname.split('/').pop()||'').toLowerCase();const previewMap={'private-owner-portal.html':'owner','private-compliance.html':'compliance','private-template-settings.html':'template','private-outputs.html':'outputs'};if(previewMap[file]){const pr=new URL('private-system-admin-section-preview.html',location.href);pr.searchParams.set('section',previewMap[file]);pr.searchParams.set('systemAdmin','1');pr.searchParams.set('edition','private');pr.searchParams.set('returnHome',returnHome);return location.protocol==='file:'?('private-system-admin-section-preview.html'+pr.search):pr.href;}if(file==='school-login.html'||file==='register.html'||file==='administrative_employee_login.html'||file==='private-owner-login.html')return 'index.html?systemAdminReturn=1&edition=private';u.searchParams.set('systemAdmin','1');u.searchParams.set('edition','private');if(!u.searchParams.get('returnHome'))u.searchParams.set('returnHome',returnHome);return location.protocol==='file:'?(file+(u.search||'')+(u.hash||'')):u.href}catch(_){return href}};
   document.addEventListener('click',function(ev){const a=ev.target&&ev.target.closest&&ev.target.closest('a[href]');if(!a)return;const h=a.getAttribute('href')||'';const next=decorate(h);if(next&&next!==h)a.setAttribute('href',next)},true);
   document.addEventListener('DOMContentLoaded',function(){document.querySelectorAll('a[href]').forEach(a=>{const h=a.getAttribute('href')||'';const next=decorate(h);if(next&&next!==h)a.setAttribute('href',next)})},{once:true});
   unhide();return}
 // Public entry pages of the private edition must open without an authenticated school context.
 // Authentication is enforced only after the user explicitly opens a protected operational page.
 if(['index.html',''].includes(page)){unhide();return}
 if(page==='school-login.html'&&!explicit){clearOwnedCompatWithoutBridge();unhide();return}
 if(!privateMode){unhide();return}
 if(page==='school-login.html'){
   g.schoolLogin=function(){
     const msg=document.getElementById('login-msg');
     if(msg) msg.textContent='جاري تهيئة الدخول الآمن للمدارس الخاصة…';
     return false;
   };
   g.schoolLogin.__privateBootstrapLock=true;
 }
 function load(src){return new Promise((resolve,reject)=>{const existing=[...document.scripts].find(s=>s.src&&s.src.endsWith(src));if(existing){if(existing.dataset.loaded==='1')return resolve();existing.addEventListener('load',resolve,{once:true});existing.addEventListener('error',reject,{once:true});return}const s=document.createElement('script');s.src=src;s.defer=true;s.onload=()=>{s.dataset.loaded='1';resolve()};s.onerror=()=>reject(new Error('تعذر تحميل '+src));document.head.appendChild(s)})}
 async function boot(){
   try{
     if(!g.supabase||!g.supabase.createClient) await load('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.111.0');
     await load('private-school-config.js');
     await load('private-school-bridge.js');
     if(page==='school-login.html'){
       await load('school-login-private.js');
       document.documentElement.dataset.schoolEdition='private';
       unhide();
       return;
     }
     const ready=()=>unhide();
     document.addEventListener('private-school-context-ready',ready,{once:true});
     await load('private-school-isolation.js');
     await load('private-school-page-guard.js');
     const navPages=new Set(['manager.html','agent.html','teacher.html','administrative_employee_portal.html','student_advisor.html','activity_leader.html','health_advisor.html','kindergarten_teacher.html','school_health_unified_registry.html','staff_discipline.html','wakil_staff_discipline.html']);
     if(navPages.has(page)){
       await load('private-school-nav.js');
       await load('private-multi-school-switcher.js');
     }
     if(page==='central_task_center.html') await load('private-school-task-bridge.js');
     setTimeout(()=>{if(document.documentElement.dataset.schoolEdition==='private')unhide()},2500);
   }catch(err){
     console.error('Private school runtime:',err);
     if(page==='school-login.html'){
       g.schoolLogin=function(){
         const msg=document.getElementById('login-msg');
         if(msg) msg.textContent='تعذر تهيئة الدخول الآمن. أعد تحميل الصفحة أو تواصل مع الدعم.';
         return false;
       };
       const msg=document.getElementById('login-msg');
       if(msg) msg.textContent='تعذر تهيئة الدخول الآمن. أعد تحميل الصفحة أو تواصل مع الدعم.';
       unhide();
       return;
     }
     unhide();
     location.replace('school-login.html?edition=private&reason=runtime');
   }
 }
 boot();
})(window);
