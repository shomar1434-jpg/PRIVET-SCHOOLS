import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
const cors={'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'authorization, x-client-info, apikey, content-type'};
const json=(body:any,status=200)=>new Response(JSON.stringify(body),{status,headers:{...cors,'content-type':'application/json; charset=utf-8'}});
const code=()=>`PRV-${crypto.randomUUID().slice(0,8).toUpperCase()}`;
Deno.serve(async(req)=>{
 if(req.method==='OPTIONS')return new Response('ok',{headers:cors});
 const url=Deno.env.get('SUPABASE_URL')!,anon=Deno.env.get('SUPABASE_ANON_KEY')!,service=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
 const auth=req.headers.get('authorization')||''; const uc=createClient(url,anon,{global:{headers:{Authorization:auth}}});
 const {data:{user}}=await uc.auth.getUser(); if(!user)return json({error:'unauthorized'},401);
 const db=createClient(url,service,{auth:{persistSession:false}});
 const sa=await db.from('system_admins').select('user_id').eq('user_id',user.id).eq('is_active',true).maybeSingle(); if(!sa.data)return json({error:'forbidden'},403);
 const b=await req.json().catch(()=>({})); const schoolName=String(b.schoolName||'').trim(),ownerName=String(b.ownerName||'').trim(),ownerEmail=String(b.ownerEmail||'').trim().toLowerCase(),password=String(b.password||'');
 if(!schoolName||!ownerName||!ownerEmail.includes('@')||password.length<8)return json({error:'invalid_input'},400);
 let authUserId=''; let schoolId='';
 try{
   const created=await db.auth.admin.createUser({email:ownerEmail,password,email_confirm:true,user_metadata:{full_name:ownerName,role:'owner'}}); if(created.error)throw created.error; authUserId=created.data.user.id;
   const school=await db.from('schools').insert({school_code:code(),school_name:schoolName,school_type:'private',status:'active'}).select('*').single(); if(school.error)throw school.error; schoolId=school.data.id;
   const owner=await db.from('school_owners').insert({school_id:schoolId,user_id:authUserId,is_primary:true}); if(owner.error)throw owner.error;
   const member=await db.from('school_members').insert({school_id:schoolId,user_id:authUserId,role:'owner',status:'active',invited_by:user.id}); if(member.error)throw member.error;
   await db.from('school_template_profiles').insert({school_id:schoolId,profile:{},updated_by:authUserId});
   return json({ok:true,school:school.data,owner:{userId:authUserId,email:ownerEmail,name:ownerName}});
 }catch(e){
   if(schoolId)await db.from('schools').delete().eq('id',schoolId);
   if(authUserId)await db.auth.admin.deleteUser(authUserId).catch(()=>{});
   return json({error:e instanceof Error?e.message:String(e)},500);
 }
});
