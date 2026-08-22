create table if not exists public.private_semester_plans (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('student_advisor','activity_leader','health_advisor','kindergarten_teacher')),
  plan_type text not null,
  semester text not null,
  academic_year text not null,
  plan_data jsonb not null default '[]'::jsonb,
  school_config jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (school_id,user_id,role,semester,academic_year)
);

create table if not exists public.private_semester_plan_weeks (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references public.private_semester_plans(id) on delete cascade,
  school_id uuid not null references public.schools(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null,
  week_key text not null,
  status text not null default 'pending' check (status in ('pending','in_progress','evidence_requested','awaiting_approval','completed')),
  user_notes text,
  manager_note text,
  evidence_file_id uuid references public.platform_files(id) on delete set null,
  evidence_requested_at timestamptz,
  evidence_requested_by uuid references auth.users(id) on delete set null,
  evidence_submitted_at timestamptz,
  approved_at timestamptz,
  approved_by uuid references auth.users(id) on delete set null,
  updated_at timestamptz not null default now(),
  unique (plan_id,week_key)
);

create index if not exists idx_private_semester_plans_school on public.private_semester_plans(school_id,role,updated_at desc);
create index if not exists idx_private_semester_weeks_school on public.private_semester_plan_weeks(school_id,status,updated_at desc);
