(function(g){
 'use strict';
 if(g.__privateSchoolNavLoaded)return;g.__privateSchoolNavLoaded=true;
 const page=(location.pathname.split('/').pop()||'').toLowerCase();
 if(page==='manager.html')return;
 const params=new URLSearchParams(location.search);
 const isPrivate=params.get('privateEdition')==='1'||params.get('edition')==='private'||localStorage.getItem('smart_school_private_edition')==='private';
 if(!isPrivate)return;
 const withPrivate=u=>{try{const x=new URL(u,location.href);x.searchParams.set('privateEdition','1');return x.pathname.split('/').pop()+x.search+x.hash}catch(_){return u}};
 const workflowUrl='private-workflows.html?privateEdition=1';

 function removeLegacyBar(){
  const old=document.getElementById('private-school-nav');
  if(old)old.remove();
 }

 function workflowCardHtml(){
  return `
   <div id="private-discipline-requests-card" class="bg-white/90 backdrop-blur p-10 rounded-[45px] shadow-lg border border-white hover:border-rose-400 cursor-pointer transition-all flex flex-col items-center gap-4 group hover:-translate-y-2" role="button" tabindex="0" aria-label="طلبات حالات الانضباط">
    <div class="w-20 h-20 bg-gradient-to-br from-rose-500 to-red-700 text-white rounded-3xl flex items-center justify-center shadow-lg group-hover:rotate-6 transition-transform text-4xl">📝</div>
    <h3 class="font-bold text-xl text-slate-700">طلبات حالات الانضباط</h3>
    <p class="text-[10px] text-slate-500 text-center leading-relaxed font-bold">رفع ومتابعة طلبات الغياب والاستئذان والإجازات والانتداب والدورات.</p>
   </div>`;
 }

 function installStandardWorkflowCard(){
  if(document.getElementById('private-discipline-requests-card'))return true;
  const main=document.querySelector('#welcome-dashboard main');
  if(!main)return false;
  let grid=null;
  const grids=Array.from(main.querySelectorAll('.grid.grid-cols-1'));
  grid=grids.find(el=>el.querySelector('h3')&&el.children.length>=1)||null;
  if(!grid)return false;
  const holder=document.createElement('div');holder.innerHTML=workflowCardHtml().trim();
  const card=holder.firstElementChild;
  card.addEventListener('click',()=>location.href=workflowUrl);
  card.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();location.href=workflowUrl;}});
  grid.appendChild(card);
  return true;
 }

 function installAdminWorkflowCard(){
  if(document.getElementById('private-discipline-requests-card'))return true;
  const grid=document.querySelector('#employeeMode.cards');
  if(!grid)return false;
  const card=document.createElement('div');
  card.id='private-discipline-requests-card';card.className='card';card.tabIndex=0;card.setAttribute('role','button');
  card.innerHTML='<div class="ico">📝</div><h2>طلبات حالات الانضباط</h2><p>رفع ومتابعة طلبات الغياب والاستئذان والإجازات والانتداب والدورات.</p><span class="btn">فتح الطلبات</span>';
  const go=()=>location.href=workflowUrl;card.onclick=go;card.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();go();}};
  grid.appendChild(card);
  return true;
 }

 function installWorkflowCard(ctx){
  if(['owner','manager'].includes(ctx.role))return;
  const adminPage=page==='administrative_employee_portal.html'||ctx.role==='administrative_employee';
  let attempts=0;
  const tryInstall=()=>{
   removeLegacyBar();
   const ok=adminPage?installAdminWorkflowCard():installStandardWorkflowCard();
   if(!ok&&attempts++<30)setTimeout(tryInstall,250);
  };
  tryInstall();
 }

 async function boot(){
  removeLegacyBar();
  if(!g.PrivateSchoolBridge)return;
  let ctx;try{ctx=await g.PrivateSchoolBridge.requireContext();}catch(_){return}
  installWorkflowCard(ctx);
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})(window);
