import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
const cors={'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'authorization, x-client-info, apikey, content-type'};
const json=(b:any,s=200)=>new Response(JSON.stringify(b),{status:s,headers:{...cors,'content-type':'application/json; charset=utf-8'}});
const clean=(v:any)=>String(v??'').trim();
async function hash(v:string){const d=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(v));return [...new Uint8Array(d)].map(x=>x.toString(16).padStart(2,'0')).join('')}
async function meta(db:any,id:string){try{const r=await db.auth.admin.getUserById(id);const u=r.data?.user;return {email:u?.email||'',name:u?.user_metadata?.full_name||u?.user_metadata?.name||u?.email||'',confirmedAt:u?.email_confirmed_at||null}}catch(_){return {email:'',name:'',confirmedAt:null}}}
async function ownerGuard(db:any,sid:string,uid:string){const q=await db.from('school_members').select('id').eq('school_id',sid).eq('user_id',uid).eq('role','owner').eq('status','active').maybeSingle();return !!q.data}
async function managerRows(db:any,sid:string){const q=await db.from('school_members').select('*').eq('school_id',sid).eq('role','manager').order('created_at',{ascending:false});if(q.error)throw q.error;const rows=[];for(const m of q.data||[]){const u=await meta(db,m.user_id);rows.push({...m,membershipId:m.id,userId:m.user_id,email:u.email,fullName:u.name,full_name:u.name,emailConfirmedAt:u.confirmedAt,loginPath:m.status==='active'?`private-manager-login.html?schoolId=${encodeURIComponent(sid)}`:''})}return rows}
Deno.serve(async(req)=>{if(req.method==='OPTIONS')return new Response('ok',{headers:cors});try{
 const url=Deno.env.get('SUPABASE_URL')!,anon=Deno.env.get('SUPABASE_ANON_KEY')!,service=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
 const uc=createClient(url,anon,{global:{headers:{Authorization:req.headers.get('authorization')||''}}});const {data:{user}}=await uc.auth.getUser();if(!user)return json({error:'unauthorized'},401);
 const db=createClient(url,service,{auth:{persistSession:false}}),b=await req.json().catch(()=>({})),sid=clean(b.schoolId),action=clean(b.action);if(!sid)return json({error:'school_required'},400);if(!await ownerGuard(db,sid,user.id))return json({error:'forbidden'},403);
 if(['get_portal','overview','context'].includes(action)){
   const [school,owners,invs]=await Promise.all([db.from('schools').select('*').eq('id',sid).maybeSingle(),db.from('school_owners').select('*').eq('school_id',sid),db.from('school_invites').select('*').eq('school_id',sid).eq('role','manager').order('created_at',{ascending:false})]);
   if(school.error||owners.error||invs.error)throw school.error||owners.error||invs.error;
   const managers=await managerRows(db,sid);const activeManager=managers.find((x:any)=>x.status==='active')||null;const pendingManagers=managers.filter((x:any)=>x.status==='pending');
   return json({ok:true,school:school.data,owners:owners.data||[],managers,manager:activeManager,pendingManagers,invitations:(invs.data||[]).map((x:any)=>({...x,invitee_email:x.email,invite_role:x.role})),managerLoginPath:activeManager?`private-manager-login.html?schoolId=${encodeURIComponent(sid)}`:''});
 }
 if(['create_manager_invitation','create_invitation'].includes(action)){
   const email=clean(b.inviteeEmail||b.email).toLowerCase(),name=clean(b.inviteeName||b.name);if(!email.includes('@'))return json({error:'invalid_email'},400);
   await db.from('school_invites').update({status:'cancelled',updated_at:new Date().toISOString()}).eq('school_id',sid).eq('role','manager').eq('status','pending');
   const token=crypto.randomUUID()+crypto.randomUUID().replaceAll('-',''),tokenHash=await hash(token),expires=new Date(Date.now()+7*86400000).toISOString();
   const ins=await db.from('school_invites').insert({school_id:sid,email,role:'manager',invitee_name:name,invited_by:user.id,token_hash:tokenHash,status:'pending',expires_at:expires,metadata:{supervisorRole:'owner',activationRequired:true}}).select('*').single();if(ins.error)throw ins.error;
   return json({ok:true,invitation:{...ins.data,invitee_email:email,invite_role:'manager'},invitePath:`private-manager-register.html?token=${encodeURIComponent(token)}`});
 }
 if(action==='activate_manager'){
   const id=clean(b.memberId);const target=await db.from('school_members').select('*').eq('id',id).eq('school_id',sid).eq('role','manager').maybeSingle();if(target.error)throw target.error;if(!target.data)return json({error:'manager_not_found'},404);
   await db.from('school_members').update({status:'disabled'}).eq('school_id',sid).eq('role','manager').eq('status','active').neq('id',id);
   const up=await db.from('school_members').update({status:'active'}).eq('id',id).select('*').single();if(up.error)throw up.error;const u=await meta(db,up.data.user_id);
   return json({ok:true,manager:{...up.data,membershipId:up.data.id,userId:up.data.user_id,email:u.email,fullName:u.name},managerLoginPath:`private-manager-login.html?schoolId=${encodeURIComponent(sid)}`});
 }
 if(action==='disable_manager'){
   const id=clean(b.memberId);const up=await db.from('school_members').update({status:'disabled'}).eq('id',id).eq('school_id',sid).eq('role','manager').select('*').maybeSingle();if(up.error)throw up.error;if(!up.data)return json({error:'manager_not_found'},404);return json({ok:true,manager:up.data});
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
   const managers=await managerRows(db,sid);const m=managers.find((x:any)=>x.status==='active');if(!m)return json({error:'no_active_manager'},404);return json({ok:true,manager:m,managerLoginPath:`private-manager-login.html?schoolId=${encodeURIComponent(sid)}`});
 }
 return json({error:'unsupported_action'},400);
}catch(e){return json({error:e instanceof Error?e.message:String(e)},500)}});