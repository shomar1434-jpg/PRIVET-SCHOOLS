(function(){
'use strict';
if(window.__OP_INSPECTION_CARD_PRESERVE_AGENT_V3__)return;
window.__OP_INSPECTION_CARD_PRESERVE_AGENT_V3__=true;

function openSection(){
  location.href='operational_inspection_followup.html?role=agent';
}
window.openOperationalInspectionFollowup=openSection;

function findMainCardsGrid(){
  const dash=document.getElementById('welcome-dashboard');
  if(!dash)return null;
  const grids=Array.from(dash.querySelectorAll('.grid'));
  return grids.find(g =>
    g.querySelector('[onclick*="deputy_weekly_teacher_followup.html"]') ||
    g.querySelector('[onclick*="wakil_staff_discipline.html"]') ||
    g.querySelector('[onclick*="agent_exams_management.html"]')
  ) || grids.find(g=>g.children.length>=4) || null;
}
function inject(){
  if(document.getElementById('operational-inspection-followup-card'))return true;
  const grid=findMainCardsGrid();
  if(!grid)return false;
  const card=document.createElement('div');
  card.id='operational-inspection-followup-card';
  card.className='bg-white/90 p-8 rounded-[45px] shadow-lg border border-white hover:border-cyan-400 cursor-pointer transition-all flex flex-col items-center gap-4 group min-h-[220px]';
  card.setAttribute('role','button');
  card.tabIndex=0;
  card.innerHTML=
    '<div class="w-16 h-16 bg-gradient-to-br from-cyan-700 to-teal-600 text-white rounded-[24px] flex items-center justify-center shadow-xl text-3xl">🛠️</div>'+
    '<div class="text-center"><h3 class="font-black text-lg text-slate-800">الفحص و المتابعة التشغيلية</h3>'+
    '<p class="text-[11px] text-slate-400 font-bold mt-2">الحافلات • المقصف • الصيانة • النظافة</p></div>';
  card.onclick=openSection;
  card.onkeydown=function(e){if(e.key==='Enter'||e.key===' '){e.preventDefault();openSection()}};
  grid.appendChild(card);
  return true;
}
function boot(){
  inject();
  [100,250,500,900,1500,2500,4000].forEach(ms=>setTimeout(inject,ms));
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});
else boot();
window.addEventListener('load',()=>setTimeout(inject,50));
})();