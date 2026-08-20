(function(g){
  'use strict';
  const projectRef='YOUR_PRIVATE_PROJECT_REF';
  const publishableKey='YOUR_PRIVATE_SUPABASE_PUBLISHABLE_KEY';
  const configured=projectRef!=='YOUR_PRIVATE_PROJECT_REF' && publishableKey!=='YOUR_PRIVATE_SUPABASE_PUBLISHABLE_KEY';
  g.StandalonePrivateConfig=Object.freeze({
    projectRef,
    supabaseUrl: configured ? `https://${projectRef}.supabase.co` : '',
    publishableKey: configured ? publishableKey : '',
    isConfigured: configured,
    projectKind:'private-schools-standalone',
    storageNamespace:'PRIVATE_SCHOOLS_V1'
  });
})(window);
