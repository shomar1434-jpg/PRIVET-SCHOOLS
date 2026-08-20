(function(g){
 'use strict';
 if(g.__privateSchoolNavLoaded)return;g.__privateSchoolNavLoaded=true;
 const params=new URLSearchParams(location.search);
 const isPrivate=params.get('privateEdition')==='1'||params.get('edition')==='private'||localStorage.getItem('smart_school_private_edition')==='private';
 if(!isPrivate)return;
 const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const withPrivate=u=>{try{const x=new URL(u,location.href);x.searchParams.set('privateEdition','1');return x.pathname.split('/').pop()+x.search+x.hash}catch(_){return u}};
 async function boot(){
  if(!g.PrivateSchoolBridge)return;
  let ctx;try{ctx=await g.PrivateSchoolBridge.requireContext();}catch(_){return}
  if(document.getElementById('private-school-nav'))return;
  const links=[['الرئيسية',withPrivate(g.PrivateSchoolBridge.roleLanding(ctx))],['سير العمل','private-workflows.html?privateEdition=1'],['المراسلات','private-messages.html?privateEdition=1']];
  if(['owner','manager'].includes(ctx.role))links.push(['فحص الالتزام','private-compliance.html?privateEdition=1']);
  if(['owner','manager'].includes(ctx.role))links.push(['المخرجات','private-outputs.html?privateEdition=1']);
  if(['owner','manager'].includes(ctx.role))links.push(['الهوية والقالب','private-template-settings.html?privateEdition=1']);
  if(ctx.role==='manager')links.push(['إدارة المستخدمين','private-manager-users.html?privateEdition=1']);
  if(ctx.role==='owner')links[0]=['بوابة المالك','private-owner-portal.html?privateEdition=1'];
  const roleNames={owner:'المالك',manager:'مدير/ة المدرسة',agent:'الوكيل/الوكيلة',teacher:'المعلم/المعلمة',student_advisor:'الموجه/ة الطلابي/ة',activity_leader:'رائد/ة النشاط',kindergarten_teacher:'معلم/ة رياض الأطفال',health_advisor:'الموجه/ة الصحي/ة',administrative_employee:'الموظف/ة الإداري/ة'};
  const available=Array.isArray(ctx.availableRoles)&&ctx.availableRoles.length?ctx.availableRoles:[ctx.role];
  const roleSelector=available.length>1?`<select id="private-nav-role" style="border:1px solid #ffffff33;background:#fff;color:#0f172a;border-radius:10px;padding:7px 9px;font-weight:700">${available.map(r=>`<option value="${esc(r)}" ${r===ctx.role?'selected':''}>${esc(roleNames[r]||r)}</option>`).join('')}</select>`:'';
  const bar=document.createElement('div');bar.id='private-school-nav';bar.setAttribute('dir','rtl');bar.style.cssText='position:sticky;top:0;z-index:2147483000;background:linear-gradient(135deg,#0b3d2f,#1b8a61);color:#fff;padding:8px 12px;display:flex;gap:8px;align-items:center;flex-wrap:wrap;font-family:Tajawal,Cairo,Arial;box-shadow:0 4px 14px #0002';
  bar.innerHTML=`<strong style="margin-left:auto">${esc(ctx.schoolName||'المدرسة الخاصة')}</strong>${roleSelector}`+links.map(([t,u])=>`<a href="${esc(u)}" style="color:#fff;text-decoration:none;background:#ffffff18;border:1px solid #ffffff22;padding:7px 10px;border-radius:10px;font-size:13px">${esc(t)}</a>`).join('')+`<button id="private-nav-logout" style="border:0;border-radius:10px;padding:7px 10px;cursor:pointer">خروج</button>`;
  document.body.prepend(bar);
  const roleSel=document.getElementById('private-nav-role');if(roleSel)roleSel.onchange=async()=>{const chosen=roleSel.value;if(!chosen||chosen===ctx.role)return;roleSel.disabled=true;try{const data=await g.PrivateSchoolBridge.establishContext(ctx.schoolId,chosen);const next=data.context;location.replace(g.PrivateSchoolBridge.roleLanding(next)+(g.PrivateSchoolBridge.roleLanding(next).includes('?')?'&':'?')+'privateEdition=1')}catch(e){alert(e.message||'تعذر تبديل الدور');roleSel.disabled=false;roleSel.value=ctx.role}};
  document.getElementById('private-nav-logout').onclick=async()=>{try{await g.PrivateSchoolBridge.logout()}catch(_){};try{g.PrivateSessionReset?.clearActiveSchoolContext?.({clearSystemAdmin:true})}catch(_){};location.replace(ctx.role==='owner'?'private-owner-login.html?fresh=1':'school-login.html?fresh=1')};
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})(window);
