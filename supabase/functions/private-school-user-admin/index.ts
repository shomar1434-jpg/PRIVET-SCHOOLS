import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
const cors={'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'authorization, x-client-info, apikey, content-type'};
const json=(b:any,s=200)=>new Response(JSON.stringify(b),{status:s,headers:{...cors,'content-type':'application/json; charset=utf-8'}});
const clean=(v:any)=>String(v??'').trim();
const allowed=['agent','teacher','student_advisor','health_advisor','activity_leader','kindergarten_teacher','administrative_employee'];
function agentVariants(v:any){const aliases:any={educational_affairs:'educational',educational:'educational',school_affairs:'school_affairs',student_affairs:'student_affairs'};let a=Array.isArray(v)?v:String(v??'').split(/[،,|]/);return [...new Set(a.map((x:any)=>aliases[clean(x)]||'').filter((x:string)=>['educational','school_affairs','student_affairs'].includes(x)))]}
Deno.serve(async(req)=>{if(req.method==='OPTIONS')return new Response('ok',{headers:cors});try{
 const url=Deno.env.get('SUPABASE_URL')!,anon=Deno.env.get('SUPABASE_ANON_KEY')!,service=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
 const uc=createClient(url,anon,{global:{headers:{Authorization:req.headers.get('authorization')||''}}});const {data:{user}}=await uc.auth.getUser();if(!user)return json({error:'unauthorized'},401);
 const db=createClient(url,service,{auth:{persistSession:false}}),b=await req.json().catch(()=>({})),sid=clean(b.schoolId),action=clean(b.action);if(!sid)return json({error:'school_required'},400);
 const mg=await db.from('school_members').select('id').eq('school_id',sid).eq('user_id',user.id).eq('role','manager').eq('status','active').maybeSingle();if(mg.error)throw mg.error;if(!mg.data)return json({error:'forbidden'},403);
 if(action!=='update_member')return json({error:'unsupported_action'},400);
 const id=clean(b.memberId||b.membershipId);if(!id)return json({error:'member_required'},400);
 const t=await db.from('school_members').select('*').eq('id',id).eq('school_id',sid).maybeSingle();if(t.error)throw t.error;const m:any=t.data;if(!m)return json({error:'member_not_found'},404);if(['owner','manager'].includes(m.role))return json({error:'protected_member'},403);
 const displayName=clean(b.displayName||b.fullName||m.display_name),newRole=clean(b.role||m.role),status=clean(b.status||m.status);const variants=newRole==='agent'?agentVariants(b.roleVariants??b.roleVariant??m.role_variant):[];
 if(!displayName||!allowed.includes(newRole))return json({error:'invalid_role'},400);if(!['pending','active','disabled'].includes(status))return json({error:'invalid_status'},400);if(newRole==='agent'&&!variants.length)return json({error:'agent_role_variant_required'},400);
 if(newRole!==m.role){const ex=await db.from('school_members').select('id').eq('school_id',sid).eq('user_id',m.user_id).eq('role',newRole).neq('id',id).neq('status','deleted').limit(1);if(ex.error)throw ex.error;if((ex.data||[]).length)return json({error:'member_role_already_exists'},409)}
 const patch:any={display_name:displayName,role:newRole,status,role_variant:newRole==='agent'?variants.join(','):null};
 if(status==='active'){patch.activated_at=new Date().toISOString();patch.activated_by=user.id;patch.disabled_at=null;patch.disabled_by=null}else if(status==='disabled'){patch.disabled_at=new Date().toISOString();patch.disabled_by=user.id}
 const up=await db.from('school_members').update(patch).eq('id',id).select('*').single();if(up.error)throw up.error;
 try{const au=await db.auth.admin.getUserById(m.user_id);if(!au.error&&au.data?.user){const md=au.data.user.user_metadata||{};await db.auth.admin.updateUserById(m.user_id,{user_metadata:{...md,full_name:displayName}})}}catch(_){ }
 return json({ok:true,member:{...up.data,role_variants:newRole==='agent'?variants:[]}});
}catch(e){const msg=e instanceof Error?e.message:(e&&typeof e==='object'&&'message' in e?String((e as any).message):JSON.stringify(e));return json({error:msg||'تعذر تنفيذ العملية'},500)}});
