import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
const cors={'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'authorization, x-client-info, apikey, content-type'};
const json=(b:any,s=200)=>new Response(JSON.stringify(b),{status:s,headers:{...cors,'content-type':'application/json; charset=utf-8'}});
const clean=(v:any)=>String(v??'').trim();
async function hash(v:string){const d=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(v));return [...new Uint8Array(d)].map(x=>x.toString(16).padStart(2,'0')).join('')}
Deno.serve(async(req)=>{if(req.method==='OPTIONS')return new Response('ok',{headers:cors});try{
 const url=Deno.env.get('SUPABASE_URL')!,anon=Deno.env.get('SUPABASE_ANON_KEY')!,service=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
 const uc=createClient(url,anon,{global:{headers:{Authorization:req.headers.get('authorization')||''}}});const {data:{user}}=await uc.auth.getUser();if(!user)return json({error:'unauthorized'},401);
 const db=createClient(url,service,{auth:{persistSession:false}}),b=await req.json().catch(()=>({})),sid=clean(b.schoolId);if(!sid)return json({error:'school_required'},400);
 const [school,member]=await Promise.all([db.from('schools').select('id,school_name,school_code,status').eq('id',sid).maybeSingle(),db.from('school_members').select('id').eq('school_id',sid).eq('user_id',user.id).eq('role','manager').eq('status','active').maybeSingle()]);
 if(school.error||member.error)throw school.error||member.error;if(!school.data||school.data.status!=='active')return json({error:'school_not_active'},403);if(!member.data)return json({error:'forbidden'},403);
 await db.from('school_invites').update({status:'cancelled',updated_at:new Date().toISOString()}).eq('school_id',sid).eq('role','registration_portal').eq('status','pending');
 const token=crypto.randomUUID()+crypto.randomUUID().replaceAll('-',''),expires=new Date(Date.now()+365*86400000).toISOString();
 const ins=await db.from('school_invites').insert({school_id:sid,email:`registration-${sid}@private.invalid`,role:'registration_portal',invitee_name:'رابط تسجيل مستخدمي المدرسة',invited_by:user.id,token_hash:await hash(token),status:'pending',expires_at:expires,metadata:{registrationPortal:true,activationRequired:true,supervisorRole:'manager',supervisorUserId:user.id}}).select('id,expires_at').single();if(ins.error)throw ins.error;
 return json({ok:true,school:school.data,expiresAt:ins.data.expires_at,registrationPath:`private-school-user-register.html?token=${encodeURIComponent(token)}`});
}catch(e){return json({error:e instanceof Error?e.message:String(e)},500)}});
