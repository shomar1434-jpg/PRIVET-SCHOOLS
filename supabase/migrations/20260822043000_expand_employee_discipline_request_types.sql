-- Extend approved discipline movement types to support deputation and training requests.
alter table public.staff_discipline_movements
  drop constraint if exists staff_discipline_movements_request_type_check;
alter table public.staff_discipline_movements
  add constraint staff_discipline_movements_request_type_check
  check (request_type in ('absence','permission','leave','deputation','training'));
create index if not exists employee_requests_school_approver_status_idx
  on public.employee_requests(school_id,current_approver,status,created_at);
create index if not exists employee_requests_school_requester_created_idx
  on public.employee_requests(school_id,requester_id,created_at desc);
