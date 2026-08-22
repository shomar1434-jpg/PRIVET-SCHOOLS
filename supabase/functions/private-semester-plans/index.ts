import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
const cors={'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'authorization, x-client-info, apikey, content-type'};
const json=(b:any,s=200)=>new Response(JSON.stringify(b),{status:s,headers:{...cors,'content-type':'application/json; charset=utf-8'}});
const clean=(v:any)=>String(v??'').trim();
const ROLE_TYPES:any={student_advisor:'التوجيه الطلابي',activity_leader:'النشاط الطلابي',health_advisor:'التوجيه الصحي',kindergarten_teacher:'رياض الأطفال'};
function allowedUserRole(r:string){return !!ROLE_TYPES[r]}
async function authMeta(db:any,id:string){try{const r=await db.auth.admin.getUserById(id);const u=r.data?.user;return {name:clean(u?.user_metadata?.full_name||u?.user_metadata?.name||u?.email),email:clean(u?.email)}}catch(_){return {name:'',email:''}}}
Deno.serve(async(req)=>{if(req.method==='OPTIONS')return new Response('ok',{headers:cors});try{
  const url=Deno.env.get('SUPABASE_URL')!,anon=Deno.env.get('SUPABASE_ANON_KEY')!,service=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const uc=createClient(url,anon,{global:{headers:{Authorization:req.headers.get('authorization')||''}}});const {data:{user}}=await uc.auth.getUser();if(!user)return json({error:'unauthorized'},401);
  const db=createClient(url,service,{auth:{persistSession:false}}),b=await req.json().catch(()=>({})),sid=clean(b.schoolId),action=clean(b.action);if(!sid)return json({error:'school_required'},400);
  const mm=await db.from('school_members').select('id,role,status,display_name').eq('school_id',sid).eq('user_id',user.id).eq('status','active');if(mm.error)throw mm.error;const memberships=mm.data||[];if(!memberships.length)return json({error:'forbidden'},403);
  const roles=memberships.map((x:any)=>String(x.role)),actor=clean(b.actorRole),role=actor&&roles.includes(actor)?actor:roles[0];
  const isManager=role==='manager'; if(!isManager&&!allowedUserRole(role))return json({error:'unsupported_role'},403);
  if(action==='my_plan'){
    if(isManager)return json({error:'manager_use_school_plans'},400);
    const semester=clean(b.semester||'الفصل الدراسي الأول'),year=clean(b.academicYear||'1448 هــ');
    const p=await db.from('private_semester_plans').select('*').eq('school_id',sid).eq('user_id',user.id).eq('role',role).eq('semester',semester).eq('academic_year',year).maybeSingle();if(p.error)throw p.error;
    let weeks:any[]=[];if(p.data){const w=await db.from('private_semester_plan_weeks').select('*').eq('plan_id',p.data.id).order('week_key');if(w.error)throw w.error;weeks=w.data||[]}
    return json({ok:true,plan:p.data,weeks,planType:ROLE_TYPES[role]});
  }
  if(action==='save_plan'){
    if(isManager)return json({error:'manager_read_only'},403);
    const semester=clean(b.semester),year=clean(b.academicYear),planData=Array.isArray(b.planData)?b.planData:[],config=b.schoolConfig&&typeof b.schoolConfig==='object'?b.schoolConfig:{};
    if(!semester||!year)return json({error:'semester_year_required'},400);
    const up=await db.from('private_semester_plans').upsert({school_id:sid,user_id:user.id,role,plan_type:ROLE_TYPES[role],semester,academic_year:year,plan_data:planData,school_config:config,updated_at:new Date().toISOString()},{onConflict:'school_id,user_id,role,semester,academic_year'}).select('*').single();if(up.error)throw up.error;
    return json({ok:true,plan:up.data});
  }
  if(action==='save_week'){
    if(isManager)return json({error:'manager_read_only'},403);
    const planId=clean(b.planId),weekKey=clean(b.weekKey),status=clean(b.status);if(!planId||!weekKey)return json({error:'plan_week_required'},400);
    if(!['pending','in_progress'].includes(status))return json({error:'user_cannot_complete_week'},403);
    const own=await db.from('private_semester_plans').select('id').eq('id',planId).eq('school_id',sid).eq('user_id',user.id).eq('role',role).maybeSingle();if(own.error)throw own.error;if(!own.data)return json({error:'plan_not_found'},404);
    const up=await db.from('private_semester_plan_weeks').upsert({plan_id:planId,school_id:sid,user_id:user.id,role,week_key:weekKey,status,user_notes:clean(b.notes),updated_at:new Date().toISOString()},{onConflict:'plan_id,week_key'}).select('*').single();if(up.error)throw up.error;return json({ok:true,week:up.data});
  }
  if(action==='submit_evidence'){
    if(isManager)return json({error:'manager_cannot_submit'},403);
    const planId=clean(b.planId),weekKey=clean(b.weekKey),fileId=clean(b.fileId);if(!planId||!weekKey||!fileId)return json({error:'evidence_required'},400);
    const f=await db.from('platform_files').select('id,school_id,user_id').eq('id',fileId).eq('school_id',sid).eq('user_id',user.id).maybeSingle();if(f.error)throw f.error;if(!f.data)return json({error:'evidence_file_not_found'},404);
    const own=await db.from('private_semester_plans').select('id').eq('id',planId).eq('school_id',sid).eq('user_id',user.id).eq('role',role).maybeSingle();if(own.error)throw own.error;if(!own.data)return json({error:'plan_not_found'},404);
    const up=await db.from('private_semester_plan_weeks').upsert({plan_id:planId,school_id:sid,user_id:user.id,role,week_key:weekKey,status:'awaiting_approval',user_notes:clean(b.notes),evidence_file_id:fileId,evidence_submitted_at:new Date().toISOString(),updated_at:new Date().toISOString()},{onConflict:'plan_id,week_key'}).select('*').single();if(up.error)throw up.error;return json({ok:true,week:up.data});
  }
  if(action==='school_plans'){
    if(!isManager)return json({error:'manager_required'},403);
    const p=await db.from('private_semester_plans').select('*').eq('school_id',sid).order('updated_at',{ascending:false});if(p.error)throw p.error;
    const out=[];for(const plan of p.data||[]){const [meta,w]=await Promise.all([authMeta(db,plan.user_id),db.from('private_semester_plan_weeks').select('*').eq('plan_id',plan.id)]);if(w.error)throw w.error;const weeks=[];for(const wk of w.data||[]){let evidence_url='';if(wk.evidence_file_id){const f=await db.from('platform_files').select('bucket,object_path').eq('id',wk.evidence_file_id).eq('school_id',sid).maybeSingle();if(f.data){const su=await db.storage.from(f.data.bucket).createSignedUrl(f.data.object_path,3600);evidence_url=su.data?.signedUrl||''}}weeks.push({...wk,evidence_url})}out.push({...plan,user_name:meta.name,user_email:meta.email,weeks})}
    return json({ok:true,plans:out});
  }
  if(['request_evidence','approve_week','return_week'].includes(action)){
    if(!isManager)return json({error:'manager_required'},403);const planId=clean(b.planId),weekKey=clean(b.weekKey);if(!planId||!weekKey)return json({error:'plan_week_required'},400);
    const p=await db.from('private_semester_plans').select('id,user_id,role').eq('id',planId).eq('school_id',sid).maybeSingle();if(p.error)throw p.error;if(!p.data)return json({error:'plan_not_found'},404);
    const now=new Date().toISOString();
    if(action==='request_evidence'){
      const up=await db.from('private_semester_plan_weeks').upsert({plan_id:planId,school_id:sid,user_id:p.data.user_id,role:p.data.role,week_key:weekKey,status:'evidence_requested',manager_note:clean(b.note),evidence_requested_at:now,evidence_requested_by:user.id,updated_at:now},{onConflict:'plan_id,week_key'}).select('*').single();if(up.error)throw up.error;return json({ok:true,week:up.data});
    }
    const w=await db.from('private_semester_plan_weeks').select('*').eq('plan_id',planId).eq('week_key',weekKey).maybeSingle();if(w.error)throw w.error;if(!w.data)return json({error:'week_not_found'},404);
    if(action==='approve_week'){
      if(!w.data.evidence_file_id)return json({error:'evidence_required_before_approval'},409);
      const up=await db.from('private_semester_plan_weeks').update({status:'completed',manager_note:clean(b.note)||w.data.manager_note,approved_at:now,approved_by:user.id,updated_at:now}).eq('id',w.data.id).select('*').single();if(up.error)throw up.error;return json({ok:true,week:up.data});
    }
    const up=await db.from('private_semester_plan_weeks').update({status:'in_progress',manager_note:clean(b.note),approved_at:null,approved_by:null,updated_at:now}).eq('id',w.data.id).select('*').single();if(up.error)throw up.error;return json({ok:true,week:up.data});
  }
  return json({error:'unsupported_action'},400);
}catch(e){return json({error:e instanceof Error?e.message:String(e)},500)}});
