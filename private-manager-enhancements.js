(function(){
'use strict';
function boot(){
  if(!window.__PRIVATE_EDITION_BUILD__ && localStorage.getItem('smart_school_private_edition')!=='private' && location.protocol!=='file:' && !['localhost','127.0.0.1'].includes(location.hostname))return;
  const page=(location.pathname.split('/').pop()||'').toLowerCase();
  if(page!=='manager.html'||document.getElementById('private-manager-feature-strip'))return;
  const el=document.createElement('section');
  el.id='private-manager-feature-strip';
  el.dir='rtl';
  el.innerHTML=`
    <div class="pm-head">
      <div><strong>مركز الحوكمة المشتركة</strong><small>أقسام مشتركة بين مالك المدرسة ومدير المدرسة وتعمل على بيانات المدرسة نفسها.</small></div>
    </div>
    <div class="pm-grid">
      <a class="pm-card" href="private-compliance.html?privateEdition=1"><span>✅</span><b>فحص الالتزام</b><small>استكمال المتطلبات والشواهد ومتابعة حالة الالتزام</small></a>
      <a class="pm-card" href="private-template-settings.html?privateEdition=1"><span>🎨</span><b>هوية وقالب المدرسة</b><small>إدارة القالب الموحد للمدرسة والمخرجات الرسمية</small></a>
      <a class="pm-card" href="private-outputs.html?privateEdition=1"><span>📚</span><b>المخرجات المؤسسية</b><small>أرشيف التقارير والمخرجات النهائية المعتمدة</small></a>
    </div>
    <div class="pm-actions">
      <button id="private-users-login-link" type="button">🔗 رابط دخول المستخدمين</button>
      <a id="private-workflows-link" href="private-workflows.html?privateEdition=1">🧭 سير الاعتمادات <span id="private-workflow-badge" class="pm-badge" style="display:none">0</span></a>
    </div>
    <div id="private-users-login-dialog" class="pm-login-dialog" hidden>
      <div class="pm-login-box">
        <button type="button" class="pm-login-close" aria-label="إغلاق">×</button>
        <strong>رابط دخول مستخدمي المدرسة</strong>
        <small>هذا الرابط مخصص للحسابات المسجلة والمفعلة في هذه المدرسة.</small>
        <input id="private-users-login-url" type="text" readonly dir="ltr">
        <div class="pm-login-actions">
          <button id="private-users-login-copy" type="button">📋 نسخ الرابط</button>
          <button id="private-users-login-test" type="button">↗️ تجربة الرابط</button>
        </div>
      </div>
    </div>`;
  el.style.cssText='position:relative;z-index:50;width:min(calc(100% - 28px),1180px);margin:14px auto 18px;background:linear-gradient(145deg,#ffffff,#f3fbf8);border:1px solid #d7e9e4;border-radius:22px;padding:16px;box-shadow:0 12px 32px rgba(20,67,78,.10);font-family:Tajawal,Arial;color:#18364a';
  const style=document.createElement('style');
  style.textContent=`
    #private-manager-feature-strip .pm-head{text-align:center;margin-bottom:12px}
    #private-manager-feature-strip .pm-head strong{display:block;font-size:18px;color:#087b6f}
    #private-manager-feature-strip .pm-head small{display:block;color:#64748b;margin-top:4px}
    #private-manager-feature-strip .pm-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px}
    #private-manager-feature-strip .pm-card{text-decoration:none;color:#18364a;border:1px solid #dce8ef;background:#fff;border-radius:17px;padding:14px;text-align:center;display:flex;min-height:128px;flex-direction:column;align-items:center;justify-content:center;gap:6px}
    #private-manager-feature-strip .pm-card span{font-size:28px} #private-manager-feature-strip .pm-card b{font-size:14px} #private-manager-feature-strip .pm-card small{font-size:11px;color:#64748b;line-height:1.45}
    #private-manager-feature-strip .pm-actions{display:flex;justify-content:center;gap:8px;flex-wrap:wrap;margin-top:12px}
    #private-manager-feature-strip .pm-actions a,#private-manager-feature-strip .pm-actions button{text-decoration:none;color:#0b3d2f;background:#eaf7f2;padding:8px 12px;border-radius:999px;font-weight:900;font-size:12px;position:relative;border:0;cursor:pointer;font-family:inherit}.pm-badge{display:inline-flex;align-items:center;justify-content:center;min-width:20px;height:20px;padding:0 6px;margin-right:4px;border-radius:999px;background:#dc2626;color:#fff;font-size:11px;font-weight:900}
    #private-manager-feature-strip .pm-login-dialog[hidden]{display:none!important}#private-manager-feature-strip .pm-login-dialog{position:fixed;inset:0;z-index:2147483000;background:rgba(15,23,42,.45);display:grid;place-items:center;padding:18px}#private-manager-feature-strip .pm-login-box{position:relative;width:min(560px,100%);background:#fff;border:1px solid #d7e9e4;border-radius:22px;padding:22px;box-shadow:0 24px 70px rgba(15,23,42,.25);text-align:right}#private-manager-feature-strip .pm-login-box strong{display:block;color:#087b6f;font-size:17px}#private-manager-feature-strip .pm-login-box small{display:block;color:#64748b;margin:6px 0 12px;line-height:1.7}#private-manager-feature-strip .pm-login-box input{width:100%;box-sizing:border-box;border:1px solid #cbd5e1;border-radius:12px;padding:10px 12px;background:#f8fafc;font-size:12px}#private-manager-feature-strip .pm-login-actions{display:flex;justify-content:flex-start;gap:8px;flex-wrap:wrap;margin-top:12px}#private-manager-feature-strip .pm-login-actions button{border:0;border-radius:12px;padding:9px 14px;font-family:inherit;font-weight:900;cursor:pointer;background:#eaf7f2;color:#0b3d2f}#private-manager-feature-strip .pm-login-close{position:absolute;left:12px;top:10px;width:34px;height:34px;border:0;border-radius:50%;background:#f1f5f9;color:#475569;font-size:22px;cursor:pointer}
    @media(max-width:760px){#private-manager-feature-strip .pm-grid{grid-template-columns:1fr}}
  `;
  document.head.appendChild(style);
  const anchor=document.querySelector('header')||document.querySelector('main')||document.body.firstElementChild;
  if(anchor&&anchor.parentNode) anchor.insertAdjacentElement('afterend',el); else document.body.prepend(el);
  (async()=>{try{for(let i=0;i<80&&!window.PrivateSchoolBridge;i++)await new Promise(r=>setTimeout(r,50));if(!window.PrivateSchoolBridge)return;const ctx=await window.PrivateSchoolBridge.requireContext(['manager']);const login=document.getElementById('private-users-login-link');const dialog=document.getElementById('private-users-login-dialog');const urlInput=document.getElementById('private-users-login-url');const copyBtn=document.getElementById('private-users-login-copy');const testBtn=document.getElementById('private-users-login-test');const closeBtn=dialog?.querySelector('.pm-login-close');const loginUrl=new URL('school-login.html',location.href);loginUrl.searchParams.set('edition','private');loginUrl.searchParams.set('schoolId',ctx.schoolId);const loginHref=loginUrl.href;if(urlInput)urlInput.value=loginHref;if(login)login.onclick=()=>{if(dialog)dialog.hidden=false};if(closeBtn)closeBtn.onclick=()=>{dialog.hidden=true};if(dialog)dialog.addEventListener('click',e=>{if(e.target===dialog)dialog.hidden=true});if(testBtn)testBtn.onclick=()=>window.open(loginHref,'_blank','noopener,noreferrer');if(copyBtn)copyBtn.onclick=async()=>{try{if(navigator.clipboard&&window.isSecureContext){await navigator.clipboard.writeText(loginHref)}else{const ta=document.createElement('textarea');ta.value=loginHref;ta.style.position='fixed';ta.style.opacity='0';document.body.appendChild(ta);ta.select();document.execCommand('copy');ta.remove()}const prev=copyBtn.textContent;copyBtn.textContent='✅ تم نسخ الرابط';setTimeout(()=>{copyBtn.textContent=prev},1800)}catch(e){window.prompt('انسخ رابط دخول المستخدمين:',loginHref)}};const refresh=async()=>{try{const [wf,pf]=await Promise.all([window.PrivateSchoolBridge.workflows('context'),window.PrivateSchoolBridge.performance('queue').catch(()=>({queue:[]}))]);const count=Number(wf?.counts?.managerPending??0)+Number((pf?.queue||[]).length||0);const b=document.getElementById('private-workflow-badge');if(b){b.textContent=String(count);b.style.display=count>0?'inline-flex':'none'}}catch(_){}};await refresh();setInterval(refresh,60000)}catch(e){console.warn('[private-manager-enhancements]',e)}})();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();