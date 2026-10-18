(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.SCHImageSave=factory();})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 function supported(api,file){try{return !!file&&typeof api.share==='function'&&typeof api.canShare==='function'&&api.canShare({files:[file]});}catch{return false;}}
 function share(api,file){
  if(!supported(api,file))return Promise.resolve('unsupported');
  const failed=e=>e?.name==='AbortError'?'cancelled':'failed';
  try{return Promise.resolve(api.share({files:[file]})).then(()=>'shared',failed);}catch(e){return Promise.resolve(failed(e));}
 }
 return {supported,share};
});
