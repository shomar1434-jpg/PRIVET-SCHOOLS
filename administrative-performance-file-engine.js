/* =========================================================
   ملف الأداء الوظيفي — الموظف الإداري V1
   مسار مستقل عن مجالات شاغلي الوظائف التعليمية.
   يعتمد على: أهداف الأداء + الجدارات + التقارير المعتمدة فقط.
   ========================================================= */
(function(){
  'use strict';
  if(window.__SS_ADMINISTRATIVE_PERFORMANCE_ENGINE__) return;
  window.__SS_ADMINISTRATIVE_PERFORMANCE_ENGINE__=true;

  var MODAL_ID='ss-admin-performance-modal-v1';
  var STYLE_ID='ss-admin-performance-style-v1';
  var COMPETENCIES=[
    {name:'حس المسؤولية',weight:10},
    {name:'التعاون',weight:5},
    {name:'التواصل',weight:5},
    {name:'تحقيق النتائج',weight:20},
    {name:'تطوير الموظفين',weight:10},
    {name:'الارتباط الوظيفي',weight:10},
    {name:'القيادة',weight:40}
  ];
  function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]});}
  function parse(v,f){try{return JSON.parse(v||'');}catch(e){return f;}}
  function pick(keys,f){for(var i=0;i<keys.length;i++){var v=localStorage.getItem(keys[i]);if(v&&String(v).trim())return String(v).trim();}return f||'';}
  function year(){return pick(['academic_year','school_academic_year','persist_academic_year'],'1447هـ');}
  function template(){return parse(localStorage.getItem('ss_private_template_cache_v1'),{});}
  function templateValue(keys){var t=template(),pools=[t,t.output,t.profile,t.settings,t.school,t.schoolInfo,t.school_info,t.data].filter(Boolean);for(var p=0;p<pools.length;p++){for(var i=0;i<keys.length;i++){var v=pools[p][keys[i]];if(v!=null&&String(v).trim())return String(v).trim();}}return '';}
  function identity(){return {name:pick(['employee_name','user_name','current_user_name'],'الموظف/ة الإداري/ة'),school:templateValue(['schoolName','school_name','displayName'])||pick(['persist_school','school_name','setting_school','current_school_name'],'المدرسة'),region:templateValue(['regionName','region_name','educationDepartment','education_department','directorate'])||pick(['persist_region','region_name','setting_region','education_department'],'إدارة التعليم'),year:year()};}
  function approvedReports(){
    var keys=['school_reports','reports_archive','enhancedReportsArchive','smart_archive_reports','digital_archive_reports'],out=[],seen={};
    for(var i=0;i<localStorage.length;i++){var k=localStorage.key(i)||'';if(/reports_archive|school_reports|smart.*archive|digital.*archive/i.test(k))keys.push(k);}
    keys.filter(function(k,i,a){return a.indexOf(k)===i;}).forEach(function(k){var v=parse(localStorage.getItem(k),[]),arr=Array.isArray(v)?v:(v&&Array.isArray(v.reports)?v.reports:[]);arr.forEach(function(r){if(!r||typeof r!=='object')return;var st=String(r.approvalStatus||r.workflowStatus||r.status||'').toLowerCase();if(st!=='approved'&&st!=='معتمد')return;var id=String(r.id||r.workflowReportKey||r.title||'')+'|'+String(r.date||r.createdAt||'');if(seen[id])return;seen[id]=1;out.push(r);});});
    return out;
  }
  function goalName(r){return String(r.objectiveName||r.goalName||r.goal||r.objective||r.performanceGoal||'هدف أداء موثق').trim();}
  function compName(r){return String(r.competencyName||r.competency||r.competencyTitle||'').trim();}
  function titleOf(r){return String(r.title||r.reportTitle||r.name||'تقرير أداء').trim();}
  function dateOf(r){return String(r.date||r.createdAt||r.updatedAt||'').trim();}
  function summaryOf(r){var x=String(r.summary||r.description||r.content||'').replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim();return x.slice(0,260);}
  function groupGoals(reps){var m={};reps.forEach(function(r){var n=goalName(r);(m[n]||(m[n]=[])).push(r);});return Object.keys(m).map(function(n){return {name:n,reports:m[n]};});}
  function compEvidence(reps,c){return reps.filter(function(r){var n=compName(r);return n===c.name||String(r.categoryName||r.category||'').indexOf(c.name)>-1;});}
  function deepValue(obj,keys){if(!obj||typeof obj!=='object')return '';var pools=[obj,obj.output,obj.profile,obj.settings,obj.school,obj.schoolInfo,obj.school_info,obj.data].filter(Boolean);for(var p=0;p<pools.length;p++){for(var i=0;i<keys.length;i++){var v=pools[p][keys[i]];if(v!=null&&String(v).trim())return String(v).trim();}}return '';}
  function approval(){var t=template();var name=deepValue(t,['managerDisplayName','manager_display_name','managerName','manager_name','principalName','principal_name','directorName','director_name','schoolManagerName','school_manager_name'])||pick(['manager_name','persist_name_m'],'مدير/ة المدرسة');var sig=deepValue(t,['manager_signatureUrl','managerSignatureUrl','manager_signature_url','managerSignature','principalSignatureUrl','principal_signature_url','directorSignatureUrl','signatureImg','manager_signature']);var stamp=deepValue(t,['digital_stampUrl','digitalStampUrl','digital_stamp_url','schoolStampUrl','school_stamp_url','stampUrl','stampImg','schoolStamp','digitalStamp']);return {name:name,sig:sig,stamp:stamp};}
  function installStyle(){if(document.getElementById(STYLE_ID))return;var s=document.createElement('style');s.id=STYLE_ID;s.textContent=`
#${MODAL_ID}{position:fixed;inset:0;z-index:2147483500;background:#eef4f3;overflow:auto;display:none;direction:rtl;font-family:Cairo,Tajawal,Arial,sans-serif}
.ssa-top{position:sticky;top:0;z-index:5;background:#0f766e;color:#fff;padding:14px 20px;display:flex;justify-content:space-between;align-items:center;gap:12px;box-shadow:0 4px 18px #0002}.ssa-top h2{margin:0;font-size:20px}.ssa-btn{border:0;border-radius:12px;padding:9px 14px;font-weight:900;cursor:pointer}.ssa-back{background:#fff;color:#0f766e}.ssa-print{background:#f59e0b;color:#111827}.ssa-wrap{max-width:1120px;margin:22px auto;padding:0 16px 40px}.ssa-sheet{background:#fff;border:1px solid #dbe6e4;border-radius:24px;padding:24px;margin-bottom:18px;box-shadow:0 12px 34px #0f172a12}.ssa-title{color:#0f766e;font-size:18px;font-weight:900;margin:0 0 14px}.ssa-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:12px}.ssa-stat,.ssa-card{border:1px solid #dbe6e4;border-radius:16px;padding:14px;background:#f8fbfa}.ssa-stat small,.ssa-card small{color:#64748b}.ssa-stat strong{display:block;font-size:23px;color:#0f766e;margin-top:4px}.ssa-report{border-top:1px dashed #cbd5e1;padding:10px 0}.ssa-report:first-child{border-top:0}.ssa-report b{color:#1f2937}.ssa-report p{font-size:12px;color:#64748b;line-height:1.8;margin:4px 0}.ssa-comp-row{display:grid;grid-template-columns:1.2fr 80px 1fr;gap:10px;align-items:center;border-bottom:1px solid #edf2f2;padding:12px 0}.ssa-weight{font-weight:900;color:#b45309}.ssa-approval{display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;text-align:center}.ssa-approval>div{border:1px solid #dbe6e4;border-radius:16px;padding:14px;min-height:100px;display:flex;flex-direction:column;align-items:center;justify-content:center}.ssa-approval img{max-height:70px;max-width:140px;object-fit:contain}@media(max-width:700px){.ssa-comp-row,.ssa-approval{grid-template-columns:1fr}.ssa-top{align-items:flex-start;flex-direction:column}}@media print{#${MODAL_ID}{position:static;display:block!important;background:white}.ssa-top{display:none}.ssa-wrap{max-width:none;margin:0;padding:0}.ssa-sheet{box-shadow:none;border:0;break-inside:avoid}}
`;document.head.appendChild(s);}
  function createModal(){if(document.getElementById(MODAL_ID))return;var m=document.createElement('div');m.id=MODAL_ID;m.innerHTML='<div class="ssa-top"><div><h2>ملف الأداء الوظيفي — الموظف الإداري</h2><small>مسار مستقل قائم على الأهداف والجدارات والتقارير المعتمدة</small></div><div style="display:flex;gap:8px"><button class="ssa-btn ssa-print" onclick="window.print()">طباعة</button><button class="ssa-btn ssa-back" onclick="document.getElementById(\''+MODAL_ID+'\').style.display=\'none\'">العودة لواجهة القسم</button></div></div><div class="ssa-wrap" id="ss-admin-performance-content"></div>';document.body.appendChild(m);}
  function render(){var i=identity(),reps=approvedReports(),goals=groupGoals(reps),a=approval();var goalHtml=goals.length?goals.map(function(g,idx){return '<div class="ssa-card"><div style="display:flex;justify-content:space-between;gap:8px"><b>'+(idx+1)+' — '+esc(g.name)+'</b><span style="font-size:11px;font-weight:900;color:#0f766e">'+g.reports.length+' تقرير</span></div>'+g.reports.map(function(r){return '<div class="ssa-report"><b>'+esc(titleOf(r))+'</b><small style="display:block">'+esc(dateOf(r))+'</small><p>'+esc(summaryOf(r))+'</p></div>';}).join('')+'</div>';}).join(''):'<div class="ssa-card">لا توجد تقارير أهداف معتمدة حتى الآن.</div>';
    var compHtml=COMPETENCIES.map(function(c){var ev=compEvidence(reps,c);return '<div class="ssa-comp-row"><b>'+esc(c.name)+'</b><span class="ssa-weight">'+c.weight+'%</span><span style="font-size:12px;color:#64748b">'+(ev.length?ev.length+' شاهد/تقرير معتمد':'لا توجد شواهد معتمدة')+'</span></div>';}).join('');
    var html='<section class="ssa-sheet"><h3 class="ssa-title">بيانات الملف</h3><div class="ssa-grid"><div class="ssa-stat"><small>الموظف</small><strong>'+esc(i.name)+'</strong></div><div class="ssa-stat"><small>المدرسة</small><strong style="font-size:16px">'+esc(i.school)+'</strong></div><div class="ssa-stat"><small>العام الدراسي</small><strong>'+esc(i.year)+'</strong></div><div class="ssa-stat"><small>التقارير المعتمدة</small><strong>'+reps.length+'</strong></div></div></section>'+
    '<section class="ssa-sheet"><h3 class="ssa-title">أهداف الأداء الوظيفي</h3><p style="font-size:12px;color:#64748b;line-height:1.8">تُبنى أهداف الموظف الإداري بصورة مستقلة، وتُجمع الشواهد من تقارير الأداء المعتمدة المرتبطة بكل هدف.</p><div class="ssa-grid">'+goalHtml+'</div></section>'+
    '<section class="ssa-sheet"><h3 class="ssa-title">الجدارات الوظيفية</h3><div>'+compHtml+'</div></section>'+
    '<section class="ssa-sheet"><h3 class="ssa-title">الاعتماد</h3><div class="ssa-approval"><div><small>مدير/ة المدرسة</small><strong>'+esc(a.name)+'</strong></div><div><small>التوقيع الرقمي</small>'+(a.sig?'<img src="'+esc(a.sig)+'" alt="توقيع المدير">':'<strong>غير مضاف في النموذج الموحد</strong>')+'</div><div><small>الختم الرسمي</small>'+(a.stamp?'<img src="'+esc(a.stamp)+'" alt="ختم المدرسة">':'<strong>غير مضاف في النموذج الموحد</strong>')+'</div></div></section>';
    document.getElementById('ss-admin-performance-content').innerHTML=html;
  }
  function createCard(){if(document.querySelector('[data-ss-admin-performance-card]'))return;var host=document.querySelector('#welcome-dashboard .grid,#dashboard .grid,.dashboard-grid,.cards-grid,main .grid');if(!host)return;var c=document.createElement('div');c.setAttribute('data-ss-admin-performance-card','1');c.className='ss-performance-card';c.onclick=window.openAdministrativePerformanceFile;c.innerHTML='<div class="ss-performance-badge">📘</div><div><h3>ملف الأداء الوظيفي</h3><p>أهداف وجدارات الموظف الإداري والتقارير المعتمدة.</p></div><div class="ss-performance-open">فتح</div>';host.appendChild(c);}
  window.openAdministrativePerformanceFile=function(){installStyle();createModal();render();document.getElementById(MODAL_ID).style.display='block';};
  function boot(){installStyle();createModal();createCard();}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
