import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
const cors={'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'authorization, x-client-info, apikey, content-type'};
const json=(b:any,s=200)=>new Response(JSON.stringify(b),{status:s,headers:{...cors,'content-type':'application/json; charset=utf-8'}});
Deno.serve(async(req)=>{if(req.method==='OPTIONS')return new Response('ok',{headers:cors});try{
 const url=Deno.env.get('SUPABASE_URL')!,anon=Deno.env.get('SUPABASE_ANON_KEY')!,service=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;const h=req.headers.get('authorization')||'';
 const uc=createClient(url,anon,{global:{headers:{Authorization:h}}});const {data:{user}}=await uc.auth.getUser();if(!user)return json({error:'unauthorized'},401);
 const db=createClient(url,service,{auth:{persistSession:false}});const b=await req.json().catch(()=>({}));
 const m=await db.from('school_members').select('id,school_id,role,status,schools(id,school_name,school_code,status)').eq('user_id',user.id).eq('status','active');if(m.error)throw m.error;
 const memberships=(m.data||[]).filter((x:any)=>x.schools?.status==='active');
 const requested=String(b.schoolId||'');let selected:any=requested?memberships.find((x:any)=>x.school_id===requested):memberships[0];
 if(!selected)return json({error:'no_active_membership',memberships:[]},403);
 const roles=memberships.filter((x:any)=>x.school_id===selected.school_id).map((x:any)=>x.role);const requestedRole=String(b.actorRole||b.role||'');const activeRole=requestedRole&&roles.includes(requestedRole)?requestedRole:roles[0];
 const grants=await db.from('task_access_grants').select('*').eq('school_id',selected.school_id).eq('user_id',user.id).eq('can_view',true);
 return json({ok:true,userId:user.id,email:user.email,schoolId:selected.school_id,school:selected.schools,role:activeRole,availableRoles:roles,memberships,grants:grants.data||[]});
}catch(e){return json({error:e instanceof Error?e.message:String(e)},500)}});
