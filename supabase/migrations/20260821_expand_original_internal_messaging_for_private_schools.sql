alter table public.internal_messages
  add column if not exists sender_user_id uuid,
  add column if not exists sender_name text,
  add column if not exists sender_role text,
  add column if not exists message_type text default 'message',
  add column if not exists require_ack boolean default false,
  add column if not exists acknowledgement_mode text default 'none',
  add column if not exists due_at timestamptz,
  add column if not exists thread_id uuid,
  add column if not exists parent_message_id uuid,
  add column if not exists linked_module text,
  add column if not exists linked_record_type text,
  add column if not exists linked_record_id text,
  add column if not exists linked_title text,
  add column if not exists linked_url text,
  add column if not exists metadata jsonb default '{}'::jsonb,
  add column if not exists converted_task_id uuid;
update public.internal_messages set sender_user_id=sender_id where sender_user_id is null and sender_id is not null;
update public.internal_messages set thread_id=id where thread_id is null;
alter table public.internal_message_recipients
  add column if not exists school_id uuid,
  add column if not exists recipient_user_id uuid,
  add column if not exists recipient_email text,
  add column if not exists recipient_name text,
  add column if not exists recipient_role text,
  add column if not exists acknowledged_at timestamptz,
  add column if not exists action_status text default 'none',
  add column if not exists action_note text,
  add column if not exists pinned_at timestamptz,
  add column if not exists archived_at timestamptz,
  add column if not exists signed_at timestamptz,
  add column if not exists signature_storage_path text,
  add column if not exists signature_hash text,
  add column if not exists signature_mime_type text,
  add column if not exists acknowledgement_metadata jsonb default '{}'::jsonb,
  add column if not exists created_at timestamptz default now();
update public.internal_message_recipients set recipient_user_id=recipient_id where recipient_user_id is null and recipient_id is not null;
update public.internal_message_recipients r set school_id=m.school_id from public.internal_messages m where r.message_id=m.id and r.school_id is null;
create table if not exists public.internal_message_attachments(id uuid primary key default gen_random_uuid(),school_id uuid not null,message_id uuid not null references public.internal_messages(id) on delete cascade,file_id uuid,file_name text,mime_type text,file_size bigint default 0,source text default 'device',created_at timestamptz default now());
create index if not exists idx_internal_messages_school_sender on public.internal_messages(school_id,sender_user_id,created_at desc);
create index if not exists idx_internal_message_recipients_user on public.internal_message_recipients(school_id,recipient_user_id,created_at desc);
create index if not exists idx_internal_message_recipients_message on public.internal_message_recipients(message_id);
create index if not exists idx_internal_message_attachments_message on public.internal_message_attachments(school_id,message_id);
