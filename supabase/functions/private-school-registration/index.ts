import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
const cors={'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'authorization, x-client-info, apikey, content-type'};
const json=(b:any,s=200)=>new Response(JSON.stringify(b),{status:s,headers:{...cors,'content-type':'application/json; charset=utf-8'}});const clean=(v:any)=>String(v??'').trim();
async function hash(v:string){const d=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(v));return [...new Uint8Array(d)].map(x=>x.toString(16).padStart(2,'0')).join('')}
async function findUserByEmail(db:any,email:string){for(let page=1;page<=20;page++){const r=await db.auth.admin.listUsers({page,perPage:100});if(r.error)throw r.error;const f=(r.data?.users||[]).find((x:any)=>String(x.email||'').toLowerCase()===email.toLowerCase());if(f)return f;if((r.data?.users||[]).length<100)break}return null}
Deno.serve(async(req)=>{if(req.method==='OPTIONS')return new Response('ok',{headers:cors});try{
 const url=Deno.env.get('SUPABASE_URL')!,service=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,db=createClient(url,service,{auth:{persistSession:false}});const b=await req.json().catch(()=>({})),action=clean(b.action),token=clean(b.token);if(!token)return json({error:'token_required'},400);
 const q=await db.from('school_invites').select('*,schools(id,school_name,school_code,status)').eq('token_hash',await hash(token)).eq('role','registration_portal').maybeSingle();if(q.error)throw q.error;const portal:any=q.data;if(!portal)return json({error:'registration_link_not_found'},404);if(portal.status!=='pending')return json({error:'registration_link_disabled'},410);if(new Date(portal.expires_at).getTime()<Date.now())return json({error:'registration_link_expired'},410);if(portal.schools?.status!=='active')return json({error:'school_not_active'},403);
 if(action==='inspect')return json({ok:true,school:portal.schools,expiresAt:portal.expires_at});if(action!=='register')return json({error:'unsupported_action'},400);
 const email=clean(b.email).toLowerCase(),fullName=clean(b.fullName),password=String(b.password||''),role=clean(b.role);const allowed=['agent','teacher','student_advisor','health_advisor','activity_leader','kindergarten_teacher','administrative_employee'];
 if(!email.includes('@')||!fullName||password.length<8||!allowed.includes(role))return json({error:'invalid_registration_input'},400);
 let uid='',created=false;const existing=await findUserByEmail(db,email);
 if(existing){
   const [ms,os,sa]=await Promise.all([db.from('school_members').select('id,school_id,role,status').eq('user_id',existing.id),db.from('school_owners').select('school_id').eq('user_id',existing.id),db.from('system_admins').select('user_id').eq('user_id',existing.id).limit(1)]);if(ms.error||os.error||sa.error)throw ms.error||os.error||sa.error;
   if((sa.data||[]).length)return json({error:'email_reserved'},409);
   if((ms.data||[]).some((x:any)=>x.school_id!==portal.school_id)||(os.data||[]).some((x:any)=>x.school_id!==portal.school_id))return json({error:'email_belongs_to_another_school'},409);
   const same=(ms.data||[]).filter((x:any)=>x.school_id===portal.school_id);
   if(same.some((x:any)=>x.status==='active'))return json({error:'already_registered_in_school'},409);
   if(same.some((x:any)=>x.status==='disabled'))return json({error:'account_disabled_in_school'},409);
   if(same.some((x:any)=>x.status==='deleted'))return json({error:'account_removed_from_school'},409);
   const up=await db.auth.admin.updateUserById(existing.id,{password,email_confirm:true,user_metadata:{...(existing.user_metadata||{}),full_name:fullName,role}});if(up.error)throw up.error;uid=existing.id;
   const pending=same.find((x:any)=>x.status==='pending');
   if(pending){
     const m=await db.from('school_members').update({role,display_name:fullName,role_variant:null,invited_by:portal.invited_by,supervisor_user_id:portal.invited_by,supervisor_role:'manager',updated_at:new Date().toISOString()}).eq('id',pending.id).select('*').single();if(m.error)throw m.error;
     return json({ok:true,schoolId:portal.school_id,schoolName:portal.schools?.school_name||'',membershipId:m.data.id,status:'pending',pendingActivation:true,reusedPending:true});
   }
 }else{const cr=await db.auth.admin.createUser({email,password,email_confirm:true,user_metadata:{full_name:fullName,role}});if(cr.error)throw cr.error;uid=cr.data.user.id;created=true}
 try{const row:any={school_id:portal.school_id,user_id:uid,role,status:'pending',display_name:fullName,invited_by:portal.invited_by,supervisor_user_id:portal.invited_by,supervisor_role:'manager',role_variant:null};const m=await db.from('school_members').insert(row).select('*').single();if(m.error)throw m.error;return json({ok:true,schoolId:portal.school_id,schoolName:portal.schools?.school_name||'',membershipId:m.data.id,status:'pending',pendingActivation:true})}catch(e){if(created){try{await db.auth.admin.deleteUser(uid)}catch(_){}}throw e}
}catch(e){return json({error:e instanceof Error?e.message:String(e)},500)}});
