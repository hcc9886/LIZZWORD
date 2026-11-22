-- LIZZWORD · 学习事件表（漏斗与周报的服务端落库）
-- 在 Supabase SQL Editor 里执行；RLS 只允许用户写入自己的行。

create table if not exists public.learning_events (
  id bigserial primary key,
  user_id uuid references auth.users (id) on delete cascade,
  event_type text not null,
  payload jsonb not null default '{}'::jsonb,
  client_ts timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists learning_events_user_idx on public.learning_events (user_id, created_at desc);
create index if not exists learning_events_type_idx on public.learning_events (event_type, created_at desc);

alter table public.learning_events enable row level security;

drop policy if exists "insert own events" on public.learning_events;
create policy "insert own events" on public.learning_events
  for insert to authenticated
  with check (user_id = auth.uid());

drop policy if exists "read own events" on public.learning_events;
create policy "read own events" on public.learning_events
  for select to authenticated
  using (user_id = auth.uid());

-- 漏斗视图：按事件类型统计近 30 天
create or replace view public.event_funnel as
select event_type, count(*) as total, count(distinct user_id) as users
from public.learning_events
where created_at > now() - interval '30 days'
group by event_type
order by total desc;

-- 权益表：plan 只能由服务端写入（前端只读）
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  plan text not null default 'free' check (plan in ('free', 'trial', 'plus', 'pro', 'team')),
  plan_expires_at timestamptz,
  invite_code text,
  student_verified boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "read own profile" on public.profiles;
create policy "read own profile" on public.profiles
  for select to authenticated
  using (id = auth.uid());

-- 注意：不要在客户端写 profiles.plan；由 Edge Function / webhook 用 service_role 写。

-- 班级与成员（教师端多设备共享）
create table if not exists public.classes (
  code text primary key,
  name text not null default '',
  students jsonb not null default '[]'::jsonb,
  assignments jsonb not null default '[]'::jsonb,
  owner_id uuid references auth.users (id) on delete set null,
  updated_at timestamptz not null default now()
);

create table if not exists public.class_members (
  code text references public.classes (code) on delete cascade,
  user_id uuid references auth.users (id) on delete cascade,
  learned integer not null default 0,
  updated_at timestamptz not null default now(),
  primary key (code, user_id)
);

alter table public.classes enable row level security;
alter table public.class_members enable row level security;

create policy "teacher manage own class" on public.classes
  for all to authenticated using (owner_id = auth.uid()) with check (owner_id = auth.uid());

create policy "members read joined class" on public.classes
  for select to authenticated using (true);

create policy "member upsert self" on public.class_members
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "teacher reads members" on public.class_members
  for select to authenticated using (
    exists (select 1 from public.classes c where c.code = class_members.code and c.owner_id = auth.uid())
  );
