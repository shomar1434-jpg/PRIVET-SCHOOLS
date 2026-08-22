(function(){
  'use strict';
  if(window.__SSP_BASE_SETTINGS_SOURCE__) return;
  window.__SSP_BASE_SETTINGS_SOURCE__=true;

  const STAGES=['رياض أطفال','ابتدائية','متوسطة','ثانوية'];
  function hijriYear(){
    try{
      const parts=new Intl.DateTimeFormat('en-US-u-ca-islamic-umalqura',{year:'numeric'}).formatToParts(new Date());
      const y=parseInt((parts.find(p=>p.type==='year')||{}).value,10);
      if(y>=1400&&y<=1600) return y;
    }catch(e){}
    return 1448;
  }
  const START_YEAR=Math.max(1448,hijriYear());
  const YEARS=Array.from({length:Math.max(1,1547-START_YEAR+1)},(_,i)=>START_YEAR+i);

  function parse(v){try{return JSON.parse(v||'null')}catch(e){return null}}
  function schoolId(){
    const q=new URLSearchParams(location.search||'');
    const u=parse(localStorage.getItem('currentSchoolUser'))||parse(localStorage.getItem('currentUser'))||{};
    const s=parse(localStorage.getItem('smartSchool.currentSchool'))||{};
    return String(q.get('school_id')||q.get('schoolId')||localStorage.getItem('active_school_id')||localStorage.getItem('current_school_id')||localStorage.getItem('school_id')||u.schoolId||u.school_id||s.schoolId||s.id||'').trim();
  }
  function scopedKey(){const id=schoolId();return id?'school_base_settings:'+id:'school_base_settings';}
  function read(){
    const scoped=parse(localStorage.getItem(scopedKey()))||{};
    return {
      school:String(scoped.school||localStorage.getItem('setting_school')||'').trim(),
      manager:String(scoped.manager||localStorage.getItem('def_m')||localStorage.getItem('persist_name_p')||'').trim(),
      owner:String(scoped.owner||localStorage.getItem('setting_owner')||'').trim(),
      userName:String(scoped.userName||localStorage.getItem('persist_name_m')||'').trim(),
      education:String(scoped.education||scoped.region||localStorage.getItem('setting_region')||'').trim(),
      year:String(scoped.year||localStorage.getItem('setting_academic_year')||START_YEAR).replace(/\s*هـ?\s*$/,'').trim(),
      signature:scoped.signature||localStorage.getItem('setting_sig')||'',
      managerSignature:scoped.managerSignature||localStorage.getItem('setting_sig')||'',
      ownerSignature:scoped.ownerSignature||localStorage.getItem('setting_owner_sig')||'',
      userSignature:scoped.userSignature||localStorage.getItem('persist_sig_data')||'',
      stamp:scoped.stamp||localStorage.getItem('setting_stamp')||'',
      schoolLogo:scoped.schoolLogo||localStorage.getItem('setting_school_logo')||'',
      ministryLogo:scoped.ministryLogo||localStorage.getItem('setting_ministry_logo')||'',
      phone:String(scoped.phone||scoped.schoolPhone||localStorage.getItem('setting_school_phone')||'').trim(),
      email:String(scoped.email||scoped.schoolEmail||localStorage.getItem('setting_school_email')||'').trim(),
      address:String(scoped.address||scoped.schoolAddress||localStorage.getItem('setting_school_address')||'').trim(),
      contactFooter:String(scoped.contactFooter||localStorage.getItem('setting_contact_footer')||'').trim(),
      orientation:String(scoped.orientation||scoped.defaultOrientation||localStorage.getItem('setting_default_orientation')||'auto').trim()
    };
  }
  function write(data){
    const cur=read(); const d=Object.assign({},cur,data||{});
    localStorage.setItem(scopedKey(),JSON.stringify(d));
    if(d.school!=null)localStorage.setItem('setting_school',d.school||'');
    if(d.manager!=null)localStorage.setItem('def_m',d.manager||'');
    if(d.education!=null)localStorage.setItem('setting_region',d.education||'');
    if(d.year!=null)localStorage.setItem('setting_academic_year',String(d.year||''));
    if(d.signature)localStorage.setItem('setting_sig',d.signature);
    if(d.stamp)localStorage.setItem('setting_stamp',d.stamp);
    if(d.owner!=null)localStorage.setItem('setting_owner',d.owner||'');
    if(d.phone!=null)localStorage.setItem('setting_school_phone',d.phone||'');
    if(d.email!=null)localStorage.setItem('setting_school_email',d.email||'');
    if(d.address!=null)localStorage.setItem('setting_school_address',d.address||'');
    if(d.contactFooter!=null)localStorage.setItem('setting_contact_footer',d.contactFooter||'');
    if(d.orientation!=null)localStorage.setItem('setting_default_orientation',d.orientation||'auto');
    window.dispatchEvent(new CustomEvent('schoolBaseSettingsUpdated',{detail:d}));
    return d;
  }
  window.SchoolBaseSettings={read,write,years:YEARS.slice(),stages:STAGES.slice(),currentAcademicYear:START_YEAR};

  function textAround(el){
    let t='';
    if(el.id){const lab=document.querySelector('label[for="'+CSS.escape(el.id)+'"]');if(lab)t+=' '+lab.textContent;}
    const p=el.closest('.fg,.field,.form-group,.form-field,.grid>div,td,th,section,div');
    if(p){const lab=p.querySelector(':scope > label, :scope > .label, label');if(lab)t+=' '+lab.textContent;}
    t+=' '+(el.getAttribute('aria-label')||'')+' '+(el.getAttribute('placeholder')||'')+' '+(el.name||'')+' '+(el.id||'');
    return t.replace(/\s+/g,' ').trim();
  }
  function isStage(el){const t=textAround(el);if(/مرحلة\s*(التنفيذ|الخطة|المهمة|المشروع|العمل)/i.test(t))return false;return /المرحلة\s*(الدراسية|التعليمية)|مرحلة\s*التعليم|school.?stage|education.?stage/i.test(t) || /^المرحلة$/i.test(t);}
  function isAcademicYear(el){const t=textAround(el);return /العام\s*الدراسي|السنة\s*الدراسية|academic.?year|school.?year/i.test(t);}
  function isJobTitle(el){const t=textAround(el);return /المسمى\s*الوظيفي|job.?title|position.?title/i.test(t);}
  function copyAttrs(a,b){for(const x of Array.from(a.attributes)){if(['type','value'].includes(x.name))continue;try{b.setAttribute(x.name,x.value)}catch(e){}}}
  function yearText(y){return String(y)+'هـ';}

  function configureStage(el){
    if(el.dataset.sspStageReady)return; el.dataset.sspStageReady='1';
    if(el.tagName==='SELECT'){
      const old=el.value;
      el.innerHTML='<option value="">-- اختر المرحلة --</option>'+STAGES.map(x=>'<option value="'+x+'">'+x+'</option>').join('');
      const map={'ابتدائي':'ابتدائية','متوسط':'متوسطة','ثانوي':'ثانوية','روضة':'رياض أطفال','رياض الاطفال':'رياض أطفال'};
      el.value=STAGES.includes(old)?old:(map[old]||'');
    }else if(el.tagName==='INPUT' && !['hidden','file','checkbox','radio'].includes((el.type||'').toLowerCase())){
      const s=document.createElement('select');copyAttrs(el,s);s.dataset.sspStageReady='1';
      s.innerHTML='<option value="">-- اختر المرحلة --</option>'+STAGES.map(x=>'<option value="'+x+'">'+x+'</option>').join('');
      const old=el.value;const map={'ابتدائي':'ابتدائية','متوسط':'متوسطة','ثانوي':'ثانوية'};s.value=STAGES.includes(old)?old:(map[old]||'');
      el.replaceWith(s);
    }
  }
  function configureYear(el){
    if(el.dataset.sspYearReady)return; el.dataset.sspYearReady='1';
    const settings=read();
    const options='<option value="">-- اختر العام الدراسي --</option>'+YEARS.map(y=>'<option value="'+y+'">'+yearText(y)+'</option>').join('');
    if(el.tagName==='SELECT'){
      const old=String(el.value||'').replace(/\D/g,'');el.innerHTML=options;el.value=YEARS.includes(+old)?old:(YEARS.includes(+settings.year)?String(settings.year):String(START_YEAR));
    }else if(el.tagName==='INPUT' && !['hidden','file','checkbox','radio'].includes((el.type||'').toLowerCase())){
      const s=document.createElement('select');copyAttrs(el,s);s.dataset.sspYearReady='1';s.innerHTML=options;
      const old=String(el.value||'').replace(/\D/g,'');s.value=YEARS.includes(+old)?old:(YEARS.includes(+settings.year)?String(settings.year):String(START_YEAR));
      el.replaceWith(s);
    }
  }
  function configureJobTitle(sel){
    if(sel.tagName!=='SELECT'||sel.dataset.sspJobReady)return;sel.dataset.sspJobReady='1';
    if(!Array.from(sel.options).some(o=>/مسمى\s*آخر/.test(o.textContent))){const o=new Option('مسمى آخر','__ssp_other__');sel.add(o);}
    const wrap=sel.parentElement||sel;
    const inp=document.createElement('input');inp.type='text';inp.placeholder='اكتب المسمى الوظيفي';inp.className=sel.className||'';inp.style.display='none';inp.style.marginTop='8px';inp.dataset.sspOtherJob='1';
    sel.insertAdjacentElement('afterend',inp);
    function toggle(){inp.style.display=sel.value==='__ssp_other__'?'block':'none';if(sel.value==='__ssp_other__')setTimeout(()=>inp.focus(),0)}
    sel.addEventListener('change',toggle);
    inp.addEventListener('change',function(){const v=inp.value.trim();if(!v)return;let o=Array.from(sel.options).find(x=>x.dataset&&x.dataset.sspCustom==='1'&&x.value===v);if(!o){o=new Option(v,v);o.dataset.sspCustom='1';sel.add(o,sel.options.length-1);}sel.value=v;inp.style.display='none';sel.dispatchEvent(new Event('change',{bubbles:true}));});
    toggle();
  }

  function semanticKind(el){
    const t=textAround(el);
    if(/اسم\s*المدرسة|school.?name/i.test(t))return 'school';
    if(/اسم\s*المالك|مالك\/?ة?\s*المدرسة|school.?owner|owner.?name/i.test(t))return 'owner';
    if(/مدير\/?ة?\s*المدرسة|اسم\s*المدير|مدير\s*المدرسة|المدير\s*\/\s*المقي|المدير\s*المعتمد|principal|manager.?name/i.test(t))return 'manager';
    if(/معد\s*التقرير|مُعد\s*التقرير|اسم\s*(الوكيل|المعلم|الموجه|الموظف|رائد|الرائدة|المعلمة)|رائد\/?ة?\s*النشاط|معلمة\s*رياض\s*الأطفال|الموظف\/?ة?\s*الإداري|report.?author|prepared.?by|user.?name/i.test(t))return 'userName';
    if(/الإدارة\s*التعليمية|إدارة\s*التعليم|المنطقة\s*التعليمية|education.?office|education.?department|region/i.test(t))return 'education';
    if(/هاتف\s*المدرسة|رقم\s*(هاتف|تواصل)\s*المدرسة|school.?phone|phone.?school/i.test(t))return 'phone';
    if(/البريد\s*الإلكتروني\s*للمدرسة|بريد\s*المدرسة|school.?email/i.test(t))return 'email';
    if(/عنوان\s*المدرسة|school.?address/i.test(t))return 'address';
    if(/تذييل\s*بيانات\s*التواصل|contact.?footer/i.test(t))return 'contactFooter';
    if(/العام\s*الدراسي|academic.?year|school.?year/i.test(t))return 'year';
    return '';
  }
  const OFFICIAL_LOCKED=new Set(['school','manager','owner','education','phone','email','address','contactFooter']);
  const LEGACY_KIND_BY_ID={
    field_school:'school',setting_school:'school',school_name:'school',schoolName:'school',schoolDisplayName:'school',printSchool:'school',
    name_p:'manager',def_p:'manager',persist_name_p:'manager',footerManagerName:'manager',principalName:'manager',managerName:'manager',managerDisplayName:'manager',cfgPrincipalName:'manager',printPrincipalName:'manager',
    ownerName:'owner',ownerDisplayName:'owner',schoolOwnerName:'owner',
    field_region:'education',setting_region:'education',educationDepartment:'education',education_department:'education',
    schoolPhone:'phone',school_phone:'phone',schoolEmail:'email',school_email:'email',schoolAddress:'address',school_address:'address',contactFooter:'contactFooter'
  };
  function explicitKind(el){return LEGACY_KIND_BY_ID[el.id]||LEGACY_KIND_BY_ID[el.name]||''}
  function kindOf(el){return explicitKind(el)||semanticKind(el)}
  function markCentral(el,k,v){
    if(!OFFICIAL_LOCKED.has(k)||!v)return;
    el.dataset.sspCentralOfficial='1';el.dataset.sspOfficialKind=k;el.setAttribute('aria-readonly','true');
    el.title='مرتبط بالنموذج الموحد للمدرسة';
    if(el.matches('input,textarea'))el.readOnly=true;
    el.style.backgroundColor=el.style.backgroundColor||'#f8fafc';
    el.style.cursor='default';
    if(!el.dataset.sspLockBound){
      el.dataset.sspLockBound='1';
      const restore=()=>{const st=read(),key=el.dataset.sspOfficialKind,val=st[key];if(val!=null&&String(val)!==''){if(el.tagName==='SELECT'){if(!Array.from(el.options).some(o=>String(o.value)===String(val)))el.add(new Option(val,val));el.value=val}else if('value' in el)el.value=val;}};
      el.addEventListener('input',restore,true);el.addEventListener('change',restore,true);
    }
  }
  function fillBase(el){
    if(!/^(INPUT|SELECT|TEXTAREA)$/.test(el.tagName)||el.type==='file')return;
    const k=kindOf(el);if(!k)return;const st=read();let v=st[k];if(!v)return;
    if(k==='year')v=String(v).replace(/\D/g,'');
    if(el.tagName==='SELECT'&&!Array.from(el.options).some(o=>String(o.value)===String(v))){el.add(new Option(k==='year'?yearText(v):v,v));}
    if(OFFICIAL_LOCKED.has(k)||!el.value||el.dataset.sspBaseAutofill==='1'){el.value=v;el.dataset.sspBaseAutofill='1';}
    markCentral(el,k,v);
  }
  function textSemanticKind(el){
    const id=(el.id||''); if(LEGACY_KIND_BY_ID[id])return LEGACY_KIND_BY_ID[id];
    const a=((el.getAttribute&&((el.getAttribute('data-field')||'')+' '+(el.getAttribute('data-key')||'')+' '+(el.getAttribute('aria-label')||'')))||'');
    const own=((el.className&&String(el.className))||'')+' '+id+' '+a;
    if(/manager|principal|name[_-]?p|footerManager|مدير|مديرة/i.test(own))return 'manager';
    if(/owner|مالك/i.test(own))return 'owner';
    if(/school.?name|field[_-]?school|اسم.?المدرسة/i.test(own))return 'school';
    if(/education|region|إدارة.?التعليم/i.test(own))return 'education';
    return '';
  }
  function fillTextNodes(root){
    const st=read();
    root.querySelectorAll('[contenteditable],span[id],p[id],div[data-field],span[data-field],[data-official-field]').forEach(el=>{
      const k=(el.getAttribute('data-official-field')||textSemanticKind(el)||''); if(!k||!st[k])return;
      const v=String(st[k]);
      const cur=(el.textContent||'').trim();
      const placeholder=/^(اسم\s*المدرسة|مدير\/?ة?\s*المدرسة|اسم\s*المدير|اسم\s*المالك|[-–—.،\s]+)$/i.test(cur);
      if(OFFICIAL_LOCKED.has(k)||!cur||placeholder||el.dataset.sspBaseAutofill==='1'){
        if(cur!==v)el.textContent=v;
        el.dataset.sspBaseAutofill='1';
      }
      if(OFFICIAL_LOCKED.has(k)){
        el.dataset.sspCentralOfficial='1';el.title='مرتبط بالنموذج الموحد للمدرسة';
        if(el.hasAttribute('contenteditable'))el.setAttribute('contenteditable','false');
      }
    });
  }
  function imageSemantic(el){
    const own=((el.id||'')+' '+(el.className||'')+' '+(el.alt||'')+' '+(el.getAttribute?.('data-official-field')||'')).toLowerCase();
    const parent=(el.closest?.('td,.field,.fg,.form-group,.card,section,footer,div')?.textContent||'').replace(/\s+/g,' ').slice(0,240);
    const t=own+' '+parent;
    if(/ختم|stamp|seal/.test(t))return 'stamp';
    if(/توقيع.*مالك|مالك.*توقيع|owner.*sig|sig.*owner/.test(t))return 'ownerSignature';
    if(/توقيع.*(مدير|مديرة)|(?:مدير|مديرة).*توقيع|manager.*sig|principal.*sig|sig.*manager|sig.*principal/.test(t))return 'managerSignature';
    if(/توقيع.*(معد|مُعد|معلم|وكيل|موجه|موظف|رائد)|user.*sig|author.*sig|creator.*sig/.test(t))return 'userSignature';
    if(/شعار.*المدرسة|school.*logo/.test(t))return 'schoolLogo';
    if(/شعار.*الوزارة|ministry.*logo/.test(t))return 'ministryLogo';
    return '';
  }
  function setImage(el,src,alt){
    if(!src||!el||['INPUT','BUTTON'].includes(el.tagName))return;
    if(el.tagName==='IMG'){if(el.src!==src)el.src=src;el.style.display='';el.classList.remove('hidden');return;}
    let img=el.querySelector(':scope > img[data-ssp-official-image]');
    if(!img){
      const existing=el.querySelector(':scope > img');
      if(existing){img=existing}else if((el.textContent||'').trim()===''||/لم يتم|لا يوجد|مكان|الختم|التوقيع/.test((el.textContent||'').trim())){img=document.createElement('img');img.dataset.sspOfficialImage='1';el.replaceChildren(img)}else return;
    }
    img.src=src;img.alt=alt;img.style.cssText=(img.style.cssText||'')+';max-width:100%;max-height:100%;object-fit:contain;';
  }
  function fillImages(root){const st=read();
    root.querySelectorAll('img,[data-manager-signature],[data-owner-signature],[data-user-signature],[data-stamp-source],.manager-signature,.owner-signature,.user-signature,.school-stamp,.stamp-display,#stamp-display,#sig-display,.signature-display').forEach(el=>{
      let k=imageSemantic(el);
      if(el.matches('#stamp-display,[data-stamp-source],.school-stamp,.stamp-display'))k='stamp';
      if(el.matches('[data-manager-signature],.manager-signature'))k='managerSignature';
      if(el.matches('[data-owner-signature],.owner-signature'))k='ownerSignature';
      if(el.matches('[data-user-signature],.user-signature'))k='userSignature';
      if(el.id==='sig-display'&&!k)k=st.userSignature?'userSignature':'managerSignature';
      const alt={stamp:'ختم المدرسة',managerSignature:'توقيع مدير/مديرة المدرسة',ownerSignature:'توقيع مالك المدرسة',userSignature:'توقيع المستخدم',schoolLogo:'شعار المدرسة',ministryLogo:'شعار وزارة التعليم'}[k]||'اعتماد رسمي';
      if(k&&st[k])setImage(el,st[k],alt);
    });
  }
  function scan(root){root=root&&root.querySelectorAll?root:document;
    root.querySelectorAll('input,select,textarea').forEach(el=>{if(isStage(el))configureStage(el);if(isAcademicYear(el))configureYear(el);if(isJobTitle(el))configureJobTitle(el);fillBase(el)});
    fillTextNodes(root);fillImages(root);
  }
  function officialSnapshot(){const st=read();return Object.freeze({school:st.school,manager:st.manager,owner:st.owner,education:st.education,phone:st.phone,email:st.email,address:st.address,contactFooter:st.contactFooter,managerSignature:st.managerSignature,ownerSignature:st.ownerSignature,stamp:st.stamp,schoolLogo:st.schoolLogo,ministryLogo:st.ministryLogo,capturedAt:new Date().toISOString(),schoolId:schoolId()})}
  window.UnifiedSchoolOfficialProfile={read,write,snapshot:officialSnapshot,apply:(root=document)=>{scan(root);return officialSnapshot()},version:'3.0.0'};
  function init(){scan(document);let queued=false;new MutationObserver(ms=>{if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;ms.forEach(m=>m.addedNodes.forEach(n=>{if(n.nodeType===1)scan(n)}))})}).observe(document.documentElement,{childList:true,subtree:true});}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>{init();setTimeout(()=>scan(document),250);setTimeout(()=>scan(document),1000)});else{init();setTimeout(()=>scan(document),250);setTimeout(()=>scan(document),1000);}
  window.addEventListener('platformSettingsUpdated',()=>scan(document));
  window.addEventListener('schoolBaseSettingsUpdated',()=>scan(document));
})();


/* PRIVATE_REPORT_IDENTITY_BOOTSTRAP */
(function(){
  'use strict';
  if(window.__PRIVATE_REPORT_IDENTITY_BOOTSTRAP__)return;
  window.__PRIVATE_REPORT_IDENTITY_BOOTSTRAP__=true;
  function hasSrc(name){return Array.from(document.scripts||[]).some(s=>(s.getAttribute('src')||'').split('?')[0].endsWith(name))}
  function load(src){return new Promise((resolve,reject)=>{if(hasSrc(src)){resolve();return}const s=document.createElement('script');s.src=src;s.onload=resolve;s.onerror=reject;document.head.appendChild(s)})}
  async function boot(){
    try{
      if(!window.supabase)await load('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.111.0');
      if(!window.StandalonePrivateConfig)await load('standalone-private-config.js');
      if(!window.PrivateSchoolConfig)await load('private-school-config.js');
      if(!window.PrivateSchoolBridge)await load('private-school-bridge.js');
      if(!window.PrivateReportIdentity)await load('private-report-identity-source.js');
    }catch(e){console.warn('Report identity bootstrap:',e?.message||e)}
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
