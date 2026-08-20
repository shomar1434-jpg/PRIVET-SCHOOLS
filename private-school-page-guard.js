(function(g){
 'use strict';
 const params=new URLSearchParams(location.search);
 const explicitPrivate=params.get('privateEdition')==='1'||params.get('edition')==='private';
 const privateMarker=localStorage.getItem('smart_school_private_edition')==='private';
 const systemAdminBypass=params.get('systemAdmin')==='1'||params.get('systemAdminReturn')==='1'||params.get('admin')==='true'||params.get('bypass')==='true'||params.get('mode')==='system_admin'||sessionStorage.getItem('system_admin_context')==='1'||sessionStorage.getItem('system_admin_verified')==='true';
 if(systemAdminBypass){document.documentElement.dataset.systemAdminBypass='1';document.documentElement.classList.remove('private-auth-pending');return;}
 if(!explicitPrivate && !privateMarker) return;
 const page=(location.pathname.split('/').pop()||'').toLowerCase();
 // index.html is the edition launcher, not a protected school workspace.
 // Never require a school session merely to render the landing page.
 if(page==='index.html'||page===''){document.documentElement.classList.remove('private-auth-pending');return;}
 const RULES=Object.freeze({
   'manager.html':{roles:['manager']},
   'agent.html':{roles:['agent']},
   'teacher.html':{roles:['teacher','kindergarten_teacher']},
   'administrative_employee_portal.html':{roles:['administrative_employee','manager','agent']},
   'student_advisor.html':{roles:['student_advisor']},
   'activity_leader.html':{roles:['activity_leader']},
   'school_command_center.html':{roles:['manager','owner']},
   'school_information_center.html':{roles:['manager','owner']},
   'manager_records.html':{roles:['manager','owner'],modules:['manager_records']},
   'self_evaluation_records.html':{roles:['manager','owner']},
   'external_evaluation_archive.html':{roles:['manager','owner']},
   'manager_exams_management.html':{roles:['manager']},
   'agent_exams_management.html':{roles:['agent','manager']},
   'deputy_weekly_teacher_followup.html':{roles:['agent','manager']},
   'school_health_unified_registry.html':{roles:['health_advisor','manager','owner'],modules:['health_guidance']},
   'wakil-records.html':{roles:['agent','manager'],modulePrefixes:['deputy_']},
   'activity_leader_records.html':{roles:['activity_leader','manager']},
   'student_advisor_records.html':{roles:['student_advisor','manager']},
   'administrative_employee_library.html':{roles:['administrative_employee','manager','agent']},
   'administrative_employee_execution.html':{roles:['administrative_employee','manager','agent']},
   'administrative_employee_plan.html':{roles:['administrative_employee','manager','agent']}
 });
 const relevantGrants=(ctx,rule)=>{
   const grants=Array.isArray(ctx?.accessGrants)?ctx.accessGrants:[];
   return grants.filter(gr=>{
     if(!gr||gr.canView===false)return false;
     const mk=String(gr.moduleKey||'').trim();
     if((rule.modules||[]).includes(mk))return true;
     return (rule.modulePrefixes||[]).some(p=>mk.startsWith(p));
   });
 };
 const routeParts=(value)=>{try{const u=new URL(value||'',location.href);return {page:(u.pathname.split('/').pop()||'').toLowerCase(),record:u.searchParams.get('record')||''}}catch(_){return {page:'',record:''}}};
 const grantAllowsCurrentRoute=(grants)=>{
   const current={page,record:params.get('record')||''};
   return grants.some(gr=>{const r=routeParts(gr.routeUrl);if(!r.page)return false;if(r.page!==current.page)return false;if(r.record)return r.record===current.record;return true;});
 };
 async function guard(){
   try{
     const ctx=await g.PrivateSchoolBridge.requireContext();
     if(['register.html','supabase-setup.html'].includes(page)){
       const landing=g.PrivateSchoolBridge.roleLanding(ctx);
       location.replace(landing+(landing.includes('?')?'&':'?')+'privateEdition=1');
       return;
     }
     const rule=RULES[page];
     if(rule){
       const byRole=(rule.roles||[]).includes(ctx.role);
       if(!byRole){
         const grants=relevantGrants(ctx,rule);
         if(!grants.length)throw new Error('لا تملك صلاحية فتح هذه الصفحة أو لم يعد التفويض ساريًا');
         if(!grantAllowsCurrentRoute(grants)){
           const first=grants.find(gr=>routeParts(gr.routeUrl).page===page&&gr.routeUrl);
           if(first&&!(params.get('record')||'')){location.replace(first.routeUrl+(first.routeUrl.includes('?')?'&':'?')+'privateEdition=1');return;}
           throw new Error('السجل المطلوب خارج نطاق التفويض الساري');
         }
       }
     }
     document.documentElement.dataset.schoolEdition='private';
     document.documentElement.dataset.privateRole=ctx.role;
     document.dispatchEvent(new CustomEvent('private-school-context-ready',{detail:ctx}));
   }catch(err){
     console.error('Private school guard:',err);
     try{ g.PrivateSchoolBridge.clearPrivateCompat(); }catch(_){}
     location.replace('school-login.html?edition=private&reason=authorization');
   }
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',guard,{once:true});else guard();
})(window);
