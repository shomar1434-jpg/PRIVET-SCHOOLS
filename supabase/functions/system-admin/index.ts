import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
const cors={'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'authorization, x-client-info, apikey, content-type'};
const json=(body:any,status=200)=>new Response(JSON.stringify(body),{status,headers:{...cors,'content-type':'application/json; charset=utf-8'}});
Deno.serve(async(req)=>{
  if(req.method==='OPTIONS') return new Response('ok',{headers:cors});
  try{
    const url=Deno.env.get('SUPABASE_URL')!, anon=Deno.env.get('SUPABASE_ANON_KEY')!, service=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const authHeader=req.headers.get('authorization')||'';
    const userClient=createClient(url,anon,{global:{headers:{Authorization:authHeader}}});
    const {data:{user}}=await userClient.auth.getUser();
    if(!user) return json({error:'unauthorized'},401);
    const admin=createClient(url,service,{auth:{persistSession:false}});
    const allowed=await admin.from('system_admins').select('user_id,is_active').eq('user_id',user.id).eq('is_active',true).maybeSingle();
    if(allowed.error||!allowed.data) return json({error:'forbidden'},403);
    const body=await req.json().catch(()=>({})); const action=String(body.action||'verify');
    if(action==='verify') return json({ok:true,user:{id:user.id,email:user.email}});
    if(action==='list_schools'){
      const r=await admin.from('schools').select('*').order('created_at',{ascending:false});
      if(r.error) throw r.error; return json({ok:true,schools:r.data||[]});
    }
    if(action==='set_school_status'){
      const id=String(body.schoolId||''),status=String(body.status||'');
      if(!id||!['active','disabled','archived'].includes(status)) return json({error:'invalid_input'},400);
      const r=await admin.from('schools').update({status}).eq('id',id).select('*').single(); if(r.error)throw r.error; return json({ok:true,school:r.data});
    }
    if(action==='delete_school'){
      if(String(body.confirmText||'')!=='DELETE') return json({error:'confirmation_required'},400);
      const id=String(body.schoolId||''); if(!id)return json({error:'school_required'},400);
      const owners=await admin.from('school_owners').select('user_id').eq('school_id',id);
      const del=await admin.from('schools').delete().eq('id',id); if(del.error)throw del.error;
      for(const o of owners.data||[]) await admin.auth.admin.deleteUser(o.user_id).catch(()=>{});
      return json({ok:true});
    }
    return json({error:'unsupported_action'},400);
  }catch(e){return json({error:e instanceof Error?e.message:String(e)},500)}
});
