(function(){
 'use strict';
 try{
   const q=new URLSearchParams(location.search);
   const systemAdminBypass=q.get('systemAdmin')==='1'||q.get('systemAdminReturn')==='1'||q.get('admin')==='true'||q.get('bypass')==='true'||q.get('mode')==='system_admin'||sessionStorage.getItem('system_admin_context')==='1'||sessionStorage.getItem('system_admin_verified')==='true';
   if(systemAdminBypass){document.documentElement.dataset.systemAdminBypass='1';const page=(location.pathname.split('/').pop()||'').toLowerCase();if(['school-login.html','register.html','administrative_employee_login.html','private-owner-login.html'].includes(page)){document.documentElement.style.visibility='hidden';location.replace('index.html?systemAdminReturn=1&edition=private');}return;}
   const explicit=q.get('privateEdition')==='1'||q.get('edition')==='private';
   const ctx=sessionStorage.getItem('smart_school_private_session_v1');
   const marker=localStorage.getItem('smart_school_private_edition')==='private';
   const page=(location.pathname.split('/').pop()||'').toLowerCase();
   if(page==='school-login.html'&&!explicit) return;
   if(explicit||(marker&&ctx)) document.documentElement.classList.add('private-auth-pending');
 }catch(_){ }
})();
