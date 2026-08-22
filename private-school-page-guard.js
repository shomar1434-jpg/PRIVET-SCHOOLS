(function(g){
'use strict';
if(g.__PRIVATE_SCHOOL_PAGE_GUARD_V3__)return;g.__PRIVATE_SCHOOL_PAGE_GUARD_V3__=true;
const page=(location.pathname.split('/').pop()||'').toLowerCase();
const roleByPage={
 'manager.html':['manager'],'agent.html':['agent'],'teacher.html':['teacher'],'student_advisor.html':['student_advisor'],
 'activity_leader.html':['activity_leader'],'kindergarten_teacher.html':['kindergarten_teacher'],'health_advisor.html':['health_advisor'],
 'school_health_unified_registry.html':['health_advisor'],'administrative_employee_portal.html':['administrative_employee']
};
const publicPages=new Set(['','index.html','school-login.html','private-owner-login.html','private-manager-login.html','private-school-user-register.html','private-invite-accept.html']);
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
function sid(){try{const q=new URLSearchParams(location.search||'');return q.get('schoolId')||q.get('school_id')||g.PrivateSchoolBridge?.privateContext?.()?.schoolId||''}catch(_){return ''}}
function block(err){
 document.documentElement.classList.remove('private-auth-pending');document.documentElement.dataset.privateAuthBlocked='1';
 let el=document.getElementById('private-auth-blocker');if(!el){el=document.createElement('div');el.id='private-auth-blocker';document.body.appendChild(el)}
 el.style.cssText='position:fixed;inset:0;z-index:2147483646;background:#f8fafc;display:grid;place-items:center;padding:22px;font-family:Tajawal,Cairo,Arial,sans-serif;direction:rtl';
 const login=g.PrivateSchoolBridge?.schoolLoginPath?.(sid())||('school-login.html?edition=private'+(sid()?'&schoolId='+encodeURIComponent(sid()):''));
 el.innerHTML='<div style="width:min(520px,96vw);background:white;border:1px solid #dbe7e4;border-radius:22px;padding:26px;box-shadow:0 22px 60px #0f172a18;text-align:center"><div style="font-size:42px">🔐</div><h2 style="color:#15445a;margin:8px 0">تعذر التحقق من جلسة المدرسة</h2><p style="color:#64748b;line-height:1.8">لم يتم تحويلك تلقائيًا إلى صفحة الدخول لمنع حلقات تسجيل الدخول. يمكنك إعادة المحاولة أو فتح بوابة نفس المدرسة.</p><div style="display:flex;gap:8px;justify-content:center;flex-wrap:wrap"><button id="private-auth-retry" style="border:0;border-radius:12px;padding:11px 18px;background:#0f766e;color:white;font-weight:800;cursor:pointer">إعادة التحقق</button><button id="private-auth-login" style="border:0;border-radius:12px;padding:11px 18px;background:#e2e8f0;color:#334155;font-weight:800;cursor:pointer">بوابة دخول المدرسة</button></div><small style="display:block;color:#94a3b8;margin-top:12px">'+String(err?.message||'تعذر التحقق').replace(/[<>&]/g,'')+'</small></div>';
 document.getElementById('private-auth-retry').onclick=()=>location.reload();document.getElementById('private-auth-login').onclick=()=>location.href=login;
}
async function verify(){
 if(publicPages.has(page))return {public:true};
 if(!g.PrivateSchoolBridge?.requireContext)throw new Error('محرك جلسة المدرسة غير جاهز');
 const allowed=roleByPage[page]||undefined;
 let last=null;
 for(const wait of [0,250,750,1500]){if(wait)await sleep(wait);try{const ctx=await g.PrivateSchoolBridge.requireContext(allowed);const requested=sid();if(requested&&String(ctx.schoolId)!==String(requested))throw new Error('school_context_mismatch');document.documentElement.dataset.schoolEdition='private';document.documentElement.dataset.privateRole=ctx.role||'';document.documentElement.dataset.privateAuthVerified='1';window.dispatchEvent(new CustomEvent('private-school-context-ready',{detail:ctx}));return ctx}catch(e){last=e}}
 throw last||new Error('تعذر التحقق من الجلسة');
}
g.__privateSchoolGuardReady=(async()=>{try{return await verify()}catch(e){console.warn('[private-page-guard]',e);block(e);throw e}})();
})(window);