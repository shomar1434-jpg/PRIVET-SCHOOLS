create table if not exists public.employee_request_events (
  id uuid primary key default gen_random_uuid(), school_id uuid not null references public.schools(id) on delete cascade,
  request_id uuid not null references public.employee_requests(id) on delete cascade, actor_id uuid, actor_role text,
  event_type text not null, note text, snapshot jsonb not null default '{}'::jsonb, created_at timestamptz not null default now()
);
create index if not exists employee_request_events_school_request_idx on public.employee_request_events(school_id, request_id, created_at);
alter table public.employee_request_events enable row level security;
revoke all on public.employee_request_events from anon, authenticated;
create table if not exists public.staff_discipline_movements (
  id uuid primary key default gen_random_uuid(), school_id uuid not null references public.schools(id) on delete cascade,
  request_id uuid not null references public.employee_requests(id) on delete cascade, user_id uuid not null,
  request_type text not null check (request_type in ('absence','permission','leave')), movement_type text not null,
  start_at date, end_at date, minutes integer not null default 0 check (minutes >= 0), reason text,
  source text not null default 'employee_request', approved_by uuid, approved_at timestamptz not null default now(),
  payload jsonb not null default '{}'::jsonb, created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique(request_id)
);
create index if not exists staff_discipline_movements_school_user_idx on public.staff_discipline_movements(school_id, user_id, start_at desc);
alter table public.staff_discipline_movements enable row level security;
revoke all on public.staff_discipline_movements from anon, authenticated;
