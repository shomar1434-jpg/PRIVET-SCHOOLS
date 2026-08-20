-- Standalone Private Schools Platform - clean core schema
-- NEW PROJECT ONLY. Contains no public-school data and no dependency on the former project.
create extension if not exists pgcrypto;

create table if not exists public.system_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique, is_active boolean not null default true, created_at timestamptz not null default now()
);
create table if not exists public.schools (
  id uuid primary key default gen_random_uuid(), school_code text not null unique, school_name text not null,
  school_type text not null default 'private' check (school_type in ('private','international','kindergarten','other_private')),
  status text not null default 'active' check (status in ('active','disabled','archived')), created_at timestamptz not null default now()
);
create table if not exists public.school_members (
  id uuid primary key default gen_random_uuid(), school_id uuid not null references public.schools(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade, role text not null, status text not null default 'active',
  invited_by uuid references auth.users(id), created_at timestamptz not null default now(), unique(school_id,user_id,role)
);
create table if not exists public.school_owners (
  id uuid primary key default gen_random_uuid(), school_id uuid not null references public.schools(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade, is_primary boolean not null default false, created_at timestamptz not null default now(), unique(school_id,user_id)
);
create table if not exists public.school_invites (
  id uuid primary key default gen_random_uuid(), school_id uuid not null references public.schools(id) on delete cascade,
  email text not null, role text not null, invited_by uuid not null references auth.users(id), token_hash text not null unique,
  status text not null default 'pending', expires_at timestamptz not null, accepted_at timestamptz, created_at timestamptz not null default now()
);
create table if not exists public.school_template_profiles (
  school_id uuid primary key references public.schools(id) on delete cascade, profile jsonb not null default '{}'::jsonb, updated_by uuid references auth.users(id), updated_at timestamptz not null default now()
);
create table if not exists public.compliance_inspections (
  id uuid primary key default gen_random_uuid(), school_id uuid not null references public.schools(id) on delete cascade, academic_year text not null,
  status text not null default 'draft', created_by uuid references auth.users(id), created_at timestamptz not null default now(), unique(school_id,academic_year)
);
create table if not exists public.compliance_items (
  id uuid primary key default gen_random_uuid(), inspection_id uuid not null references public.compliance_inspections(id) on delete cascade,
  requirement_key text not null, title text not null, state text not null default 'waiting_evidence' check(state in ('complete','waiting_evidence','not_applicable')), notes text, unique(inspection_id,requirement_key)
);
create table if not exists public.platform_files (
  id uuid primary key default gen_random_uuid(), school_id uuid not null references public.schools(id) on delete cascade, user_id uuid references auth.users(id),
  module_key text not null, record_id text, bucket text not null default 'private-school-files', object_path text not null unique, metadata jsonb not null default '{}'::jsonb, created_at timestamptz not null default now()
);
create table if not exists public.compliance_evidence (
  id uuid primary key default gen_random_uuid(), school_id uuid not null references public.schools(id) on delete cascade, item_id uuid not null references public.compliance_items(id) on delete cascade,
  file_id uuid not null references public.platform_files(id) on delete cascade, uploaded_by uuid references auth.users(id), created_at timestamptz not null default now()
);
create table if not exists public.private_school_outputs (
  id uuid primary key default gen_random_uuid(), school_id uuid not null references public.schools(id) on delete cascade, output_type text not null, title text not null, payload jsonb not null default '{}'::jsonb,
  status text not null default 'draft', created_by uuid references auth.users(id), approved_by uuid references auth.users(id), created_at timestamptz not null default now(), approved_at timestamptz
);
create table if not exists public.school_tasks (
  id uuid primary key default gen_random_uuid(), school_id uuid not null references public.schools(id) on delete cascade, title text not null, module_key text not null, record_type text,
  assigned_to uuid not null references auth.users(id), created_by uuid not null references auth.users(id), status text not null default 'assigned', payload jsonb not null default '{}'::jsonb, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.task_access_grants (
  id uuid primary key default gen_random_uuid(), school_id uuid not null references public.schools(id) on delete cascade, task_id uuid not null references public.school_tasks(id) on delete cascade,
  user_id uuid not null references auth.users(id), module_key text not null, record_type text, can_view boolean not null default true, can_update boolean not null default false, can_upload boolean not null default false, can_submit boolean not null default false, starts_at timestamptz not null default now(), ends_at timestamptz, unique(task_id,user_id,module_key,record_type)
);
create table if not exists public.employee_requests (
  id uuid primary key default gen_random_uuid(), school_id uuid not null references public.schools(id) on delete cascade, requester_id uuid not null references auth.users(id), request_type text not null, payload jsonb not null default '{}'::jsonb, status text not null default 'pending', current_approver uuid references auth.users(id), created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.performance_report_approvals (
  id uuid primary key default gen_random_uuid(), school_id uuid not null references public.schools(id) on delete cascade, subject_user_id uuid not null references auth.users(id), subject_role text not null, report_key text not null, payload jsonb not null default '{}'::jsonb, status text not null default 'pending', submitted_by uuid references auth.users(id), decided_by uuid references auth.users(id), created_at timestamptz not null default now(), decided_at timestamptz
);
create table if not exists public.internal_messages (
  id uuid primary key default gen_random_uuid(), school_id uuid not null references public.schools(id) on delete cascade, sender_id uuid not null references auth.users(id), subject text, body text not null, created_at timestamptz not null default now()
);
create table if not exists public.internal_message_recipients (
  id uuid primary key default gen_random_uuid(), message_id uuid not null references public.internal_messages(id) on delete cascade, recipient_id uuid not null references auth.users(id), read_at timestamptz, unique(message_id,recipient_id)
);

create index if not exists school_members_school_user_idx on public.school_members(school_id,user_id,status);
create index if not exists school_tasks_assignee_idx on public.school_tasks(school_id,assigned_to,status);
create index if not exists platform_files_school_module_idx on public.platform_files(school_id,module_key);

-- RLS: client access is denied by default. Server-side Edge Functions perform privileged writes after validating JWT + school membership.
alter table public.system_admins enable row level security;
alter table public.schools enable row level security;
alter table public.school_members enable row level security;
alter table public.school_owners enable row level security;
alter table public.school_invites enable row level security;
alter table public.school_template_profiles enable row level security;
alter table public.compliance_inspections enable row level security;
alter table public.compliance_items enable row level security;
alter table public.platform_files enable row level security;
alter table public.compliance_evidence enable row level security;
alter table public.private_school_outputs enable row level security;
alter table public.school_tasks enable row level security;
alter table public.task_access_grants enable row level security;
alter table public.employee_requests enable row level security;
alter table public.performance_report_approvals enable row level security;
alter table public.internal_messages enable row level security;
alter table public.internal_message_recipients enable row level security;

revoke all on all tables in schema public from anon, authenticated;
-- Browser clients do not receive blanket table access. Audited Edge Functions validate JWT + school membership before privileged operations.
