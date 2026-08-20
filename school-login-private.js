(function(g){
 'use strict';
 function isPrivate(){const q=new URLSearchParams(location.search);return g.__PRIVATE_EDITION_BUILD__===true||q.get('edition')==='private'||q.get('privateEdition')==='1'||localStorage.getItem('smart_school_private_edition')==='private'}
 if(!isPrivate()){ try{ if(g.PrivateSchoolBridge && localStorage.getItem('smart_school_private_edition')==='private') g.PrivateSchoolBridge.clearPrivateCompat(); }catch(_){} return; }
 async function boot(){
   document.documentElement.dataset.schoolEdition='private';
   const old=g.schoolLogin;
   g.schoolLogin=async function(){
     const email=(document.getElementById('login-email')?.value||document.getElementById('user-madrasati-email')?.value||'').trim();
     const password=(document.getElementById('login-password')?.value||document.getElementById('user-login-password')?.value||'');
     const schoolId=new URLSearchParams(location.search).get('schoolId')||'';
     const msg=document.getElementById('login-msg'); if(msg)msg.textContent='';
     if(!email||!password){if(msg)msg.textContent='يرجى إدخال البريد وكلمة المرور';return}
     try{
       let data=await g.PrivateSchoolBridge.login(email,password,schoolId);
       let ctx=data.context;
       const roles=Array.isArray(ctx.availableRoles)&&ctx.availableRoles.length?ctx.availableRoles:[];
       if(roles.length>1){
         const labels={owner:'المالك',manager:'مدير/ة المدرسة',agent:'الوكيل/الوكيلة',teacher:'المعلم/المعلمة',student_advisor:'الموجه/ة الطلابي/ة',activity_leader:'رائد/ة النشاط',kindergarten_teacher:'معلم/ة رياض الأطفال',health_advisor:'الموجه/ة الصحي/ة',administrative_employee:'الموظف/ة الإداري/ة'};
         const list=roles.map((r,i)=>`${i+1}) ${labels[r]||r}`).join('\n');
         const answer=prompt('لديك أكثر من دور في هذه المدرسة. اختر رقم الدور الذي تريد الدخول به لهذه الجلسة:\n'+list,String(Math.max(1,roles.indexOf(ctx.role)+1)));
         const idx=Math.max(0,Math.min(roles.length-1,(parseInt(answer||'',10)||1)-1));
         const chosen=roles[idx];
         if(chosen!==ctx.role){data=await g.PrivateSchoolBridge.establishContext(ctx.schoolId,chosen);ctx=data.context;}
       }
       location.href=g.PrivateSchoolBridge.roleLanding(ctx)+(g.PrivateSchoolBridge.roleLanding(ctx).includes('?')?'&':'?')+'privateEdition=1';
     }catch(e){if(msg)msg.textContent=e.message||'تعذر تسجيل الدخول'}
   };
   g.schoolLogin.__privateReplacement=true;g.schoolLogin.__old=old;
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})(window);
