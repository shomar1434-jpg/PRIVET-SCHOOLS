(function(g){
'use strict';
if(g.PrivateReportIdentity)return;
const UI_PAGES=new Set(['agent.html','teacher.html','student_advisor.html','health_advisor.html','activity_leader.html','kindergarten_teacher.html','administrative_employee_portal.html']);
const page=(location.pathname.split('/').pop()||'').toLowerCase();
const q=id=>document.getElementById(id);
let ctx=null,shared=null,personal=null,pendingSignatureFileId='',pendingSignatureUrl='';

async function invokeProfile(action,payload={}){
  ctx=ctx||await g.PrivateSchoolBridge.requireContext();
  const sb=g.PrivateSchoolBridge.getClient();const s=await sb.auth.getSession();const token=s.data?.session?.access_token||'';
  if(!token)throw new Error('انتهت جلسة الدخول');
  const r=await fetch((g.PrivateSchoolConfig.supabaseUrl||'').replace(/\/$/,'')+'/functions/v1/private-user-report-profile',{
    method:'POST',headers:{apikey:g.PrivateSchoolConfig.publishableKey,Authorization:'Bearer '+token,'content-type':'application/json'},
    body:JSON.stringify({action,schoolId:ctx.schoolId,...payload})
  });
  const j=await r.json().catch(()=>({}));if(!r.ok)throw new Error(j.error||'تعذر حفظ إعدادات المستخدم');return j;
}
function store(k,v){try{if(v!=null&&v!=='')localStorage.setItem(k,String(v))}catch(_){}}
function syncLegacy(){
  const o=shared?.output||shared?.profile||shared||{}, p=personal?.profile||personal||{};
  store('setting_school',o.schoolDisplayName||o.school_display_name||ctx?.schoolName||'');
  store('setting_region',o.educationDepartment||o.education_department||'');
  store('def_m',o.managerDisplayName||o.manager_display_name||'');
  store('persist_name_p',o.managerDisplayName||o.manager_display_name||'');
  store('setting_owner',o.ownerDisplayName||o.owner_display_name||'');
  store('setting_sig',o.manager_signatureUrl||'');
  store('setting_owner_sig',o.owner_signatureUrl||'');
  store('setting_stamp',o.digital_stampUrl||'');
  store('setting_school_logo',o.school_logoUrl||'');
  store('setting_ministry_logo',o.ministry_logoUrl||'');
  store('persist_name_m',p.display_name||ctx?.userName||ctx?.userEmail||'');
  store('persist_sig_data',p.signatureUrl||'');
  try{
    if(g.SchoolBaseSettings?.write)g.SchoolBaseSettings.write({
      school:o.schoolDisplayName||o.school_display_name||ctx?.schoolName||'',
      manager:o.managerDisplayName||o.manager_display_name||'',
      owner:o.ownerDisplayName||o.owner_display_name||'',
      userName:p.display_name||ctx?.userName||'',
      education:o.educationDepartment||o.education_department||'',
      signature:o.manager_signatureUrl||'',
      managerSignature:o.manager_signatureUrl||'',
      ownerSignature:o.owner_signatureUrl||'',
      userSignature:p.signatureUrl||'',
      stamp:o.digital_stampUrl||'',
      schoolLogo:o.school_logoUrl||'',
      ministryLogo:o.ministry_logoUrl||''
    });
  }catch(_){}
  g.dispatchEvent(new CustomEvent('platformSettingsUpdated'));
}
async function refresh(){
  try{
    ctx=await g.PrivateSchoolBridge.requireContext();
    const [t,p]=await Promise.all([g.PrivateSchoolBridge.template({}),invokeProfile('get')]);
    shared=t;personal=p;syncLegacy();return true;
  }catch(e){console.warn('PrivateReportIdentity:',e.message);return false}
}
function ensureModal(){
 if(q('role-profile-modal'))return;
 const d=document.createElement('div');d.id='role-profile-modal';d.className='no-print';
 d.style.cssText='display:none;position:fixed;inset:0;z-index:2147482000;background:#0f172a88;align-items:center;justify-content:center;padding:18px;direction:rtl';
 d.innerHTML=`<div style="width:min(94vw,460px);background:#fff;border-radius:24px;padding:22px;box-shadow:0 24px 70px #0003;font-family:Tajawal,Arial">
 <div style="display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid #e2e8f0;padding-bottom:12px"><div><b style="font-size:18px;color:#15445a">الإعدادات المخصصة</b><div style="font-size:12px;color:#64748b;margin-top:4px">يُدخل المستخدم اسمه وتوقيعه فقط. بيانات المدرسة والاعتمادات مركزية.</div></div><button id="rpClose" style="border:0;background:#f1f5f9;border-radius:10px;padding:7px 11px;cursor:pointer">✕</button></div>
 <label style="display:block;font-weight:800;font-size:13px;margin-top:16px">الاسم المعتمد في التقارير</label><input id="rpName" style="width:100%;padding:12px;border:1px solid #cbd5e1;border-radius:12px;margin-top:6px;font:inherit">
 <div style="margin-top:16px;border:2px dashed #cbd5e1;border-radius:16px;padding:14px;text-align:center"><b>التوقيع الرقمي للمستخدم</b><div id="rpSigPreview" style="height:80px;margin:9px 0;display:grid;place-items:center;color:#94a3b8">لا يوجد توقيع محفوظ</div><input id="rpSigFile" type="file" accept="image/png,image/jpeg,image/webp" style="width:100%"></div>
 <div style="background:#eff8f6;border-radius:14px;padding:11px;margin-top:14px;font-size:12px;color:#315d55">اسم المدرسة والإدارة التعليمية واسم المالك والمدير والختم وتوقيعات المالك والمدير تُستمد تلقائيًا من القالب المؤسسي المشترك ولا يمكن تعديلها من هذا القسم.</div>
 <div style="display:flex;gap:9px;margin-top:16px"><button id="rpSave" style="flex:1;border:0;background:#07a869;color:#fff;border-radius:12px;padding:12px;font-weight:900;cursor:pointer">حفظ</button><button id="rpCancel" style="border:0;background:#eef2f7;color:#475569;border-radius:12px;padding:12px 18px;font-weight:800;cursor:pointer">إلغاء</button></div><div id="rpMsg" style="min-height:20px;margin-top:9px;font-size:12px;color:#b42318"></div></div>`;
 document.body.appendChild(d);
 q('rpClose').onclick=q('rpCancel').onclick=()=>d.style.display='none';
 q('rpSigFile').onchange=async e=>{const f=e.target.files?.[0];if(!f)return;const r=new FileReader();r.onload=x=>{pendingSignatureUrl=x.target.result;q('rpSigPreview').innerHTML='<img src="'+pendingSignatureUrl+'" style="max-height:76px;max-width:100%;object-fit:contain">'};r.readAsDataURL(f)};
 q('rpSave').onclick=saveUI;
}
async function openUI(){
 ensureModal();await refresh();
 q('rpName').value=personal?.profile?.display_name||ctx?.userName||'';
 const sig=personal?.profile?.signatureUrl||'';q('rpSigPreview').innerHTML=sig?'<img src="'+sig+'" style="max-height:76px;max-width:100%;object-fit:contain">':'لا يوجد توقيع محفوظ';
 pendingSignatureFileId='';pendingSignatureUrl='';q('rpSigFile').value='';q('rpMsg').textContent='';q('role-profile-modal').style.display='flex';
}
async function saveUI(){
 const msg=q('rpMsg');try{
   msg.style.color='#64748b';msg.textContent='جارٍ الحفظ...';
   const f=q('rpSigFile').files?.[0];let fileId=personal?.profile?.signature_file_id||'';
   if(f){const up=await g.PrivateSchoolBridge.uploadModuleFile({moduleKey:'role_report_profile',file:f,slotKey:'user_signature',recordType:'user_report_profile',recordId:ctx.userId,displayName:f.name});fileId=up.file.id}
   personal=await invokeProfile('save',{displayName:q('rpName').value.trim(),signatureFileId:fileId});
   personal=await invokeProfile('get');syncLegacy();msg.style.color='#087548';msg.textContent='تم حفظ الاسم والتوقيع وتطبيقهما على التقارير.';setTimeout(()=>q('role-profile-modal').style.display='none',500);
 }catch(e){msg.style.color='#b42318';msg.textContent=e.message||'تعذر الحفظ'}
}
function addAdminButton(){
 if(page!=='administrative_employee_portal.html'||document.querySelector('[data-role-profile-settings]'))return;
 const bar=document.querySelector('.toolbar');if(!bar)return;const b=document.createElement('button');b.className='btn light';b.dataset.roleProfileSettings='1';b.textContent='⚙️ إعدادات مخصصة';b.onclick=openUI;bar.appendChild(b);
}
function installUI(){
 if(!UI_PAGES.has(page))return;
 ensureModal();g.openAppSettings=openUI;addAdminButton();
}
async function boot(){installUI();await refresh();}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
g.PrivateReportIdentity={refresh,open:openUI};
})(window);
