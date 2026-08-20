(function(){
  'use strict';
  if(window.__PRIVATE_STORAGE_NAMESPACE_V1__) return;
  window.__PRIVATE_STORAGE_NAMESPACE_V1__=true;
  const PREFIX='PRIVATE_STANDALONE::';
  const P=Storage.prototype;
  const raw={get:P.getItem,set:P.setItem,remove:P.removeItem,clear:P.clear,key:P.key};
  const k=(key)=>{ key=String(key??''); return key.startsWith(PREFIX)?key:PREFIX+key; };
  P.getItem=function(key){ return raw.get.call(this,k(key)); };
  P.setItem=function(key,val){ return raw.set.call(this,k(key),String(val)); };
  P.removeItem=function(key){ return raw.remove.call(this,k(key)); };
  P.clear=function(){
    const remove=[];
    for(let i=0;i<this.length;i++){ const key=raw.key.call(this,i); if(key&&key.startsWith(PREFIX)) remove.push(key); }
    remove.forEach(key=>raw.remove.call(this,key));
  };
  window.PrivateStorageNamespace=Object.freeze({prefix:PREFIX,rawGet:(storage,key)=>raw.get.call(storage,key)});
})();
