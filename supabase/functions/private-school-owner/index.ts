import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
const cors={'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'authorization, x-client-info, apikey, content-type'};
const json=(b:any,s=200)=>new Response(JSON.stringify(b),{status:s,headers:{...cors,'content-type':'application/json; charset=utf-8'}});
const clean=(v:any)=>String(v??'').trim();
async function hash(v:string){const d=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(v));return [...new Uint8Array(d)].map(x=>x.toString(16).padStart(2,'0')).join('')}
async function meta(db:any,id:string){try{const r=await db.auth.admin.getUserById(id);const u=r.data?.user;return {email:u?.email||'',name:u?.user_metadata?.full_name||u?.user_metadata?.name||u?.email||'',confirmedAt:u?.email_confirmed_at||null}}catch(_){return {email:'',name:'',confirmedAt:null}}}
async function findUserByEmail(db:any,email:string){for(let page=1;page<=20;page++){const r=await db.auth.admin.listUsers({page,perPage:100});if(r.error)throw r.error;const f=(r.data?.users||[]).find((x:any)=>String(x.email||'').toLowerCase()===email.toLowerCase());if(f)return f;if((r.data?.users||[]).length<100)break}return null}
async function ownerRows(db:any,sid:string){const [oq,mq]=await Promise.all([db.from('school_owners').select('*').eq('school_id',sid).order('is_primary',{ascending:false}),db.from('school_members').select('*').eq('school_id',sid).eq('role','owner').order('created_at',{ascending:true})]);if(oq.error||mq.error)throw oq.error||mq.error;const mm=new Map((mq.data||[]).map((m:any)=>[m.user_id,m]));const rows=[];for(const o of oq.data||[]){const m:any=mm.get(o.user_id)||{};const u=await meta(db,o.user_id);rows.push({...o,userId:o.user_id,membershipId:m.id||'',status:m.status||'active',email:u.email,fullName:u.name,name:u.name})}return rows}
async function ownerGuard(db:any,sid:string,uid:string){const [s,q]=await Promise.all([db.from('schools').select('status').eq('id',sid).maybeSingle(),db.from('school_members').select('id').eq('school_id',sid).eq('user_id',uid).eq('role','owner').eq('status','active').maybeSingle()]);return s.data?.status==='active'&&!!q.data}
async function managerRows(db:any,sid:string){const q=await db.from('school_members').select('*').eq('school_id',sid).eq('role','manager').order('created_at',{ascending:false});if(q.error)throw q.error;const rows=[];for(const m of q.data||[]){const u=await meta(db,m.user_id);rows.push({...m,membershipId:m.id,userId:m.user_id,email:u.email,fullName:u.name,full_name:u.name,emailConfirmedAt:u.confirmedAt,loginPath:m.status==='active'?`school-login.html?edition=private&schoolId=${encodeURIComponent(sid)}`:''})}return rows}
Deno.serve(async(req)=>{if(req.method==='OPTIONS')return new Response('ok',{headers:cors});try{
 const url=Deno.env.get('SUPABASE_URL')!,anon=Deno.env.get('SUPABASE_ANON_KEY')!,service=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
 const uc=createClient(url,anon,{global:{headers:{Authorization:req.headers.get('authorization')||''}}});const {data:{user}}=await uc.auth.getUser();if(!user)return json({error:'unauthorized'},401);
 const db=createClient(url,service,{auth:{persistSession:false}}),b=await req.json().catch(()=>({})),sid=clean(b.schoolId),action=clean(b.action);if(!sid)return json({error:'school_required'},400);if(!await ownerGuard(db,sid,user.id))return json({error:'forbidden'},403);
 if(['get_portal','overview','context'].includes(action)){
   const [school,owners,invs]=await Promise.all([db.from('schools').select('*').eq('id',sid).maybeSingle(),db.from('school_owners').select('*').eq('school_id',sid),db.from('school_invites').select('*').eq('school_id',sid).eq('role','manager').order('created_at',{ascending:false})]);
   if(school.error||owners.error||invs.error)throw school.error||owners.error||invs.error;
   const managers=await managerRows(db,sid);const activeManager=managers.find((x:any)=>x.status==='active')||null;const pendingManagers=managers.filter((x:any)=>x.status==='pending');const ownerList=await ownerRows(db,sid);const currentOwner=ownerList.find((x:any)=>x.user_id===user.id||x.userId===user.id);const canManageOwners=!!currentOwner?.is_primary;
   return json({ok:true,school:school.data,owners:ownerList,canManageOwners,managers,manager:activeManager,pendingManagers,invitations:(invs.data||[]).map((x:any)=>({...x,invitee_email:x.email,invite_role:x.role})),managerLoginPath:activeManager?`school-login.html?edition=private&schoolId=${encodeURIComponent(sid)}`:''});
 }
 if(action==='add_owner'){
   const own=await db.from('school_owners').select('is_primary').eq('school_id',sid).eq('user_id',user.id).maybeSingle();if(own.error)throw own.error;if(!own.data?.is_primary)return json({error:'primary_owner_required'},403);
   const email=clean(b.ownerEmail||b.email).toLowerCase(),name=clean(b.ownerName||b.name),password=String(b.password||'');if(!email.includes('@')||!name||password.length<8)return json({error:'invalid_owner_input'},400);
   const existing=await findUserByEmail(db,email);let uid='',created=false;
   if(existing){const [ms,os,sa]=await Promise.all([db.from('school_members').select('school_id,role,status').eq('user_id',existing.id),db.from('school_owners').select('school_id').eq('user_id',existing.id),db.from('system_admins').select('user_id').eq('user_id',existing.id).limit(1)]);if(ms.error||os.error||sa.error)throw ms.error||os.error||sa.error;if((sa.data||[]).length)return json({error:'owner_email_reserved'},409);if((ms.data||[]).some((x:any)=>x.school_id!==sid)||(os.data||[]).some((x:any)=>x.school_id!==sid))return json({error:'owner_email_linked_to_other_school'},409);if((os.data||[]).some((x:any)=>x.school_id===sid))return json({error:'owner_already_exists'},409);const up=await db.auth.admin.updateUserById(existing.id,{password,email_confirm:true,user_metadata:{...(existing.user_metadata||{}),full_name:name,role:'owner'}});if(up.error)throw up.error;uid=existing.id}else{const cr=await db.auth.admin.createUser({email,password,email_confirm:true,user_metadata:{full_name:name,role:'owner'}});if(cr.error)throw cr.error;uid=cr.data.user.id;created=true}
   try{const o=await db.from('school_owners').insert({school_id:sid,user_id:uid,is_primary:false}).select('*').single();if(o.error)throw o.error;const m=await db.from('school_members').insert({school_id:sid,user_id:uid,role:'owner',status:'active',display_name:name,invited_by:user.id,activated_at:new Date().toISOString(),activated_by:user.id}).select('*').single();if(m.error)throw m.error;return json({ok:true,owner:{...o.data,userId:uid,membershipId:m.data.id,email,fullName:name,status:'active'}})}catch(e){await db.from('school_owners').delete().eq('school_id',sid).eq('user_id',uid);await db.from('school_members').delete().eq('school_id',sid).eq('user_id',uid).eq('role','owner');if(created){try{await db.auth.admin.deleteUser(uid)}catch(_){}}throw e}
 }
 if(action==='delete_owner'){
   const own=await db.from('school_owners').select('is_primary').eq('school_id',sid).eq('user_id',user.id).maybeSingle();if(own.error)throw own.error;if(!own.data?.is_primary)return json({error:'primary_owner_required'},403);const uid=clean(b.ownerUserId||b.userId);if(!uid||uid===user.id)return json({error:'cannot_delete_primary_owner'},409);const target=await db.from('school_owners').select('*').eq('school_id',sid).eq('user_id',uid).maybeSingle();if(target.error)throw target.error;if(!target.data)return json({error:'owner_not_found'},404);if(target.data.is_primary)return json({error:'cannot_delete_primary_owner'},409);const dm=await db.from('school_members').delete().eq('school_id',sid).eq('user_id',uid).eq('role','owner');if(dm.error)throw dm.error;const d=await db.from('school_owners').delete().eq('school_id',sid).eq('user_id',uid);if(d.error)throw d.error;const [otherMemberships,otherOwners]=await Promise.all([db.from('school_members').select('id').eq('user_id',uid).limit(1),db.from('school_owners').select('id').eq('user_id',uid).limit(1)]);if(!(otherMemberships.data||[]).length&&!(otherOwners.data||[]).length){try{await db.auth.admin.deleteUser(uid)}catch(_){}}return json({ok:true,deletedOwnerUserId:uid})
 }
 if(['create_manager_invitation','create_invitation'].includes(action)){
   const email=clean(b.inviteeEmail||b.email).toLowerCase(),name=clean(b.inviteeName||b.name);if(!email.includes('@'))return json({error:'invalid_email'},400);
   const existing=await managerRows(db,sid);if(existing.some((x:any)=>String(x.email||'').toLowerCase()===email&&['active','pending'].includes(x.status)))return json({error:'manager_account_already_exists'},409);
   await db.from('school_invites').update({status:'cancelled',updated_at:new Date().toISOString()}).eq('school_id',sid).eq('role','manager').eq('status','pending');
   const token=crypto.randomUUID()+crypto.randomUUID().replaceAll('-',''),tokenHash=await hash(token),expires=new Date(Date.now()+7*86400000).toISOString();
   const ins=await db.from('school_invites').insert({school_id:sid,email,role:'manager',invitee_name:name,invited_by:user.id,token_hash:tokenHash,status:'pending',expires_at:expires,metadata:{supervisorRole:'owner',activationRequired:true}}).select('*').single();if(ins.error)throw ins.error;
   return json({ok:true,invitation:{...ins.data,invitee_email:email,invite_role:'manager'},invitePath:`private-manager-register.html?token=${encodeURIComponent(token)}`});
 }
 if(action==='activate_manager'){
   const id=clean(b.memberId);const target=await db.from('school_members').select('*').eq('id',id).eq('school_id',sid).eq('role','manager').maybeSingle();if(target.error)throw target.error;if(!target.data)return json({error:'manager_not_found'},404);
   const now=new Date().toISOString();
   const prev=await db.from('school_members').update({status:'disabled',disabled_at:now,disabled_by:user.id}).eq('school_id',sid).eq('role','manager').eq('status','active').neq('id',id);if(prev.error)throw prev.error;
   const up=await db.from('school_members').update({status:'active',activated_at:now,activated_by:user.id,disabled_at:null,disabled_by:null}).eq('id',id).select('*').single();if(up.error)throw up.error;const u=await meta(db,up.data.user_id);
   return json({ok:true,manager:{...up.data,membershipId:up.data.id,userId:up.data.user_id,email:u.email,fullName:u.name},managerLoginPath:`school-login.html?edition=private&schoolId=${encodeURIComponent(sid)}`});
 }
 if(action==='disable_manager'){
   const id=clean(b.memberId),now=new Date().toISOString();const up=await db.from('school_members').update({status:'disabled',disabled_at:now,disabled_by:user.id}).eq('id',id).eq('school_id',sid).eq('role','manager').select('*').maybeSingle();if(up.error)throw up.error;if(!up.data)return json({error:'manager_not_found'},404);return json({ok:true,manager:up.data});
 }
 if(action==='delete_manager'){
   const id=clean(b.memberId);const q=await db.from('school_members').select('*').eq('id',id).eq('school_id',sid).eq('role','manager').maybeSingle();if(q.error)throw q.error;if(!q.data)return json({error:'manager_not_found'},404);const uid=q.data.user_id;
   const del=await db.from('school_members').delete().eq('id',id);if(del.error)throw del.error;
   const [otherMemberships,ownerLinks]=await Promise.all([db.from('school_members').select('id').eq('user_id',uid).limit(1),db.from('school_owners').select('id').eq('user_id',uid).limit(1)]);
   if(!(otherMemberships.data||[]).length && !(ownerLinks.data||[]).length){try{await db.auth.admin.deleteUser(uid)}catch(_){}}
   return json({ok:true,deletedMemberId:id});
 }
 if(action==='cancel_manager_invitation'){
   const id=clean(b.invitationId);const up=await db.from('school_invites').update({status:'cancelled',updated_at:new Date().toISOString()}).eq('id',id).eq('school_id',sid).eq('role','manager').eq('status','pending').select('*').maybeSingle();if(up.error)throw up.error;return json({ok:true,invitation:up.data});
 }
 if(action==='manager_login_link'){
   const managers=await managerRows(db,sid);const m=managers.find((x:any)=>x.status==='active');if(!m)return json({error:'no_active_manager'},404);return json({ok:true,manager:m,managerLoginPath:`school-login.html?edition=private&schoolId=${encodeURIComponent(sid)}`});
 }
 return json({error:'unsupported_action'},400);
}catch(e){return json({error:e instanceof Error?e.message:String(e)},500)}});