(function(g){
  'use strict';
  const C=g.PrivateSchoolConfig;
  if(!C) throw new Error('PrivateSchoolConfig غير محمل');
  const ROLE_MAP=Object.freeze({
    owner:'owner', manager:'leadership', agent:'agency', teacher:'performance',
    student_advisor:'student_advisor', activity_leader:'activity_leader',
    kindergarten_teacher:'kindergarten_teacher', health_advisor:'health_advisor',
    administrative_employee:'administrative_employee'
  });
  const LEGACY_KEYS=['activeSchool','activeSchoolId','active_school','active_school_code','active_school_id','active_school_login_url','active_school_name','current_school_id','current_school_code','current_school_name','school_id','smart_school_id','smart_school_active_role','currentRole','currentUserId','current_user_id','currentUserName','currentUserEmail','smart_school_current_session','smart_school_teacher_extra_roles_map','smartSchoolCloudStorage_teacher_extra_roles_map'];
  let client=null;
  function getClient(){
    if(client) return client;
    if(!g.supabase || !g.supabase.createClient) throw new Error('مكتبة Supabase غير جاهزة');
    client=g.supabase.createClient(C.supabaseUrl,C.publishableKey,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
    return client;
  }
  function clean(v){return String(v??'').trim()}
  function safeJson(s,fallback){try{return JSON.parse(s)}catch(_){return fallback}}
  function privateContext(){return safeJson(sessionStorage.getItem(C.sessionStorageKey)||'null',null)}
  function clearPrivateCompat(){
    try{ g.PrivateSessionReset?.clearActiveSchoolContext?.({}); }catch(_){}
    sessionStorage.removeItem(C.sessionStorageKey);
    sessionStorage.removeItem(C.schoolListStorageKey);
    for(const k of LEGACY_KEYS){
      try{ localStorage.removeItem(k); }catch(_){}
      try{ sessionStorage.removeItem('private-owned:'+k); sessionStorage.removeItem('private-backup:'+k); sessionStorage.removeItem('private-backup:'+k+':exists'); }catch(_){}
    }
    [
      'persist_school','selected_school_id','selected_school_name','school_name','school_code','active_school_membership_id',
      'smart_school_active_membership_id','smartSchool.currentSchool','smart_school_active_school','smart_school_active_school_id',
      'smart_school_active_school_name','currentSchool','schoolContext','school_context'
    ].forEach(k=>{try{localStorage.removeItem(k)}catch(_){}});
    localStorage.removeItem('smart_school_private_edition');
  }
  function writeLegacy(k,v){
    try{
      sessionStorage.setItem('private-owned:'+k,'1');
      sessionStorage.removeItem('private-backup:'+k);
      sessionStorage.removeItem('private-backup:'+k+':exists');
    }catch(_){}
    localStorage.setItem(k,typeof v==='string'?v:JSON.stringify(v));
  }
  function applyCompatibility(ctx){
    if(!ctx || ctx.edition!=='private') throw new Error('سياق مدرسة خاصة غير صالح');
    const appRole=ROLE_MAP[ctx.role]||ctx.role;
    localStorage.setItem('smart_school_private_edition','private');
    writeLegacy('activeSchoolId',ctx.schoolId); writeLegacy('active_school_id',ctx.schoolId); writeLegacy('current_school_id',ctx.schoolId); writeLegacy('school_id',ctx.schoolId); writeLegacy('smart_school_id',ctx.schoolId);
    writeLegacy('active_school_code',ctx.schoolCode||''); writeLegacy('current_school_code',ctx.schoolCode||'');
    writeLegacy('active_school_name',ctx.schoolName||''); writeLegacy('current_school_name',ctx.schoolName||'');
    writeLegacy('currentRole',appRole); writeLegacy('smart_school_active_role',appRole); writeLegacy('currentUserId',ctx.userId||''); writeLegacy('current_user_id',ctx.userId||''); writeLegacy('currentUserName',ctx.userName||''); writeLegacy('currentUserEmail',ctx.userEmail||'');
    writeLegacy('activeSchool',{id:ctx.schoolId,schoolId:ctx.schoolId,schoolName:ctx.schoolName,schoolCode:ctx.schoolCode,schoolEdition:'private'});
    writeLegacy('active_school',{id:ctx.schoolId,schoolId:ctx.schoolId,schoolName:ctx.schoolName,schoolCode:ctx.schoolCode,schoolEdition:'private'});
    const delegatedModules=[...new Set((Array.isArray(ctx.accessGrants)?ctx.accessGrants:[]).filter(g=>g&&g.canView!==false&&g.moduleKey).map(g=>String(g.moduleKey).trim()).filter(Boolean))];
    if(ctx.role==='teacher' || ctx.role==='kindergarten_teacher'){
      const roleMap={};
      if(ctx.userId)roleMap['id:'+ctx.userId]=delegatedModules;
      if(ctx.userEmail)roleMap['email:'+String(ctx.userEmail).trim().toLowerCase()]=delegatedModules;
      writeLegacy('smart_school_teacher_extra_roles_map',roleMap);
      writeLegacy('smartSchoolCloudStorage_teacher_extra_roles_map',roleMap);
    }
    writeLegacy('smart_school_current_session',{id:ctx.userId,name:ctx.userName,email:ctx.userEmail,role:appRole,dbRole:ctx.role,schoolId:ctx.schoolId,schoolName:ctx.schoolName,schoolCode:ctx.schoolCode,schoolEdition:'private',privateSchool:true,loginMode:'private-auth',accessGrants:Array.isArray(ctx.accessGrants)?ctx.accessGrants:[],availableRoles:Array.isArray(ctx.availableRoles)?ctx.availableRoles:[],supervisorUserId:ctx.supervisorUserId||'',supervisorRole:ctx.supervisorRole||'',authenticatedAt:ctx.authenticatedAt});
  }
  async function invoke(fn,body,opts={}){
    const sb=getClient(); const {data:{session}}=await sb.auth.getSession();
    const token=session?.access_token;
    if(!token && !opts.allowAnonymous) throw new Error('يلزم تسجيل الدخول');
    const res=await fetch(`${C.supabaseUrl}/functions/v1/${fn}`,{method:'POST',headers:{'Content-Type':'application/json','apikey':C.publishableKey,...(token?{'Authorization':'Bearer '+token}:{})},body:JSON.stringify(body||{})});
    let data={}; try{data=await res.json()}catch(_){data={error:'استجابة غير صالحة من الخادم'}}
    if(!res.ok || data?.error){const e=new Error(data?.error||`فشل الطلب (${res.status})`);e.status=res.status;e.details=data?.details;e.payload=data;throw e}
    return data;
  }
  async function establishContext(schoolId='',actorRole=''){
    const requestedRole=clean(actorRole)||clean(privateContext()?.role);
    const data=await invoke('private-school-session',{schoolId:clean(schoolId),actorRole:requestedRole});
    const ctx=data.context;
    if(!ctx || ctx.edition!=='private') throw new Error('تعذر إنشاء سياق المدرسة الخاصة');
    sessionStorage.setItem(C.sessionStorageKey,JSON.stringify(ctx));
    sessionStorage.setItem(C.schoolListStorageKey,JSON.stringify(data.schools||[]));
    applyCompatibility(ctx); return data;
  }
  async function login(email,password,schoolId='',actorRole=''){
    clearPrivateCompat();
    const sb=getClient(); const r=await sb.auth.signInWithPassword({email:clean(email).toLowerCase(),password:String(password||'')});
    if(r.error) throw new Error('بيانات الدخول غير صحيحة أو الحساب غير متاح');
    try{return await establishContext(schoolId,actorRole)}catch(e){await sb.auth.signOut();clearPrivateCompat();throw e}
  }
  async function logout(){try{await getClient().auth.signOut()}finally{clearPrivateCompat()}}
  async function requireContext(allowedRoles){
    let ctx=privateContext();
    const {data:{session}}=await getClient().auth.getSession();
    if(!session){clearPrivateCompat();throw new Error('انتهت جلسة الدخول')}
    if(!ctx || ctx.edition!=='private' || ctx.userId!==session.user.id){ctx=(await establishContext(ctx?.schoolId||'',ctx?.role||'')).context}
    if(Array.isArray(allowedRoles)&&allowedRoles.length&&!allowedRoles.includes(ctx.role)) throw new Error('لا تملك صلاحية فتح هذه الصفحة');
    applyCompatibility(ctx); return ctx;
  }
  function roleLanding(ctx){return clean(ctx?.landingPath)||'school-login.html'}
  async function inspectInvite(token){return invoke('private-school-invite',{action:'inspect',token:clean(token)},{allowAnonymous:true})}
  async function acceptInvite(payload){return invoke('private-school-invite',{action:'accept',token:clean(payload.token),password:String(payload.password||''),fullName:clean(payload.fullName)},{allowAnonymous:true})}
  async function owner(action,payload={}){const ctx=await requireContext(['owner']);return invoke('private-school-owner',{action,schoolId:ctx.schoolId,...payload})}
  async function manager(action,payload={}){const ctx=await requireContext(['manager']);return invoke('private-school-manager',{action,schoolId:ctx.schoolId,actorRole:ctx.role,...payload})}
  async function staff(action,payload={}){const ctx=await requireContext(['manager','agent']);return invoke('private-school-manager',{action,schoolId:ctx.schoolId,actorRole:ctx.role,...payload})}
  async function workflows(action,payload={}){const ctx=await requireContext();return invoke('private-school-workflows',{action,schoolId:ctx.schoolId,actorRole:ctx.role,...payload})}
  async function compliance(action,payload={}){const ctx=await requireContext(['owner','manager']);return invoke('private-school-compliance',{action,schoolId:ctx.schoolId,...payload})}
  async function performance(action,payload={}){const ctx=await requireContext();return invoke('private-school-performance',{action,schoolId:ctx.schoolId,actorRole:ctx.role,...payload})}
  async function messages(action,payload={}){const ctx=await requireContext();return invoke('private-school-messages',{action,schoolId:ctx.schoolId,actorRole:ctx.role,...payload})}
  async function tasks(action,payload={}){const ctx=await requireContext();return invoke('private-school-tasks',{action,schoolId:ctx.schoolId,actorRole:ctx.role,...payload})}
  async function directory(action='list',payload={}){const ctx=await requireContext();return invoke('private-school-directory',{action,schoolId:ctx.schoolId,actorRole:ctx.role,...payload})}
  async function files(action,payload={}){const ctx=await requireContext();return invoke('private-school-files',{action,schoolId:ctx.schoolId,actorRole:ctx.role,...payload})}
  async function uploadModuleFile({moduleKey,file,slotKey='',recordType='',recordId='',displayName=''}){
    if(!file || typeof file.size!=='number') throw new Error('اختر ملفًا صالحًا');
    const ctx=await requireContext();
    const ticket=await invoke('private-school-files',{action:'create_upload_ticket',schoolId:ctx.schoolId,moduleKey,actorRole:ctx.role,fileName:file.name,mimeType:file.type||'application/octet-stream',fileSize:file.size,slotKey,recordType,recordId});
    const up=await getClient().storage.from(ticket.bucket).uploadToSignedUrl(ticket.path,ticket.token,file,{contentType:file.type||ticket.mimeType||'application/octet-stream'});
    if(up.error) throw new Error('فشل رفع الملف: '+up.error.message);
    return invoke('private-school-files',{action:'register_upload',schoolId:ctx.schoolId,moduleKey,actorRole:ctx.role,path:ticket.path,fileName:file.name,mimeType:file.type||ticket.mimeType||'application/octet-stream',fileSize:file.size,slotKey,recordType,recordId,displayName:displayName||file.name});
  }
  async function template(payload={}){const ctx=await requireContext();return invoke('private-school-template',{schoolId:ctx.schoolId,...payload})}
  async function outputs(action,payload={}){const ctx=await requireContext();return invoke('private-school-outputs',{action,schoolId:ctx.schoolId,...payload})}
  async function selfEvaluationOutput(action='snapshot',payload={}){const ctx=await requireContext(['owner','manager']);return invoke('private-school-self-evaluation-output',{action,schoolId:ctx.schoolId,...payload})}
  async function provisionPrivateSchool(payload={}){return invoke('private-school-provisioning',{action:'create',...payload})}
  async function privateSchoolOverview(schoolId){return invoke('private-school-provisioning',{action:'overview',schoolId:clean(schoolId)})}
  g.PrivateSchoolBridge=Object.freeze({getClient,login,logout,establishContext,requireContext,privateContext,roleLanding,inspectInvite,acceptInvite,owner,manager,staff,workflows,compliance,performance,messages,tasks,directory,files,uploadModuleFile,template,outputs,selfEvaluationOutput,provisionPrivateSchool,privateSchoolOverview,applyCompatibility,clearPrivateCompat,ROLE_MAP});
})(window);
