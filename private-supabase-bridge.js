(function(){
  'use strict';
  const URL='https://okjwdzvnqsdetxdsvdgr.supabase.co';
  const KEY='sb_publishable_rpHL2MOBqlgOU9eNHPOWiw_RW_mhrMx';
  const CONTEXT_KEY='smartSchool.private.context';
  const SCHOOL_KEY='smartSchool.currentSchool';
  const SESSION_KEYS=['currentSchoolUser','currentUser','current_school_id','current_school_code','current_school_name','activeSchoolId','active_school_id','smart_school_id','school_id','active_school_code','active_school_name','currentRole','currentUserName','currentUserEmail','is_admin_session','admin_verified'];
  let client=null;
  function sb(){
    if(client) return client;
    if(!window.supabase?.createClient) throw new Error('مكتبة Supabase غير محملة');
    client=window.supabase.createClient(URL,KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
    return client;
  }
  function base(){return location.href.split('#')[0].split('?')[0].replace(/[^/]*$/,'');}
  function params(){return new URLSearchParams(location.search);}
  function getSchoolId(){return params().get('schoolId')||JSON.parse(localStorage.getItem(CONTEXT_KEY)||'null')?.schoolId||'';}
  function saveContext(c){
    if(!c) return;
    localStorage.setItem(CONTEXT_KEY,JSON.stringify(c));
    localStorage.setItem(SCHOOL_KEY,JSON.stringify({id:c.schoolId,schoolId:c.schoolId,schoolName:c.schoolName,schoolCode:c.schoolCode,status:'active',schoolType:c.schoolType||'private'}));
    localStorage.setItem('current_school_id',c.schoolId||''); localStorage.setItem('activeSchoolId',c.schoolId||''); localStorage.setItem('active_school_id',c.schoolId||''); localStorage.setItem('smart_school_id',c.schoolId||''); localStorage.setItem('school_id',c.schoolId||'');
    localStorage.setItem('current_school_code',c.schoolCode||''); localStorage.setItem('active_school_code',c.schoolCode||''); localStorage.setItem('current_school_name',c.schoolName||''); localStorage.setItem('active_school_name',c.schoolName||'');
    localStorage.setItem('currentUserName',c.userName||''); localStorage.setItem('currentUserEmail',c.userEmail||''); localStorage.setItem('currentRole',roleToLegacy(c.role));
    const u={id:c.userId,name:c.userName,email:c.userEmail,role:roleToLegacy(c.role),dbRole:c.role,schoolId:c.schoolId,schoolName:c.schoolName,status:'active',isActive:true,edition:'private'};
    localStorage.setItem('currentSchoolUser',JSON.stringify(u)); localStorage.setItem('currentUser',JSON.stringify(u));
  }
  function roleToLegacy(r){return r==='manager'||r==='owner'?'leadership':r==='agent'?'agency':r==='teacher'?'performance':r||'performance';}
  function clearSchoolContext(){
    localStorage.removeItem(CONTEXT_KEY); localStorage.removeItem(SCHOOL_KEY);
    SESSION_KEYS.forEach(k=>localStorage.removeItem(k));
    try{sessionStorage.removeItem(CONTEXT_KEY); sessionStorage.removeItem('smartSchoolUnifiedOpsV2_follow_context');}catch(_){ }
  }
  async function signIn(email,password){const r=await sb().auth.signInWithPassword({email:String(email||'').trim(),password:String(password||'')});if(r.error) throw r.error;return r.data;}
  async function signOut(opts={}){try{await sb().auth.signOut({scope:'local'});}catch(_){ } clearSchoolContext(); if(opts.redirect!==false) location.replace(opts.to||'private-entry.html');}
  async function token(){const {data}=await sb().auth.getSession();return data.session?.access_token||'';}
  async function invoke(name,body,allowAnonymous=false){
    const headers={}; const t=await token(); if(t) headers.Authorization='Bearer '+t; else if(!allowAnonymous) throw new Error('لا توجد جلسة مصادقة نشطة');
    const r=await fetch(`${URL}/functions/v1/${name}`,{method:'POST',headers:{'Content-Type':'application/json',apikey:KEY,...headers},body:JSON.stringify(body||{})});
    let data={}; try{data=await r.json();}catch(_){ }
    if(!r.ok||data.error){const e=new Error(errorMessage(data.error||('HTTP '+r.status)));e.code=data.error||'';e.details=data;throw e;} return data;
  }
  function errorMessage(code){const m={unauthorized:'بيانات الدخول غير صحيحة أو انتهت الجلسة',forbidden:'لا تملك صلاحية تنفيذ هذه العملية',no_active_membership:'الحساب غير مفعل داخل المدرسة',school_not_active:'المدرسة غير مفعلة',owner_email_already_registered:'بريد المالك مسجل مسبقًا',manager_account_already_exists:'يوجد حساب مدير أو طلب قائم بهذا البريد',invite_not_found:'رابط الدعوة غير صحيح',invite_not_pending:'تم استخدام الدعوة أو إلغاؤها',invite_expired:'انتهت صلاحية الدعوة',password_too_short:'كلمة المرور يجب ألا تقل عن 8 أحرف',email_belongs_to_another_school:'البريد مرتبط بمدرسة أخرى',invalid_input:'تحقق من البيانات المدخلة'};return m[code]||String(code||'حدث خطأ غير متوقع');}
  async function sessionContext(schoolId,actorRole){const d=await invoke('private-school-session',{schoolId:schoolId||getSchoolId(),actorRole:actorRole||undefined});saveContext(d.context);return d;}
  async function systemAdmin(action,payload={}){return invoke('system-admin',{action,...payload});}
  async function provisionSchool(payload){return invoke('private-school-provisioning',{action:'create',...payload});}
  async function schoolOverview(schoolId){return invoke('private-school-provisioning',{action:'overview',schoolId});}
  async function owner(action,payload={}){return invoke('private-school-owner',{action,schoolId:payload.schoolId||getSchoolId(),...payload});}
  async function invite(action,payload={}){return invoke('private-school-invite',{action,...payload},true);}
  async function manager(action,payload={}){return invoke('private-school-manager',{action,schoolId:payload.schoolId||getSchoolId(),...payload});}
  async function compliance(action,payload={}){return invoke('private-school-compliance',{action,schoolId:payload.schoolId||getSchoolId(),...payload});}
  async function template(action,payload={}){return invoke('private-school-template',{action,schoolId:payload.schoolId||getSchoolId(),...payload});}
  async function outputs(action,payload={}){return invoke('private-school-outputs',{action,schoolId:payload.schoolId||getSchoolId(),...payload});}
  function gotoLanding(ctx){const c=ctx||JSON.parse(localStorage.getItem(CONTEXT_KEY)||'null');if(!c) return;const map={owner:'private-owner-portal.html',manager:'manager.html',agent:'agent.html',teacher:'teacher.html',student_advisor:'student_advisor.html',activity_leader:'activity_leader.html',kindergarten_teacher:'kindergarten_teacher.html',health_advisor:'health_advisor.html',administrative_employee:'administrative_employee_portal.html'};location.replace((map[c.role]||'private-entry.html')+`?private=1&schoolId=${encodeURIComponent(c.schoolId)}`);}
  async function requireRole(roles){const d=await sessionContext(getSchoolId());if(!roles.includes(d.context.role)) throw new Error('لا تملك صلاحية فتح هذه الصفحة');return d.context;}
  window.PrivateSchool={URL,KEY,sb,base,params,getSchoolId,saveContext,clearSchoolContext,signIn,signOut,invoke,sessionContext,systemAdmin,provisionSchool,schoolOverview,owner,invite,manager,compliance,template,outputs,gotoLanding,requireRole,errorMessage};
})();
