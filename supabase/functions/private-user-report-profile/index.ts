import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
const cors={'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'authorization, x-client-info, apikey, content-type'};
const json=(b:any,s=200)=>new Response(JSON.stringify(b),{status:s,headers:{...cors,'content-type':'application/json; charset=utf-8'}});
const clean=(v:any)=>String(v??'').trim();
const roleLabels:any={manager:'مدير/مديرة المدرسة',agent:'وكيل/وكيلة المدرسة',teacher:'معلم/معلمة',student_advisor:'موجه/موجهة طلابية',activity_leader:'رائد/رائدة نشاط',health_advisor:'موجه/موجهة صحي',kindergarten_teacher:'معلمة رياض أطفال',administrative_employee:'موظف/موظفة إدارية',owner:'مالك المدرسة'};
async function signed(db:any,sid:string,fileId:any){const id=clean(fileId);if(!id)return '';const f=await db.from('platform_files').select('bucket,object_path').eq('id',id).eq('school_id',sid).maybeSingle();if(!f.data)return '';const s=await db.storage.from(f.data.bucket).createSignedUrl(f.data.object_path,3600);return s.data?.signedUrl||''}
Deno.serve(async(req)=>{if(req.method==='OPTIONS')return new Response('ok',{headers:cors});try{
 const url=Deno.env.get('SUPABASE_URL')!,anon=Deno.env.get('SUPABASE_ANON_KEY')!,service=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
 const uc=createClient(url,anon,{global:{headers:{Authorization:req.headers.get('authorization')||''}}});const {data:{user}}=await uc.auth.getUser();if(!user)return json({error:'unauthorized'},401);
 const db=createClient(url,service,{auth:{persistSession:false}}),b=await req.json().catch(()=>({})),sid=clean(b.schoolId),action=clean(b.action)||'get';if(!sid)return json({error:'school_required'},400);
 const mr=await db.from('school_members').select('id,role,role_variant,status,display_name').eq('school_id',sid).eq('user_id',user.id).eq('status','active');if(mr.error)throw mr.error;if(!(mr.data||[]).length)return json({error:'forbidden'},403);
 const requested=clean(b.actorRole);const membership=(mr.data||[]).find((m:any)=>m.role===requested)||(mr.data||[])[0];const role=String(membership.role||'');
 if(action==='save'){
   const displayName=clean(b.displayName)||clean(membership.display_name)||clean(user.user_metadata?.full_name||user.user_metadata?.name)||clean(user.email);
   const signatureFileId=clean(b.signatureFileId)||null;
   if(signatureFileId){const fq=await db.from('platform_files').select('id,mime_type').eq('id',signatureFileId).eq('school_id',sid).maybeSingle();if(fq.error)throw fq.error;if(!fq.data)return json({error:'invalid_signature_file'},400);if(!String(fq.data.mime_type||'').startsWith('image/'))return json({error:'signature_must_be_image'},400)}
   const up=await db.from('user_report_profiles').upsert({school_id:sid,user_id:user.id,display_name:displayName,signature_file_id:signatureFileId,updated_at:new Date().toISOString()},{onConflict:'school_id,user_id'}).select('*').single();if(up.error)throw up.error;
   if(displayName&&displayName!==membership.display_name){await db.from('school_members').update({display_name:displayName}).eq('id',membership.id).eq('school_id',sid)}
   return json({ok:true,profile:{...up.data,role,role_variant:membership.role_variant||'',role_label:roleLabels[role]||role,signatureUrl:await signed(db,sid,up.data.signature_file_id)}})
 }
 const q=await db.from('user_report_profiles').select('*').eq('school_id',sid).eq('user_id',user.id).maybeSingle();if(q.error)throw q.error;
 const name=clean(q.data?.display_name||membership.display_name||user.user_metadata?.full_name||user.user_metadata?.name||user.email);
 return json({ok:true,profile:{...(q.data||{}),display_name:name,role,role_variant:membership.role_variant||'',role_label:roleLabels[role]||role,signatureUrl:await signed(db,sid,q.data?.signature_file_id)},account:{email:user.email||'',userId:user.id}})
}catch(e){return json({error:e instanceof Error?e.message:String(e)},500)}});
