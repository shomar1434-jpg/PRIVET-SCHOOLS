create table if not exists public.user_report_profiles (
  school_id uuid not null references public.schools(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  display_name text not null default '',
  signature_file_id uuid null references public.platform_files(id) on delete set null,
  updated_at timestamptz not null default now(),
  primary key (school_id,user_id)
);
create index if not exists idx_user_report_profiles_user on public.user_report_profiles(user_id);
alter table public.user_report_profiles enable row level security;
