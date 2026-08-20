(function(g){
  'use strict';
  const projectRef='okjwdzvnqsdetxdsvdgr';
  const supabaseUrl='https://okjwdzvnqsdetxdsvdgr.supabase.co';
  const publishableKey='sb_publishable_rpHL2MOBqlgOU9eNHPOWiw_RW_mhrMx';

  try{
    localStorage.setItem('privateStandaloneSupabaseUrl',supabaseUrl);
    localStorage.setItem('privateStandaloneSupabaseKey',publishableKey);
    localStorage.setItem('privateStandaloneProjectRef',projectRef);
  }catch(_){
    // يستمر التشغيل من القيم المضمنة حتى إن كان التخزين غير متاح.
  }

  g.StandalonePrivateConfig=Object.freeze({
    projectRef,
    supabaseUrl,
    publishableKey,
    isConfigured:true,
    projectKind:'private-schools-standalone',
    storageNamespace:'PRIVATE_SCHOOLS_V1'
  });
})(window);
