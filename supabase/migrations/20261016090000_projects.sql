-- ─────────────────────────────────────────────────────────────────────────────
-- Phase 5: project management — milestones, client-visible updates,
-- notification preferences, manual project creation, and portal access.
--
-- What a client (portal member) can read:
--   * projects of clients they belong to (existing policy),
--   * milestones of those projects marked client_visible,
--   * project updates of those projects that are published.
-- Internal notes live in internal_notes and are never reachable by clients.
-- ─────────────────────────────────────────────────────────────────────────────

alter table public.business_settings
  add column notify_client_updates boolean not null default true,
  add column notify_client_milestones boolean not null default true;

-- Membership check through the project's client (SECURITY DEFINER avoids RLS recursion).
create or replace function public.is_project_member(target_project_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.projects p
    join public.client_members m on m.client_id = p.client_id
    where p.id = target_project_id and m.user_id = auth.uid()
  );
$$;

-- ── Milestones ──────────────────────────────────────────────────────────────

create table public.milestones (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  title text not null check (char_length(title) between 1 and 200),
  description text check (char_length(description) <= 2000),
  due_date date,
  completed_at timestamptz,
  client_visible boolean not null default true,
  position integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index milestones_project_idx on public.milestones (project_id, position);
create index milestones_due_idx on public.milestones (due_date) where completed_at is null;

create trigger milestones_set_updated_at
before update on public.milestones
for each row execute function public.set_updated_at();

create trigger milestones_audit after insert or update or delete on public.milestones
for each row execute function public.audit_row();

-- ── Client-visible project updates ──────────────────────────────────────────

create table public.project_updates (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  title text check (char_length(title) <= 200),
  body text not null check (char_length(body) between 1 and 10000),
  published_at timestamptz,
  notified_at timestamptz,
  author_id uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.project_updates is
  'Updates written FOR the client. Private notes belong in internal_notes, never here.';

create index project_updates_project_idx on public.project_updates (project_id, created_at desc);

create trigger project_updates_set_updated_at
before update on public.project_updates
for each row execute function public.set_updated_at();

create trigger project_updates_audit after insert or update or delete on public.project_updates
for each row execute function public.audit_row();

-- ── Manual project creation (admin) ─────────────────────────────────────────

create or replace function public.create_project(
  p_client_id uuid,
  p_title text,
  p_status_key text,
  p_currency text,
  p_description text default null,
  p_service_slug text default null,
  p_value_minor bigint default null,
  p_start_date date default null,
  p_target_date date default null
)
returns table (project_id uuid, project_ref text)
language plpgsql
security invoker
set search_path = ''
as $$
declare
  p public.projects;
  prefix text;
begin
  if not public.is_admin() then
    raise exception 'not authorised' using errcode = '42501';
  end if;
  if p_start_date is not null and p_target_date is not null and p_target_date < p_start_date then
    raise exception 'target date is before start date' using errcode = '22023';
  end if;
  select project_prefix into prefix from public.business_settings where id;
  insert into public.projects (ref, client_id, title, description, service_slug, status_key, value_minor,
                               currency, start_date, target_date, created_by)
  values (public.format_business_number('project', coalesce(prefix, 'RB')), p_client_id, p_title,
          nullif(p_description, ''), nullif(p_service_slug, ''), p_status_key, p_value_minor, p_currency,
          p_start_date, p_target_date, auth.uid())
  returning * into p;
  insert into public.activities (subject_type, subject_id, kind, summary, actor_id)
  values ('project', p.id, 'project_created', 'Project created', auth.uid());
  return query select p.id, p.ref;
end;
$$;

alter table public.projects
  add constraint projects_dates_order check (target_date is null or start_date is null or target_date >= start_date);

-- ── Row Level Security ──────────────────────────────────────────────────────

alter table public.milestones enable row level security;
alter table public.project_updates enable row level security;

create policy "milestones: admin full access" on public.milestones
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "milestones: members read visible" on public.milestones
  for select to authenticated using (client_visible and public.is_project_member(project_id));

create policy "project_updates: admin full access" on public.project_updates
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "project_updates: members read published" on public.project_updates
  for select to authenticated using (published_at is not null and public.is_project_member(project_id));

revoke all on public.milestones, public.project_updates from anon;
revoke execute on function public.create_project(uuid, text, text, text, text, text, bigint, date, date) from public, anon;
grant execute on function public.create_project(uuid, text, text, text, text, text, bigint, date, date) to authenticated;
grant execute on function public.is_project_member(uuid) to authenticated;

-- ── Email templates for client notifications ────────────────────────────────

insert into public.email_templates (key, name, category, description, subject, body, is_system) values
(
  'portal_invitation', 'Client area invitation', 'system',
  'Sent when you give a client access to the client area.',
  'Your client area for {{business_name}}',
  E'Hi {{first_name}},\n\nYou now have access to your client area, where you can follow project progress, milestones and updates.\n\nSign in here: {{portal_link}}\n\nThere''s no password: enter this email address and you''ll receive a one-time sign-in code.\n\nBest regards,\nRashed\n{{business_name}}',
  true
),
(
  'project_status_changed', 'Project status changed', 'system',
  'Sent when you change a project''s status and choose to notify the client.',
  '{{project_title}}: {{project_status}}',
  E'Hi {{first_name}},\n\nA quick update on {{project_title}} ({{project_reference}}): the project status is now "{{project_status}}".\n\nYou can see the latest progress in your client area: {{portal_link}}\n\nBest regards,\nRashed\n{{business_name}}',
  true
),
(
  'project_update_posted', 'New project update', 'system',
  'Sent when you publish a project update and choose to notify the client.',
  'Update on {{project_title}}',
  E'Hi {{first_name}},\n\nThere''s a new update on {{project_title}} ({{project_reference}}):\n\n{{update_body}}\n\nSee all updates in your client area: {{portal_link}}\n\nBest regards,\nRashed\n{{business_name}}',
  true
),
(
  'milestone_completed', 'Milestone completed', 'system',
  'Sent when you complete a client-visible milestone and choose to notify the client.',
  'Milestone completed: {{milestone_title}}',
  E'Hi {{first_name}},\n\nGood news: "{{milestone_title}}" is complete on {{project_title}} ({{project_reference}}).\n\nYou can follow the remaining milestones in your client area: {{portal_link}}\n\nBest regards,\nRashed\n{{business_name}}',
  true
)
on conflict (key) do nothing;

-- ── Portal invitations (service role) ───────────────────────────────────────

-- Finds an auth user id by email for the invitation flow. Server-only.
create or replace function public.find_user_id_by_email(p_email text)
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select id from auth.users where lower(email) = lower(p_email) limit 1;
$$;

revoke execute on function public.find_user_id_by_email(text) from public, anon, authenticated;
grant execute on function public.find_user_id_by_email(text) to service_role;
