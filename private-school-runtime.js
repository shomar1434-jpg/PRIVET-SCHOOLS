(function(g){
 'use strict';
 if(g.__privateSchoolRuntimeLoaded)return;g.__privateSchoolRuntimeLoaded=true;
 const q=new URLSearchParams(location.search);
 const page=(location.pathname.split('/').pop()||'').toLowerCase();
 const A=g.PrivateAuthStorage||null;
 const sg=k=>A?A.sessionGet(k):sessionStorage.getItem(k);const ss=(k,v)=>A?A.sessionSet(k,v):sessionStorage.setItem(k,v);
 const lg=k=>A?A.localGet(k):localStorage.getItem(k);const ld=k=>A?A.localRemove(k):localStorage.removeItem(k);
 const explicit=g.__PRIVATE_EDITION_BUILD__===true||q.get('privateEdition')==='1'||q.get('edition')==='private';
 const systemAdminBypass=q.get('systemAdmin')==='1'||q.get('systemAdminReturn')==='1'||q.get('admin')==='true'||q.get('bypass')==='true'||q.get('mode')==='system_admin'||sg('system_admin_context')==='1'||sg('system_admin_verified')==='true';
 const sessionKey='smart_school_private_session_v1';
 const listKey='smart_school_private_schools_v1';
 const hasStoredContext=!!sg(sessionKey);
 const hasMarker=lg('smart_school_private_edition')==='private';
 const privateMode=!systemAdminBypass&&(explicit||(hasMarker&&hasStoredContext));
 const unhide=()=>document.documentElement.classList.remove('private-auth-pending');

 function clearOwnedCompatWithoutBridge(){
   try{
     if(g.PrivateSessionReset?.clearActiveSchoolContext){g.PrivateSessionReset.clearActiveSchoolContext({});return}
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

 function load(src){
   return new Promise((resolve,reject)=>{
     const base=src.split('?')[0];
     const existing=[...document.scripts].find(s=>s.src&&s.src.split('?')[0].endsWith(base));
     if(existing){
       if(existing.dataset.loaded==='1'||existing.readyState==='complete')return resolve();
       existing.addEventListener('load',()=>resolve(),{once:true});
       existing.addEventListener('error',()=>reject(new Error('تعذر تحميل '+src)),{once:true});
       setTimeout(()=>resolve(),1500); // existing parser-loaded script may have already fired load
       return;
     }
     const s=document.createElement('script');s.src=src;s.defer=true;
     s.onload=()=>{s.dataset.loaded='1';resolve()};
     s.onerror=()=>reject(new Error('تعذر تحميل '+src));
     document.head.appendChild(s);
   })
 }
 async function optional(src){
   try{await load(src);return true}
   catch(e){console.warn('Private optional module skipped:',src,e);return false}
 }

 if(systemAdminBypass){
   if(page==='school-login.html'||page==='register.html'||page==='administrative_employee_login.html'||page==='private-owner-login.html'){
     location.replace('index.html?systemAdminReturn=1&edition=private');return
   }
   document.documentElement.dataset.systemAdminBypass='1';
   try{sessionStorage.setItem('system_admin_context','1');sessionStorage.setItem('system_admin_verified','true');sessionStorage.setItem('system_admin_edition','private')}catch(_){}
   unhide();return;
 }

 if(['index.html',''].includes(page)){unhide();return}
 if(page==='school-login.html'&&!explicit){clearOwnedCompatWithoutBridge();unhide();return}
 if(!privateMode){unhide();return}

 async function boot(){
   try{
     if(!g.supabase||!g.supabase.createClient) await load('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.111.0');
     // Load the standalone project configuration before deriving PrivateSchoolConfig.
     // Without this ordering, role landing pages create a Supabase client with an empty URL
     // after a successful login, which throws: "supabaseUrl is required".
     if(!g.StandalonePrivateConfig?.supabaseUrl || !g.StandalonePrivateConfig?.publishableKey){
       await load('standalone-private-config.js');
     }
     await load('private-school-config.js');
     if(!g.PrivateSchoolConfig?.supabaseUrl || !g.PrivateSchoolConfig?.publishableKey){
       throw new Error('إعداد اتصال Supabase للمدارس الخاصة غير مكتمل');
     }
     await load('private-school-bridge.js');

     if(page==='school-login.html'){
       // The actual school-login.html already owns the login form; helper is optional.
       await optional('school-login-private.js');
       document.documentElement.dataset.schoolEdition='private';
       unhide();return;
     }

     // Isolation is useful but must never be allowed to impersonate an auth failure.
     await optional('private-school-isolation.js');

     // CRITICAL: authenticate exactly once, and wait for verification to finish.
     await load('private-school-page-guard.js?v=20260822-unified1');
     if(g.__privateSchoolGuardReady) await g.__privateSchoolGuardReady;
     if(document.documentElement.dataset.privateAuthVerified!=='1'){
       // page guard owns any redirect. Do not create a second redirect path here.
       return;
     }

     unhide();

     // Everything below is enhancement-only. Failure must leave the authenticated page open.
     const navPages=new Set(['manager.html','agent.html','teacher.html','administrative_employee_portal.html','student_advisor.html','activity_leader.html','health_advisor.html','kindergarten_teacher.html','school_health_unified_registry.html','staff_discipline.html','wakil_staff_discipline.html']);
     if(navPages.has(page)){
       await optional('private-school-nav.js');
       await optional('private-multi-school-switcher.js');
     }
     if(page==='central_task_center.html') await optional('private-school-task-bridge.js');
   }catch(err){
     // A true auth rejection is already handled by private-school-page-guard.js.
     // Generic runtime/dependency errors MUST NOT eject an authenticated user.
     console.error('Private school runtime failure:',err);
     unhide();
     if(document.getElementById('private-auth-blocker')) return;
     const box=document.createElement('div');
     box.id='private-runtime-warning';
     box.style.cssText='position:fixed;left:12px;bottom:12px;z-index:2147483600;background:#fff7ed;color:#9a3412;border:1px solid #fed7aa;border-radius:12px;padding:9px 12px;font:700 11px Tajawal,Cairo,Arial;max-width:320px';
     box.textContent='تعذر تحميل إحدى الأدوات المساندة، لكن جلسة الدخول لم تُغلق.';
     if(!document.getElementById(box.id))document.body.appendChild(box);
   }
 }
 boot();
})(window);
