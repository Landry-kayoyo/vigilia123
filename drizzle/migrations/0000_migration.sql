create type public.app_role as enum ('super_admin');
create type public.org_role as enum ('org_admin','tech_lead','viewer');
create type public.app_env as enum ('production','staging','development');
create type public.incident_severity as enum ('low','medium','high','critical');
create type public.incident_status as enum ('open','in_progress','resolved');

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role app_role not null,
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;
create policy "own roles" on public.user_roles for select to authenticated using (user_id = auth.uid());

create or replace function public.has_role(_user_id uuid, _role app_role) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id=_user_id and role=_role) $$;

create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 120),
  plan text not null default 'free',
  created_by uuid not null,
  created_at timestamptz not null default now()
);
create table public.organization_members (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null,
  email text,
  role org_role not null default 'viewer',
  created_at timestamptz not null default now(),
  unique (org_id, user_id)
);
grant select, insert, update, delete on public.organizations, public.organization_members to authenticated;
grant all on public.organizations, public.organization_members to service_role;

create or replace function public.org_role_of(_org uuid, _user uuid) returns org_role
language sql stable security definer set search_path = public as $$
  select role from public.organization_members where org_id=_org and user_id=_user $$;
create or replace function public.is_org_member(_org uuid, _user uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists(select 1 from public.organization_members where org_id=_org and user_id=_user) $$;
create or replace function public.can_edit_org(_org uuid, _user uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce(public.org_role_of(_org,_user) in ('org_admin','tech_lead'), false) $$;
create or replace function public.is_org_admin(_org uuid, _user uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce(public.org_role_of(_org,_user) = 'org_admin', false) $$;

alter table public.organizations enable row level security;
alter table public.organization_members enable row level security;
create policy "members read org" on public.organizations for select to authenticated using (public.is_org_member(id, auth.uid()));
create policy "admins update org" on public.organizations for update to authenticated using (public.is_org_admin(id, auth.uid()));
create policy "members read members" on public.organization_members for select to authenticated using (public.is_org_member(org_id, auth.uid()));
create policy "admins manage members" on public.organization_members for update to authenticated using (public.is_org_admin(org_id, auth.uid()));
create policy "admins delete members" on public.organization_members for delete to authenticated using (public.is_org_admin(org_id, auth.uid()) and user_id <> auth.uid());

create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
declare _org uuid;
begin
  insert into public.organizations(name, created_by)
    values (coalesce(nullif(new.raw_user_meta_data->>'org_name',''), split_part(new.email,'@',1) || ' — organisation'), new.id)
    returning id into _org;
  insert into public.organization_members(org_id,user_id,email,role) values (_org,new.id,new.email,'org_admin');
  insert into public.report_schedules(org_id, recipients, frequency, send_hour, timezone)
    values (_org, array[new.email], 'daily', 7, 'Africa/Lubumbashi');
  return new;
end $$;

create table public.monitors (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 120),
  url text not null check (url ~* '^https?://' and char_length(url) <= 2048),
  description text,
  environment app_env not null default 'production',
  category text,
  check_type text not null default 'http' check (check_type in ('http','api')),
  http_method text not null default 'GET' check (http_method in ('GET','HEAD','POST')),
  expected_status int not null default 200,
  expected_keyword text,
  interval_minutes int not null default 5 check (interval_minutes in (1,5,10,15,30,60)),
  timeout_ms int not null default 10000 check (timeout_ms between 1000 and 30000),
  enabled boolean not null default true,
  last_status text not null default 'unknown',
  last_checked_at timestamptz,
  last_response_ms int,
  created_at timestamptz not null default now()
);
create table public.checks (
  id uuid primary key default gen_random_uuid(),
  monitor_id uuid not null references public.monitors(id) on delete cascade,
  org_id uuid not null references public.organizations(id) on delete cascade,
  checked_at timestamptz not null default now(),
  ok boolean not null,
  status_code int,
  response_ms int,
  error text
);
create index on public.checks(monitor_id, checked_at desc);
create index on public.checks(org_id, checked_at desc);
create table public.incidents (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  monitor_id uuid references public.monitors(id) on delete set null,
  type text not null,
  severity incident_severity not null default 'medium',
  status incident_status not null default 'open',
  title text not null,
  description text,
  ai_analysis text,
  recommendations text,
  started_at timestamptz not null default now(),
  resolved_at timestamptz,
  created_at timestamptz not null default now()
);
create table public.incident_events (
  id uuid primary key default gen_random_uuid(),
  incident_id uuid not null references public.incidents(id) on delete cascade,
  org_id uuid not null references public.organizations(id) on delete cascade,
  message text not null,
  created_at timestamptz not null default now()
);
create table public.report_schedules (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  recipients text[] not null default '{}',
  frequency text not null default 'daily' check (frequency in ('daily','weekly','monthly')),
  send_hour int not null default 7 check (send_hour between 0 and 23),
  timezone text not null default 'Africa/Lubumbashi',
  enabled boolean not null default true,
  created_at timestamptz not null default now()
);
create table public.activity_logs (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid,
  action text not null,
  details jsonb,
  created_at timestamptz not null default now()
);

grant select, insert, update, delete on public.monitors, public.incidents, public.incident_events, public.report_schedules to authenticated;
grant select on public.checks, public.activity_logs to authenticated;
grant insert on public.activity_logs to authenticated;
grant all on public.monitors, public.checks, public.incidents, public.incident_events, public.report_schedules, public.activity_logs to service_role;

alter table public.monitors enable row level security;
alter table public.checks enable row level security;
alter table public.incidents enable row level security;
alter table public.incident_events enable row level security;
alter table public.report_schedules enable row level security;
alter table public.activity_logs enable row level security;

create policy "read" on public.monitors for select to authenticated using (public.is_org_member(org_id, auth.uid()));
create policy "ins" on public.monitors for insert to authenticated with check (public.can_edit_org(org_id, auth.uid()));
create policy "upd" on public.monitors for update to authenticated using (public.can_edit_org(org_id, auth.uid()));
create policy "del" on public.monitors for delete to authenticated using (public.can_edit_org(org_id, auth.uid()));
create policy "read" on public.checks for select to authenticated using (public.is_org_member(org_id, auth.uid()));
create policy "read" on public.incidents for select to authenticated using (public.is_org_member(org_id, auth.uid()));
create policy "ins" on public.incidents for insert to authenticated with check (public.can_edit_org(org_id, auth.uid()));
create policy "upd" on public.incidents for update to authenticated using (public.can_edit_org(org_id, auth.uid()));
create policy "read" on public.incident_events for select to authenticated using (public.is_org_member(org_id, auth.uid()));
create policy "ins" on public.incident_events for insert to authenticated with check (public.can_edit_org(org_id, auth.uid()));
create policy "read" on public.report_schedules for select to authenticated using (public.is_org_member(org_id, auth.uid()));
create policy "upd" on public.report_schedules for update to authenticated using (public.is_org_admin(org_id, auth.uid()));
create policy "read" on public.activity_logs for select to authenticated using (public.is_org_admin(org_id, auth.uid()));
create policy "ins" on public.activity_logs for insert to authenticated with check (public.is_org_member(org_id, auth.uid()) and user_id = auth.uid());

create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();