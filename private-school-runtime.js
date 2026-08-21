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
      'smart_school_active_school','smart_school_active_school_id','smart_school_active_school_name','currentSchool','schoolContext','school_context',
      'activeSchool','activeSchoolId','active_school','active_school_id','active_school_name','active_school_code',
      'current_school_id','current_school_name','current_school_code','school_id','smart_school_id',
      'active_school_membership_id','smart_school_active_membership_id','smart_school_current_session',
      'private_user_display_name','private_user_role','private_user_role_label','private_user_signature_url',
      'cached_manager_uid','cached_manager_name','manager_name','managerName','school_manager_name','schoolManagerName'
     ].forEach(k=>{localStorage.removeItem(k);sessionStorage.removeItem(k)});
     sessionStorage.removeItem(sessionKey);sessionStorage.removeItem(listKey);localStorage.removeItem('smart_school_private_edition');
   }catch(_){}
 }
 if(systemAdminBypass){
   // SECURITY: مدير النظام لا يعمل داخل سياق مدرسة. نمسح أي سياق مدرسة قديم قبل عرض أي قسم.
   clearOwnedCompatWithoutBridge();
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
     // يجب تحميل إعداد مشروع المدارس الخاصة المستقل قبل بناء PrivateSchoolConfig.
     // بدونه تصبح supabaseUrl/publishableKey فارغة في صفحات التشغيل مثل manager.html.
     if(!g.StandalonePrivateConfig) await load('standalone-private-config.js');
     await load('private-school-config.js');
     if(!g.PrivateSchoolConfig?.supabaseUrl || !g.PrivateSchoolConfig?.publishableKey) throw new Error('إعداد مشروع المدارس الخاصة غير مكتمل');
     await load('private-school-bridge.js');
     const installPrivateUserSettings=(ctx)=>{
       if(!ctx||['owner','manager'].includes(String(ctx.role||''))) {
         if(ctx&&ctx.role==='manager') document.querySelectorAll('button,a').forEach(el=>{if((el.textContent||'').trim()==='إعدادات مخصصة')el.style.display='none'});
         return;
       }
       const labels={agent:'وكيل/وكيلة المدرسة',teacher:'معلم/معلمة',student_advisor:'موجه/موجهة طلابية',activity_leader:'رائد/رائدة نشاط',health_advisor:'موجه/موجهة صحي',kindergarten_teacher:'معلمة رياض أطفال',administrative_employee:'موظف/موظفة إدارية'};
       const esc=(v)=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
       let current=null,newFile=null;
       function ensureModal(){
         let m=document.getElementById('private-user-settings-modal');if(m)return m;
         m=document.createElement('div');m.id='private-user-settings-modal';m.style.cssText='display:none;position:fixed;inset:0;z-index:100000;background:rgba(15,23,42,.55);align-items:center;justify-content:center;padding:18px;font-family:Tajawal,Arial,sans-serif';
         m.innerHTML=`<div style="width:min(560px,96vw);background:#fff;border-radius:22px;padding:22px;box-shadow:0 25px 70px rgba(15,23,42,.25);direction:rtl"><div style="display:flex;align-items:center;justify-content:space-between;gap:12px"><div><h2 style="margin:0;color:#15445A">الإعدادات المخصصة</h2><p style="margin:6px 0 0;color:#64748b;font-size:13px">بيانات المدرسة والختم والمالك والمدير تُدار مركزيًا من هوية المدرسة.</p></div><button id="pus-close" type="button" style="width:auto;border:0;background:#eef2f7;color:#334155;border-radius:10px;padding:8px 12px;cursor:pointer">إغلاق</button></div><div style="display:grid;gap:14px;margin-top:20px"><label style="font-weight:800;color:#334155">الاسم حسب الحساب<input id="pus-name" style="display:block;width:100%;box-sizing:border-box;margin-top:7px;padding:11px;border:1px solid #cbd5e1;border-radius:11px;font:inherit"></label><label style="font-weight:800;color:#334155">الدور المسجل<input id="pus-role" readonly style="display:block;width:100%;box-sizing:border-box;margin-top:7px;padding:11px;border:1px solid #cbd5e1;border-radius:11px;background:#f8fafc;font:inherit"></label><label style="font-weight:800;color:#334155">التوقيع الرقمي<input id="pus-file" type="file" accept="image/*" style="display:block;width:100%;box-sizing:border-box;margin-top:7px;padding:10px;border:1px solid #cbd5e1;border-radius:11px"></label><div id="pus-preview" style="min-height:90px;border:1px dashed #cbd5e1;border-radius:12px;display:flex;align-items:center;justify-content:center;color:#94a3b8;overflow:hidden">لم يتم رفع توقيع</div><button id="pus-save" type="button" style="border:0;background:#15445A;color:#fff;border-radius:12px;padding:12px;font:inherit;font-weight:900;cursor:pointer">حفظ الاسم والتوقيع</button><div id="pus-msg" style="min-height:20px;color:#64748b;font-size:13px"></div></div></div>`;
         document.body.appendChild(m);m.querySelector('#pus-close').onclick=()=>m.style.display='none';m.addEventListener('click',e=>{if(e.target===m)m.style.display='none'});
         m.querySelector('#pus-file').addEventListener('change',e=>{newFile=e.target.files?.[0]||null;if(newFile){if(!String(newFile.type||'').startsWith('image/')){newFile=null;m.querySelector('#pus-msg').textContent='التوقيع يجب أن يكون صورة.';return}const u=URL.createObjectURL(newFile);m.querySelector('#pus-preview').innerHTML=`<img src="${u}" style="max-width:260px;max-height:100px;object-fit:contain">`}});
         m.querySelector('#pus-save').onclick=async()=>{const msg=m.querySelector('#pus-msg'),btn=m.querySelector('#pus-save');btn.disabled=true;msg.textContent='جارٍ الحفظ...';try{let fileId=current?.signature_file_id||'';if(newFile){const up=await g.PrivateSchoolBridge.uploadModuleFile({moduleKey:'user-profile',file:newFile,slotKey:'signature',recordType:'user_signature',recordId:ctx.userId,displayName:'التوقيع الرقمي'});fileId=up.file?.id||up.fileId||''}const d=await g.PrivateSchoolBridge.userProfile('save',{displayName:m.querySelector('#pus-name').value.trim(),signatureFileId:fileId});current=d.profile||{};newFile=null;applyProfile(current);msg.textContent='تم حفظ بيانات المستخدم والتوقيع الرقمي بنجاح.'}catch(e){msg.textContent=e.message||'تعذر حفظ الإعدادات'}finally{btn.disabled=false}};
         return m;
       }
       function applyProfile(p){
         const name=String(p?.display_name||ctx.userName||'').trim(),sig=String(p?.signatureUrl||'');
         g.PrivateUserReportProfile={schoolId:ctx.schoolId,userId:ctx.userId,role:ctx.role,roleLabel:p?.role_label||labels[ctx.role]||ctx.role,displayName:name,signatureUrl:sig,signatureFileId:p?.signature_file_id||''};
         try{localStorage.setItem('private_user_display_name',name);localStorage.setItem('private_user_role',ctx.role);localStorage.setItem('private_user_role_label',g.PrivateUserReportProfile.roleLabel);if(sig)localStorage.setItem('private_user_signature_url',sig);else localStorage.removeItem('private_user_signature_url')}catch(_){ }
         document.querySelectorAll('[data-private-user-name]').forEach(el=>el.textContent=name);document.querySelectorAll('img[data-private-user-signature]').forEach(el=>{if(sig){el.src=sig;el.style.display=''}else el.style.display='none'});
         g.dispatchEvent(new CustomEvent('private-user-profile-updated',{detail:g.PrivateUserReportProfile}));
       }
       async function open(){const m=ensureModal();m.style.display='flex';m.querySelector('#pus-msg').textContent='جارٍ تحميل بيانات الحساب...';try{const d=await g.PrivateSchoolBridge.userProfile('get');current=d.profile||{};m.querySelector('#pus-name').value=current.display_name||ctx.userName||'';m.querySelector('#pus-role').value=current.role_label||labels[ctx.role]||ctx.role;const sig=current.signatureUrl||'';m.querySelector('#pus-preview').innerHTML=sig?`<img src="${esc(sig)}" style="max-width:260px;max-height:100px;object-fit:contain">`:'لم يتم رفع توقيع';m.querySelector('#pus-msg').textContent='';applyProfile(current)}catch(e){m.querySelector('#pus-msg').textContent=e.message||'تعذر تحميل بيانات الحساب'}}
       g.openAppSettings=open;
       setTimeout(()=>{g.openAppSettings=open},0);setTimeout(()=>{g.openAppSettings=open},800);
       g.PrivateSchoolBridge.userProfile('get').then(d=>applyProfile(d.profile||{})).catch(()=>{});
     };
     if(page==='school-login.html'){
       await load('school-login-private.js');
       document.documentElement.dataset.schoolEdition='private';
       unhide();
       return;
     }
     const syncManagerSchoolIdentity=(ctx)=>{
       if(page!=='manager.html'||!ctx)return;
       const schoolName=String(ctx.schoolName||localStorage.getItem('active_school_name')||localStorage.getItem('current_school_name')||localStorage.getItem('school_name')||localStorage.getItem('persist_school')||'').trim();
       if(!schoolName)return;
       // إبقاء نفس مفاتيح هوية المدرسة المستخدمة في نسخة المدارس المستقلة.
       try{
         localStorage.setItem('active_school_name',schoolName);
         localStorage.setItem('current_school_name',schoolName);
         localStorage.setItem('school_name',schoolName);
         localStorage.setItem('persist_school',schoolName);
         const current=JSON.parse(localStorage.getItem('smartSchool.currentSchool')||'{}')||{};
         current.id=ctx.schoolId||current.id||current.schoolId||'';
         current.schoolId=ctx.schoolId||current.schoolId||current.id||'';
         current.schoolName=schoolName;
         if(ctx.schoolCode)current.schoolCode=ctx.schoolCode;
         localStorage.setItem('smartSchool.currentSchool',JSON.stringify(current));
       }catch(_){}
       const header=document.querySelector('#welcome-dashboard .content-overlay > header')||document.querySelector('#welcome-dashboard header');
       if(!header)return;
       const left=header.querySelector('.flex.items-center.gap-4')||header.firstElementChild;
       if(!left)return;
       let badge=document.getElementById('private-manager-school-name');
       if(!badge){
         badge=document.createElement('span');
         badge.id='private-manager-school-name';
         badge.style.cssText='display:inline-flex;align-items:center;max-width:340px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;padding:7px 12px;border-radius:12px;background:#ecfdf5;border:1px solid #a7f3d0;color:#065f46;font-family:Tajawal,Arial;font-size:12px;font-weight:900;';
         left.appendChild(badge);
       }
       badge.textContent=schoolName;
       badge.title=schoolName;
     };
     const ready=(ev)=>{const c=ev&&ev.detail;syncManagerSchoolIdentity(c);installPrivateUserSettings(c);unhide();};
     document.addEventListener('private-school-context-ready',ready,{once:true});
     await load('private-school-page-guard.js');
     try{const c=await g.PrivateSchoolBridge.requireContext();installPrivateUserSettings(c);}catch(_){}
     // قسم المدير يحتوي أدواته داخليًا؛ لا نحمّل شريط التنقل المكرر فوقه.
     const navPages=new Set(['agent.html','teacher.html','administrative_employee_portal.html','student_advisor.html','activity_leader.html','health_advisor.html','kindergarten_teacher.html','school_health_unified_registry.html']);
     if(navPages.has(page)) await load('private-school-nav.js');
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
