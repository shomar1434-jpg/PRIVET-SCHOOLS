import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
const cors={'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'authorization, x-client-info, apikey, content-type'};
const json=(b:any,s=200)=>new Response(JSON.stringify(b),{status:s,headers:{...cors,'content-type':'application/json; charset=utf-8'}});
const clean=(v:any)=>String(v??'').trim();
async function userMeta(db:any,id:string){if(!id)return {name:'',email:''};try{const r=await db.auth.admin.getUserById(id);const u=r.data?.user;return {name:clean(u?.user_metadata?.full_name||u?.user_metadata?.name||''),email:clean(u?.email)}}catch(_){return {name:'',email:''}}}
async function signedAsset(db:any,sid:string,fileId:any){const id=clean(fileId);if(!id)return '';const f=await db.from('platform_files').select('bucket,object_path').eq('id',id).eq('school_id',sid).maybeSingle();if(!f.data)return '';const s=await db.storage.from(f.data.bucket).createSignedUrl(f.data.object_path,3600);return s.data?.signedUrl||''}
Deno.serve(async(req)=>{if(req.method==='OPTIONS')return new Response('ok',{headers:cors});try{
 const url=Deno.env.get('SUPABASE_URL')!,anon=Deno.env.get('SUPABASE_ANON_KEY')!,service=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
 const uc=createClient(url,anon,{global:{headers:{Authorization:req.headers.get('authorization')||''}}});const {data:{user}}=await uc.auth.getUser();if(!user)return json({error:'unauthorized'},401);
 const db=createClient(url,service,{auth:{persistSession:false}}),b=await req.json().catch(()=>({})),sid=clean(b.schoolId),action=clean(b.action);if(!sid)return json({error:'school_required'},400);
 const m=await db.from('school_members').select('role').eq('school_id',sid).eq('user_id',user.id).eq('status','active');if(m.error)throw m.error;const roles=(m.data||[]).map((x:any)=>String(x.role));if(!roles.length)return json({error:'forbidden'},403);
 if(action==='save_profile'){
   if(!roles.some((r:string)=>['owner','manager'].includes(r)))return json({error:'forbidden'},403);
   const old=await db.from('school_template_profiles').select('profile').eq('school_id',sid).maybeSingle();if(old.error)throw old.error;
   const profile={...(old.data?.profile||{}),...(b.profile||{})};
   const up=await db.from('school_template_profiles').upsert({school_id:sid,profile,updated_by:user.id,updated_at:new Date().toISOString()},{onConflict:'school_id'}).select('*').single();if(up.error)throw up.error;return json({ok:true,profile:up.data.profile,output:up.data.profile})
 }
 const [q,school,primaryOwner,manager]=await Promise.all([
   db.from('school_template_profiles').select('*').eq('school_id',sid).maybeSingle(),
   db.from('schools').select('school_name,school_code').eq('id',sid).maybeSingle(),
   db.from('school_owners').select('user_id').eq('school_id',sid).eq('is_primary',true).maybeSingle(),
   db.from('school_members').select('user_id,display_name').eq('school_id',sid).eq('role','manager').eq('status','active').maybeSingle()
 ]);
 if(q.error||school.error||primaryOwner.error||manager.error)throw q.error||school.error||primaryOwner.error||manager.error;
 const [ownerMeta,managerMeta]=await Promise.all([userMeta(db,primaryOwner.data?.user_id||''),userMeta(db,manager.data?.user_id||'')]);
 const profile=q.data?.profile||{};
 const output={
   ...profile,
   schoolDisplayName:clean(profile.schoolDisplayName||profile.school_display_name||school.data?.school_name),
   ownerDisplayName:clean(profile.ownerDisplayName||profile.owner_display_name||ownerMeta.name),
   managerDisplayName:clean(profile.managerDisplayName||profile.manager_display_name||manager.data?.display_name||managerMeta.name),
   schoolEmail:clean(profile.schoolEmail||profile.school_email||''),
   schoolPhone:clean(profile.schoolPhone||profile.school_phone||''),
   schoolAddress:clean(profile.schoolAddress||profile.school_address||''),
   contactFooter:clean(profile.contactFooter||profile.contact_footer||'')
 } as any;
 const map:any={ministryLogoFileId:'ministry_logoUrl',schoolLogoFileId:'school_logoUrl',ownerSignatureFileId:'owner_signatureUrl',managerSignatureFileId:'manager_signatureUrl',digitalStampFileId:'digital_stampUrl'};
 for(const [camel,urlKeyRaw] of Object.entries(map)){const urlKey=String(urlKeyRaw),snake=camel.replace(/[A-Z]/g,(m:string)=>'_'+m.toLowerCase());output[urlKey]=await signedAsset(db,sid,profile[camel]||profile[snake])}
 return json({ok:true,profile,output,suggested:{schoolName:school.data?.school_name||'',ownerName:ownerMeta.name,managerName:manager.data?.display_name||managerMeta.name,managerEmail:managerMeta.email}})
}catch(e){return json({error:e instanceof Error?e.message:String(e)},500)}});
