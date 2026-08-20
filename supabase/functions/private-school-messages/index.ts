import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const cors={
  'Access-Control-Allow-Origin':'*',
  'Access-Control-Allow-Headers':'authorization, x-client-info, apikey, content-type'
};
const json=(body:any,status=200)=>new Response(JSON.stringify(body),{
  status,headers:{...cors,'content-type':'application/json; charset=utf-8'}
});
const clean=(v:any)=>String(v??'').trim();

async function authUser(req:Request){
  const url=Deno.env.get('SUPABASE_URL')!;
  const anon=Deno.env.get('SUPABASE_ANON_KEY')!;
  const h=req.headers.get('authorization')||'';
  const uc=createClient(url,anon,{global:{headers:{Authorization:h}}});
  return await uc.auth.getUser();
}
async function userMeta(db:any,userId:string){
  try{
    const r=await db.auth.admin.getUserById(userId);
    const u=r.data?.user;
    return {
      email:u?.email||'',
      name:u?.user_metadata?.full_name||u?.user_metadata?.name||u?.email||''
    };
  }catch(_){return {email:'',name:''}}
}

Deno.serve(async(req)=>{
  if(req.method==='OPTIONS')return new Response('ok',{headers:cors});
  try{
    const url=Deno.env.get('SUPABASE_URL')!;
    const service=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const au=await authUser(req);
    const user=au.data.user;
    if(!user)return json({error:'unauthorized'},401);

    const db=createClient(url,service,{auth:{persistSession:false}});
    const b=await req.json().catch(()=>({}));
    const schoolId=clean(b.schoolId);
    const actorRole=clean(b.actorRole);
    const action=clean(b.action);

    if(!schoolId)return json({error:'school_required'},400);
    const membership=await db.from('school_members')
      .select('id,role,status')
      .eq('school_id',schoolId)
      .eq('user_id',user.id)
      .eq('status','active');
    if(membership.error)throw membership.error;
    const roles=(membership.data||[]).map((x:any)=>String(x.role));
    if(!roles.length)return json({error:'forbidden'},403);
    const role=actorRole&&roles.includes(actorRole)?actorRole:roles[0];

    async function managerContacts(){
      const q=await db.from('school_members')
        .select('user_id,role,status')
        .eq('school_id',schoolId)
        .eq('role','manager')
        .eq('status','active');
      if(q.error)throw q.error;
      const contacts=[];
      for(const row of q.data||[]){
        const meta=await userMeta(db,row.user_id);
        contacts.push({
          user_id:row.user_id,
          role:'manager',
          email:meta.email,
          label:meta.name?`${meta.name} — مدير/مديرة المدرسة`:'مدير/مديرة المدرسة'
        });
      }
      return contacts;
    }

    if(action==='contacts'){
      if(role==='owner'){
        return json({
          ok:true,
          policy:'مراسلات مالك المدرسة مخصصة للتواصل المباشر مع مدير/مديرة المدرسة فقط.',
          contacts:await managerContacts()
        });
      }
      const q=await db.from('school_members')
        .select('user_id,role,status')
        .eq('school_id',schoolId)
        .eq('status','active')
        .neq('user_id',user.id);
      if(q.error)throw q.error;
      const contacts=[];
      for(const row of q.data||[]){
        const meta=await userMeta(db,row.user_id);
        contacts.push({
          user_id:row.user_id,role:row.role,email:meta.email,
          label:meta.name||meta.email||row.role
        });
      }
      return json({ok:true,policy:'المراسلات الداخلية ضمن المدرسة فقط.',contacts});
    }

    if(action==='send'){
      const recipientId=clean(b.recipientUserId);
      const subject=clean(b.subject);
      const body=clean(b.body);
      if(!recipientId||!body)return json({error:'recipient_and_body_required'},400);

      const target=await db.from('school_members')
        .select('user_id,role,status')
        .eq('school_id',schoolId)
        .eq('user_id',recipientId)
        .eq('status','active');
      if(target.error)throw target.error;
      const targetRoles=(target.data||[]).map((x:any)=>String(x.role));
      if(!targetRoles.length)return json({error:'recipient_not_in_school'},403);

      // قاعدة حاسمة: المالك لا يراسل إلا مدير/مديرة المدرسة.
      if(role==='owner'&&!targetRoles.includes('manager')){
        return json({error:'owner_can_message_manager_only'},403);
      }

      const ins=await db.from('internal_messages')
        .insert({school_id:schoolId,sender_id:user.id,subject:subject||null,body})
        .select('id,school_id,sender_id,subject,body,created_at')
        .single();
      if(ins.error)throw ins.error;
      const rec=await db.from('internal_message_recipients')
        .insert({message_id:ins.data.id,recipient_id:recipientId});
      if(rec.error){
        await db.from('internal_messages').delete().eq('id',ins.data.id);
        throw rec.error;
      }
      return json({ok:true,message:ins.data});
    }

    if(action==='inbox'){
      const q=await db.from('internal_message_recipients')
        .select('id,read_at,message:internal_messages(id,school_id,sender_id,subject,body,created_at)')
        .eq('recipient_id',user.id)
        .order('id',{ascending:false})
        .limit(100);
      if(q.error)throw q.error;
      const messages=[];
      for(const row of q.data||[]){
        const m=(row as any).message;
        if(!m||m.school_id!==schoolId)continue;
        const sender=await userMeta(db,m.sender_id);
        messages.push({...m,read_at:(row as any).read_at,sender_name:sender.name||sender.email});
      }
      messages.sort((a:any,b:any)=>String(b.created_at).localeCompare(String(a.created_at)));
      return json({ok:true,messages});
    }

    if(action==='read'){
      const messageId=clean(b.messageId);
      if(!messageId)return json({error:'message_required'},400);
      const rec=await db.from('internal_message_recipients')
        .select('id,message:internal_messages(id,school_id,sender_id,subject,body,created_at)')
        .eq('message_id',messageId)
        .eq('recipient_id',user.id)
        .maybeSingle();
      if(rec.error)throw rec.error;
      const m=(rec.data as any)?.message;
      if(!rec.data||!m||m.school_id!==schoolId)return json({error:'not_found'},404);
      await db.from('internal_message_recipients')
        .update({read_at:new Date().toISOString()})
        .eq('id',(rec.data as any).id);
      const sender=await userMeta(db,m.sender_id);
      return json({ok:true,message:{...m,read_at:new Date().toISOString(),sender_name:sender.name||sender.email}});
    }

    return json({error:'unknown_action'},400);
  }catch(e){
    return json({error:e instanceof Error?e.message:String(e)},500);
  }
});
