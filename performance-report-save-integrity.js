(function(){
'use strict';
if(window.__PERFORMANCE_REPORT_SAVE_INTEGRITY_V5__)return;
window.__PERFORMANCE_REPORT_SAVE_INTEGRITY_V5__=true;

function root(){return document.getElementById('report-content-container')}
function goals(){return Array.from(document.querySelectorAll('#report-content-container [id^="subGoal-"]'))}
function roleKey(){
  const p=(location.pathname.split('/').pop()||'').toLowerCase();
  if(/agent/.test(p))return 'school_reports';
  if(/manager/.test(p))return 'school_reports';
  return 'reports_archive';
}
function show(msg,bad){
  try{
    if(typeof window.showToast==='function'){window.showToast(msg);return}
  }catch(e){}
  if(bad)console.error(msg);else console.info(msg);
}
function syncControls(){
  const r=root();if(!r)return;
  r.querySelectorAll('select').forEach(sel=>{
    Array.from(sel.options||[]).forEach(opt=>{
      if(opt.value===sel.value)opt.setAttribute('selected','selected');else opt.removeAttribute('selected');
    });
    sel.setAttribute('data-saved-value',sel.value||'');
  });
  r.querySelectorAll('input').forEach(inp=>{
    if(inp.type==='checkbox'||inp.type==='radio'){
      if(inp.checked)inp.setAttribute('checked','checked');else inp.removeAttribute('checked');
    }else inp.setAttribute('value',inp.value||'');
  });
  r.querySelectorAll('textarea').forEach(t=>t.textContent=t.value||'');
}
function capture(){
  const r=root(),s={selects:{},inputs:{},goals:{}};
  if(!r)return s;
  r.querySelectorAll('select[id]').forEach(e=>s.selects[e.id]=e.value);
  r.querySelectorAll('input[id],textarea[id]').forEach(e=>s.inputs[e.id]=(e.type==='checkbox'||e.type==='radio')?!!e.checked:e.value);
  goals().forEach(g=>s.goals[g.id]={html:g.innerHTML,text:g.innerText,userGoal:g.dataset.userGoal==='1'||!!g.innerText.trim()});
  return s;
}
function restore(s){
  if(!s)return;
  Object.entries(s.selects||{}).forEach(([id,v])=>{const e=document.getElementById(id);if(e)e.value=v});
  Object.entries(s.inputs||{}).forEach(([id,v])=>{const e=document.getElementById(id);if(!e)return;if(e.type==='checkbox'||e.type==='radio')e.checked=!!v;else e.value=v});
  Object.entries(s.goals||{}).forEach(([id,v])=>{const e=document.getElementById(id);if(e){e.innerHTML=v.html||'';if(v.userGoal)e.dataset.userGoal='1'}});
  syncControls();
}
function updateSavedRow(key,id,state){
  let rows=[];try{rows=JSON.parse(localStorage.getItem(key)||'[]')}catch(e){}
  if(!Array.isArray(rows)||!rows.length)return null;
  let idx=rows.findIndex(r=>String(r.id)===String(id));
  if(idx<0)idx=rows.length-1;
  if(idx<0)return null;
  const row=rows[idx],r=root();
  row.formState=state;
  row.savedDropdowns=state.selects||{};
  row.manualDetailedGoals=state.goals||{};
  row.archiveType=row.archiveType||'performance_report';
  row.updatedAt=new Date().toISOString();
  if(r)row.content=r.innerHTML;
  rows[idx]=row;
  localStorage.setItem(key,JSON.stringify(rows));
  return row;
}
function install(){
  const fn=window.saveReportToArchive;
  if(typeof fn!=='function'||fn.__performanceSaveIntegrityV5)return false;
  const original=fn;
  const wrapped=function(){
    const state=capture();
    // أي أهداف موجودة لحظة ضغط الحفظ تُعامل كمدخل مستخدم ولا يجوز استبدالها.
    goals().forEach(g=>{if(g.innerText.trim())g.dataset.userGoal='1'});
    syncControls();
    const beforeId=(typeof currentEditingId!=='undefined'?currentEditingId:null);
    const result=original.apply(this,arguments);
    restore(state);
    const id=(typeof currentEditingId!=='undefined'?currentEditingId:beforeId);
    const key=roleKey();
    const row=updateSavedRow(key,id,state);
    if(row&&window.ArchiveSaveIntegrity){
      show('تم حفظ التقرير، جارٍ التحقق من الأرشيف السحابي...');
      Promise.resolve(ArchiveSaveIntegrity.confirmArrayRecord(key,row.id)).then(v=>{
        show(v.cloud?'تم حفظ التقرير والتحقق من الأرشيف السحابي ✅':'تم حفظ التقرير في الأرشيف ✅');
      }).catch(e=>{
        show('حُفظ التقرير محليًا، لكن تعذر التحقق السحابي: '+(e?.message||e),true);
      });
    }
    return result;
  };
  wrapped.__performanceSaveIntegrityV5=true;
  window.saveReportToArchive=wrapped;
  return true;
}
if(!install()){
  document.addEventListener('DOMContentLoaded',()=>setTimeout(install,0),{once:true});
  setTimeout(install,500);setTimeout(install,1600);
}
})();