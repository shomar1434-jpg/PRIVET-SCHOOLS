(function(g){
  'use strict';
  const base=g.StandalonePrivateConfig||{};
  g.PrivateSchoolConfig=Object.freeze({
    supabaseUrl:base.supabaseUrl||'',
    publishableKey:base.publishableKey||'',
    edition:'private',
    standalone:true,
    sessionStorageKey:'PRIVATE_SCHOOLS_session_v1',
    schoolListStorageKey:'PRIVATE_SCHOOLS_schools_v1'
  });
})(window);
