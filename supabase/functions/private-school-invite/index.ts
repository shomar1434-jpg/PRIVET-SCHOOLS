import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
const cors={'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'authorization, x-client-info, apikey, content-type'};
const json=(b:any,s=200)=>new Response(JSON.stringify(b),{status:s,headers:{...cors,'content-type':'application/json; charset=utf-8'}});const clean=(v:any)=>String(v??'').trim();
async function h(v:string){const d=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(v));return [...new Uint8Array(d)].map(x=>x.toString(16).padStart(2,'0')).join('')}
Deno.serve(async(req)=>{if(req.method==='OPTIONS')return new Response('ok',{headers:cors});try{
 const url=Deno.env.get('SUPABASE_URL')!,service=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;const db=createClient(url,service,{auth:{persistSession:false}}),b=await req.json().catch(()=>({})),action=clean(b.action),token=clean(b.token);if(!token)return json({error:'token_required'},400);
 const q=await db.from('school_invites').select('*,schools(id,school_name,school_code,status)').eq('token_hash',await h(token)).maybeSingle();if(q.error)throw q.error;const inv:any=q.data;if(!inv)return json({error:'invite_not_found'},404);
 const mapped={...inv,invitee_email:inv.email,invite_role:inv.role,schoolName:inv.schools?.school_name||'',schoolCode:inv.schools?.school_code||''};
 if(action==='inspect')return json({ok:true,invitation:mapped,school:inv.schools});if(action!=='accept')return json({error:'unsupported_action'},400);
 if(inv.status!=='pending')return json({error:'invite_not_pending',status:inv.status},409);if(new Date(inv.expires_at).getTime()<Date.now())return json({error:'invite_expired'},410);if(inv.schools?.status!=='active')return json({error:'school_not_active'},403);
 const password=String(b.password||''),fullName=clean(b.fullName)||inv.invitee_name||inv.email;if(password.length<8)return json({error:'password_too_short'},400);
 let uid='';const cr=await db.auth.admin.createUser({email:inv.email,password,email_confirm:true,user_metadata:{full_name:fullName,role:inv.role}});
 if(cr.error){const ls=await db.auth.admin.listUsers({page:1,perPage:1000});const found=ls.data?.users?.find((x:any)=>String(x.email||'').toLowerCase()===String(inv.email).toLowerCase());if(!found)throw cr.error;uid=found.id;const upu=await db.auth.admin.updateUserById(uid,{password,user_metadata:{...(found.user_metadata||{}),full_name:fullName,role:inv.role}});if(upu.error)throw upu.error}else uid=cr.data.user.id;
 const status='pending';const m=await db.from('school_members').upsert({school_id:inv.school_id,user_id:uid,role:inv.role,status,invited_by:inv.invited_by},{onConflict:'school_id,user_id,role'});if(m.error)throw m.error;
 const up=await db.from('school_invites').update({status:'accepted',accepted_at:new Date().toISOString(),accepted_user_id:uid,updated_at:new Date().toISOString()}).eq('id',inv.id);if(up.error)throw up.error;
 return json({ok:true,schoolId:inv.school_id,role:inv.role,status:'pending',pendingActivation:true,supervisorRole:inv.metadata?.supervisorRole||'manager'});
}catch(e){return json({error:e instanceof Error?e.message:String(e)},500)}});