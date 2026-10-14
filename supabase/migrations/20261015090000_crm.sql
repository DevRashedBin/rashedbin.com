-- ─────────────────────────────────────────────────────────────────────────────
-- Phase 4: CRM — leads, consent, drafts, activity, email, rate limits, and the
-- minimal project records needed to convert a lead into a project.
--
-- Access model
--   * Admin (MFA-verified) reads and manages everything through RLS.
--   * Public inquiry intake, email delivery, webhooks and scheduled jobs run on
--     the server with the service role through the functions below; anonymous
--     and client sessions have no access to any of these tables.
-- ─────────────────────────────────────────────────────────────────────────────

-- ── Settings additions ──────────────────────────────────────────────────────

alter table public.business_settings
  add column notification_email text check (notification_email is null or notification_email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  add column consultation_url text check (char_length(consultation_url) <= 300);

update public.business_settings
set contact_email = coalesce(contact_email, 'hello@rashedbin.com'),
    notification_email = coalesce(notification_email, 'hello@rashedbin.com'),
    website = coalesce(website, 'https://rashedbin.com');

-- ── Pipeline stages (configurable labels and order) ─────────────────────────

create table public.pipeline_stages (
  key text primary key check (key ~ '^[a-z0-9_]{1,40}$'),
  label text not null check (char_length(label) between 1 and 60),
  position integer not null default 0,
  kind text not null default 'open' check (kind in ('incomplete', 'open', 'won', 'lost')),
  is_system boolean not null default false,
  updated_at timestamptz not null default now()
);

insert into public.pipeline_stages (key, label, position, kind, is_system) values
  ('new', 'New Inquiry', 10, 'open', true),
  ('incomplete', 'Incomplete Inquiry', 20, 'incomplete', true),
  ('contacted', 'Contacted', 30, 'open', false),
  ('qualified', 'Qualified', 40, 'open', false),
  ('proposal_sent', 'Proposal Sent', 50, 'open', false),
  ('awaiting_decision', 'Awaiting Client Decision', 60, 'open', false),
  ('won', 'Won', 70, 'won', true),
  ('lost', 'Lost', 80, 'lost', true);

create trigger pipeline_stages_set_updated_at
before update on public.pipeline_stages
for each row execute function public.set_updated_at();

-- System stages drive behaviour (intake, drafts, conversion, retention): they
-- can be renamed and reordered but never deleted or re-typed.
create or replace function public.protect_system_stages()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'DELETE' and old.is_system then
    raise exception 'system stages cannot be deleted' using errcode = '42501';
  end if;
  if tg_op = 'UPDATE' and old.is_system and (new.kind <> old.kind or new.key <> old.key or not new.is_system) then
    raise exception 'system stages cannot change key or type' using errcode = '42501';
  end if;
  return coalesce(new, old);
end;
$$;

create trigger pipeline_stages_protect
before update or delete on public.pipeline_stages
for each row execute function public.protect_system_stages();

-- ── Leads ───────────────────────────────────────────────────────────────────

create table public.leads (
  id uuid primary key default gen_random_uuid(),
  ref text not null unique,
  stage_key text not null default 'new' references public.pipeline_stages (key) on update cascade,
  priority text not null default 'normal' check (priority in ('low', 'normal', 'high', 'urgent')),
  name text not null check (char_length(name) between 1 and 200),
  email text not null check (char_length(email) <= 254),
  company text check (char_length(company) <= 200),
  website_url text check (char_length(website_url) <= 300),
  service_slug text check (char_length(service_slug) <= 80),
  service_label text check (char_length(service_label) <= 120),
  description text not null default '' check (char_length(description) <= 5000),
  details jsonb not null default '{}' check (jsonb_typeof(details) = 'object'),
  source text not null default 'website' check (source in ('website', 'manual')),
  submitted_at timestamptz,
  client_id uuid references public.clients (id) on delete set null,
  idempotency_key text unique check (char_length(idempotency_key) <= 100),
  ip_hash text check (char_length(ip_hash) <= 128),
  user_agent text check (char_length(user_agent) <= 500),
  last_activity_at timestamptz not null default now(),
  anonymised_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on column public.leads.submitted_at is 'NULL while the inquiry is an incomplete, saved draft.';

create index leads_email_idx on public.leads (lower(email));
create index leads_stage_idx on public.leads (stage_key, last_activity_at desc);
create index leads_created_idx on public.leads (created_at desc);

create trigger leads_set_updated_at
before update on public.leads
for each row execute function public.set_updated_at();

create trigger leads_audit after insert or update or delete on public.leads
for each row execute function public.audit_row();

-- Consent evidence (append-only in practice; removed only with the lead).
create table public.consent_records (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads (id) on delete cascade,
  purpose text not null check (purpose in ('inquiry_contact', 'save_and_resume')),
  notice_version text not null check (char_length(notice_version) <= 40),
  granted_at timestamptz not null default now(),
  ip_hash text,
  user_agent text,
  withdrawn_at timestamptz
);

create index consent_records_lead_idx on public.consent_records (lead_id);

-- Single-use links for finishing a saved inquiry. Only a SHA-256 hash is stored.
create table public.inquiry_resume_tokens (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads (id) on delete cascade,
  token_hash text not null unique check (char_length(token_hash) = 64),
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz not null default now()
);

create index inquiry_resume_tokens_lead_idx on public.inquiry_resume_tokens (lead_id);

-- ── Activity timeline ───────────────────────────────────────────────────────

create table public.activities (
  id uuid primary key default gen_random_uuid(),
  subject_type text not null check (subject_type in ('lead', 'client', 'project')),
  subject_id uuid not null,
  kind text not null check (char_length(kind) <= 60),
  summary text not null check (char_length(summary) <= 500),
  data jsonb not null default '{}',
  actor_id uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

create index activities_subject_idx on public.activities (subject_type, subject_id, created_at desc);

-- Polymorphic children of a lead are removed with it.
create or replace function public.cleanup_lead_children()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  delete from public.activities where subject_type = 'lead' and subject_id = old.id;
  delete from public.internal_notes where subject_type = 'lead' and subject_id = old.id;
  return old;
end;
$$;

create trigger leads_cleanup_children
after delete on public.leads
for each row execute function public.cleanup_lead_children();

-- ── Projects (minimal; Phase 5 adds milestones, updates and the UI) ─────────

create table public.project_statuses (
  key text primary key check (key ~ '^[a-z0-9_]{1,40}$'),
  label text not null check (char_length(label) between 1 and 60),
  client_label text not null check (char_length(client_label) between 1 and 60),
  position integer not null default 0,
  is_terminal boolean not null default false,
  notify_client_by_default boolean not null default false
);

insert into public.project_statuses (key, label, client_label, position, is_terminal, notify_client_by_default) values
  ('inquiry', 'Inquiry', 'Enquiry received', 10, false, false),
  ('awaiting_deposit', 'Awaiting Deposit', 'Awaiting deposit', 20, false, true),
  ('confirmed', 'Confirmed', 'Confirmed', 30, false, true),
  ('in_progress', 'In Progress', 'In progress', 40, false, true),
  ('awaiting_feedback', 'Awaiting Client Feedback', 'Waiting for your feedback', 50, false, true),
  ('revision', 'Revision', 'Revisions in progress', 60, false, true),
  ('final_delivery', 'Final Delivery', 'Final delivery', 70, false, true),
  ('completed', 'Completed', 'Completed', 80, true, true),
  ('on_hold', 'On Hold', 'On hold', 90, false, true);

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  ref text not null unique,
  client_id uuid not null references public.clients (id) on delete restrict,
  lead_id uuid unique references public.leads (id) on delete set null,
  title text not null check (char_length(title) between 1 and 200),
  description text check (char_length(description) <= 5000),
  service_slug text check (char_length(service_slug) <= 80),
  status_key text not null default 'inquiry' references public.project_statuses (key) on update cascade,
  value_minor bigint check (value_minor >= 0),
  currency text not null default 'USD' check (currency in ('USD', 'GBP', 'EUR', 'BDT')),
  start_date date,
  target_date date,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on column public.projects.lead_id is 'Unique: a lead converts into at most one project.';

create index projects_client_idx on public.projects (client_id);

create trigger projects_set_updated_at
before update on public.projects
for each row execute function public.set_updated_at();

create trigger projects_audit after insert or update or delete on public.projects
for each row execute function public.audit_row();

-- ── Email ───────────────────────────────────────────────────────────────────

create table public.email_templates (
  key text primary key check (key ~ '^[a-z0-9_]{1,60}$'),
  name text not null check (char_length(name) between 1 and 100),
  category text not null check (category in ('lead', 'system')),
  description text check (char_length(description) <= 300),
  subject text not null check (char_length(subject) between 1 and 200),
  body text not null check (char_length(body) between 1 and 10000),
  is_system boolean not null default false,
  updated_by uuid references auth.users (id) on delete set null,
  updated_at timestamptz not null default now()
);

create trigger email_templates_set_updated_at
before update on public.email_templates
for each row execute function public.set_updated_at();

create trigger email_templates_audit after insert or update or delete on public.email_templates
for each row execute function public.audit_row();

-- Outbox and log in one table. "sent" means the provider accepted the message;
-- delivery_status is only set from verified provider webhooks.
create table public.email_messages (
  id uuid primary key default gen_random_uuid(),
  idempotency_key text not null unique check (char_length(idempotency_key) <= 200),
  to_email text not null check (char_length(to_email) <= 254),
  from_email text not null check (char_length(from_email) <= 320),
  reply_to text check (char_length(reply_to) <= 320),
  subject text not null check (char_length(subject) <= 300),
  body_text text not null,
  template_key text,
  related_type text check (related_type in ('lead', 'client', 'project')),
  related_id uuid,
  status text not null default 'queued' check (status in ('queued', 'sending', 'sent', 'failed', 'suppressed')),
  status_reason text check (char_length(status_reason) <= 500),
  provider text,
  provider_message_id text,
  delivery_status text not null default 'unknown'
    check (delivery_status in ('unknown', 'delivered', 'delayed', 'bounced', 'complained')),
  attempts smallint not null default 0,
  next_attempt_at timestamptz,
  sent_at timestamptz,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index email_messages_related_idx on public.email_messages (related_type, related_id, created_at desc);
create index email_messages_status_idx on public.email_messages (status, next_attempt_at);
create index email_messages_provider_id_idx on public.email_messages (provider_message_id);
create index email_messages_created_idx on public.email_messages (created_at desc);

create trigger email_messages_set_updated_at
before update on public.email_messages
for each row execute function public.set_updated_at();

-- Verified provider webhook events; provider_event_id makes processing idempotent.
create table public.email_events (
  id uuid primary key default gen_random_uuid(),
  provider_event_id text not null unique,
  email_message_id uuid references public.email_messages (id) on delete set null,
  type text not null,
  payload jsonb not null,
  received_at timestamptz not null default now()
);

-- ── Rate limiting ───────────────────────────────────────────────────────────

create table public.rate_limits (
  bucket text not null check (char_length(bucket) <= 200),
  window_start timestamptz not null,
  count integer not null default 0,
  primary key (bucket, window_start)
);

-- Fixed-window counter. Returns true while the caller is within the limit.
create or replace function public.check_rate_limit(p_bucket text, p_limit integer, p_window_seconds integer)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  w timestamptz := to_timestamp(floor(extract(epoch from now()) / p_window_seconds) * p_window_seconds);
  c integer;
begin
  insert into public.rate_limits as r (bucket, window_start, count) values (p_bucket, w, 1)
  on conflict (bucket, window_start) do update set count = r.count + 1
  returning r.count into c;
  return c <= p_limit;
end;
$$;

-- ── Helpers ─────────────────────────────────────────────────────────────────

create or replace function public.format_business_number(p_scope text, p_prefix text)
returns text
language plpgsql
set search_path = ''
as $$
declare
  y integer := extract(year from now() at time zone 'utc')::integer;
  pad integer := coalesce((select number_padding from public.business_settings where id), 4);
begin
  return p_prefix || '-' || y || '-' || lpad(public.next_sequence_value(p_scope, y)::text, pad, '0');
end;
$$;

-- ── Inquiry intake (service role) ───────────────────────────────────────────

-- Saves or updates a draft inquiry after the visitor explicitly chose to save
-- it and consented. Returns the lead; refuses to touch a submitted inquiry.
create or replace function public.save_inquiry_draft(
  p_idempotency_key text,
  p_name text,
  p_email text,
  p_notice_version text,
  p_token_hash text,
  p_token_expires_at timestamptz,
  p_company text default null,
  p_website_url text default null,
  p_service_slug text default null,
  p_service_label text default null,
  p_description text default null,
  p_details jsonb default '{}',
  p_ip_hash text default null,
  p_user_agent text default null
)
returns table (lead_id uuid, lead_ref text, outcome text)
language plpgsql
set search_path = ''
as $$
declare
  l public.leads;
begin
  select * into l from public.leads where idempotency_key = p_idempotency_key for update;
  if found and l.submitted_at is not null then
    return query select l.id, l.ref, 'already_submitted'::text;
    return;
  end if;

  if found then
    update public.leads set
      name = p_name, email = lower(p_email), company = p_company, website_url = p_website_url,
      service_slug = p_service_slug, service_label = p_service_label,
      description = coalesce(p_description, ''), details = coalesce(p_details, '{}'),
      last_activity_at = now()
    where id = l.id
    returning * into l;
    update public.inquiry_resume_tokens set used_at = now() where inquiry_resume_tokens.lead_id = l.id and used_at is null;
  else
    insert into public.leads (ref, stage_key, name, email, company, website_url, service_slug, service_label,
                              description, details, idempotency_key, ip_hash, user_agent)
    values (public.format_business_number('lead', 'L'), 'incomplete', p_name, lower(p_email), p_company,
            p_website_url, p_service_slug, p_service_label, coalesce(p_description, ''),
            coalesce(p_details, '{}'), p_idempotency_key, p_ip_hash, p_user_agent)
    returning * into l;
  end if;

  insert into public.consent_records (lead_id, purpose, notice_version, ip_hash, user_agent)
  values (l.id, 'save_and_resume', p_notice_version, p_ip_hash, p_user_agent);

  insert into public.inquiry_resume_tokens (lead_id, token_hash, expires_at)
  values (l.id, p_token_hash, p_token_expires_at);

  insert into public.activities (subject_type, subject_id, kind, summary)
  values ('lead', l.id, 'draft_saved', 'Visitor saved an incomplete enquiry and asked for a link to finish it');

  return query select l.id, l.ref, 'saved'::text;
end;
$$;

-- Records a completed inquiry in one transaction. Outcomes:
--   created   — new lead
--   completed — a saved draft was completed (same idempotency key or resume token)
--   duplicate — a repeat of the same submission, or the same email + service
--               within 24 hours (logged on the existing lead instead)
create or replace function public.submit_inquiry(
  p_idempotency_key text,
  p_name text,
  p_email text,
  p_description text,
  p_notice_version text,
  p_company text default null,
  p_website_url text default null,
  p_service_slug text default null,
  p_service_label text default null,
  p_details jsonb default '{}',
  p_ip_hash text default null,
  p_user_agent text default null,
  p_resume_token_hash text default null
)
returns table (lead_id uuid, lead_ref text, outcome text)
language plpgsql
set search_path = ''
as $$
declare
  l public.leads;
  draft_id uuid;
begin
  -- 1. Exact replay of a submission that already succeeded.
  select * into l from public.leads where idempotency_key = p_idempotency_key and submitted_at is not null;
  if found then
    return query select l.id, l.ref, 'duplicate'::text;
    return;
  end if;

  -- 2. A saved draft being completed.
  if p_resume_token_hash is not null then
    select t.lead_id into draft_id from public.inquiry_resume_tokens t
    where t.token_hash = p_resume_token_hash and t.used_at is null and t.expires_at > now()
    for update;
  end if;
  if draft_id is null then
    select id into draft_id from public.leads where idempotency_key = p_idempotency_key and submitted_at is null;
  end if;

  -- 3. Same person, same service, within 24 hours: note it on the existing lead.
  if draft_id is null then
    select * into l from public.leads
    where lower(email) = lower(p_email)
      and service_slug is not distinct from p_service_slug
      and submitted_at > now() - interval '24 hours'
    order by submitted_at desc
    limit 1
    for update;
    if found then
      update public.leads set last_activity_at = now() where id = l.id;
      insert into public.activities (subject_type, subject_id, kind, summary, data)
      values ('lead', l.id, 'inquiry_repeated', 'The same person sent another enquiry for this service',
              jsonb_build_object('description', p_description, 'details', p_details));
      insert into public.consent_records (lead_id, purpose, notice_version, ip_hash, user_agent)
      values (l.id, 'inquiry_contact', p_notice_version, p_ip_hash, p_user_agent);
      return query select l.id, l.ref, 'duplicate'::text;
      return;
    end if;
  end if;

  if draft_id is not null then
    update public.leads set
      name = p_name, email = lower(p_email), company = p_company, website_url = p_website_url,
      service_slug = p_service_slug, service_label = p_service_label, description = p_description,
      details = coalesce(p_details, '{}'), submitted_at = now(),
      stage_key = case when stage_key = 'incomplete' then 'new' else stage_key end,
      idempotency_key = coalesce(idempotency_key, p_idempotency_key),
      last_activity_at = now()
    where id = draft_id
    returning * into l;
    update public.inquiry_resume_tokens set used_at = now() where inquiry_resume_tokens.lead_id = l.id and used_at is null;
    insert into public.activities (subject_type, subject_id, kind, summary)
    values ('lead', l.id, 'inquiry_completed', 'Visitor finished and submitted their saved enquiry');
    insert into public.consent_records (lead_id, purpose, notice_version, ip_hash, user_agent)
    values (l.id, 'inquiry_contact', p_notice_version, p_ip_hash, p_user_agent);
    return query select l.id, l.ref, 'completed'::text;
    return;
  end if;

  insert into public.leads (ref, stage_key, name, email, company, website_url, service_slug, service_label,
                            description, details, submitted_at, idempotency_key, ip_hash, user_agent)
  values (public.format_business_number('lead', 'L'), 'new', p_name, lower(p_email), p_company, p_website_url,
          p_service_slug, p_service_label, p_description, coalesce(p_details, '{}'), now(),
          p_idempotency_key, p_ip_hash, p_user_agent)
  returning * into l;

  insert into public.consent_records (lead_id, purpose, notice_version, ip_hash, user_agent)
  values (l.id, 'inquiry_contact', p_notice_version, p_ip_hash, p_user_agent);
  insert into public.activities (subject_type, subject_id, kind, summary)
  values ('lead', l.id, 'inquiry_submitted', 'Enquiry submitted through the website');

  return query select l.id, l.ref, 'created'::text;
end;
$$;

-- ── Lead → project conversion (admin) ───────────────────────────────────────

-- One action: find or create the client, create the project, mark the lead Won.
-- Safe to repeat: a lead converts into at most one project (unique lead_id plus
-- a row lock), and an existing active client with the same email is reused.
create or replace function public.convert_lead_to_project(
  p_lead_id uuid,
  p_title text,
  p_status_key text default 'awaiting_deposit',
  p_client_id uuid default null
)
returns table (project_id uuid, project_ref text, client_id uuid, created boolean)
language plpgsql
security invoker
set search_path = ''
as $$
declare
  l public.leads;
  p public.projects;
  c_id uuid;
  cur text;
  prefix text;
begin
  if not public.is_admin() then
    raise exception 'not authorised' using errcode = '42501';
  end if;

  select * into l from public.leads where id = p_lead_id for update;
  if not found then
    raise exception 'lead not found' using errcode = 'P0002';
  end if;
  if l.submitted_at is null then
    raise exception 'an incomplete enquiry cannot be converted' using errcode = '22023';
  end if;

  select * into p from public.projects where lead_id = l.id;
  if found then
    return query select p.id, p.ref, p.client_id, false;
    return;
  end if;

  c_id := coalesce(p_client_id, l.client_id);
  if c_id is null then
    select id into c_id from public.clients
    where lower(billing_email) = lower(l.email) and archived_at is null
    limit 1;
  end if;
  if c_id is null then
    cur := coalesce(nullif(l.details ->> 'currency', ''), (select default_currency from public.business_settings where id));
    if cur not in ('USD', 'GBP', 'EUR', 'BDT') then cur := 'USD'; end if;
    insert into public.clients (display_name, company_name, contact_name, billing_email, website_url, default_currency, created_by)
    values (coalesce(nullif(l.company, ''), l.name), nullif(l.company, ''), l.name, lower(l.email), l.website_url, cur, auth.uid())
    returning id into c_id;
    insert into public.activities (subject_type, subject_id, kind, summary, actor_id)
    values ('client', c_id, 'client_created', 'Client created from enquiry ' || l.ref, auth.uid());
  end if;

  select project_prefix into prefix from public.business_settings where id;
  insert into public.projects (ref, client_id, lead_id, title, description, service_slug, status_key, currency, created_by)
  values (
    public.format_business_number('project', coalesce(prefix, 'RB')),
    c_id, l.id, p_title, nullif(l.description, ''), l.service_slug, p_status_key,
    coalesce((select default_currency from public.clients where id = c_id), 'USD'),
    auth.uid()
  )
  returning * into p;

  update public.leads set client_id = c_id, stage_key = 'won', last_activity_at = now() where id = l.id;

  insert into public.activities (subject_type, subject_id, kind, summary, data, actor_id) values
    ('lead', l.id, 'converted', 'Converted to project ' || p.ref, jsonb_build_object('project_id', p.id), auth.uid()),
    ('project', p.id, 'project_created', 'Project created from enquiry ' || l.ref, jsonb_build_object('lead_id', l.id), auth.uid());

  return query select p.id, p.ref, c_id, true;
end;
$$;

-- ── Retention (scheduled, service role) ─────────────────────────────────────

create or replace function public.purge_expired_data()
returns jsonb
language plpgsql
set search_path = ''
as $$
declare
  drafts integer;
  anonymised integer;
  tokens integer;
  limits integer;
begin
  -- Saved but never finished enquiries: 90 days.
  delete from public.leads where submitted_at is null and created_at < now() - interval '90 days';
  get diagnostics drafts = row_count;

  -- Lost enquiries with no activity for 24 months are anonymised.
  update public.leads set
    name = 'Anonymised', email = 'anonymised+' || id || '@invalid.example', company = null, website_url = null,
    description = '', details = '{}', ip_hash = null, user_agent = null, anonymised_at = now()
  where stage_key in (select key from public.pipeline_stages where kind = 'lost')
    and anonymised_at is null and client_id is null
    and last_activity_at < now() - interval '24 months';
  get diagnostics anonymised = row_count;
  update public.consent_records set ip_hash = null, user_agent = null
  where lead_id in (select id from public.leads where anonymised_at is not null);
  delete from public.activities a using public.leads l
  where a.subject_type = 'lead' and a.subject_id = l.id and l.anonymised_at is not null and a.kind = 'inquiry_repeated';

  delete from public.inquiry_resume_tokens where expires_at < now() - interval '30 days';
  get diagnostics tokens = row_count;
  delete from public.rate_limits where window_start < now() - interval '1 day';
  get diagnostics limits = row_count;

  return jsonb_build_object('drafts_deleted', drafts, 'leads_anonymised', anonymised,
                            'tokens_deleted', tokens, 'rate_limit_rows_deleted', limits);
end;
$$;

-- ── Row Level Security ──────────────────────────────────────────────────────

alter table public.pipeline_stages enable row level security;
alter table public.leads enable row level security;
alter table public.consent_records enable row level security;
alter table public.inquiry_resume_tokens enable row level security;
alter table public.activities enable row level security;
alter table public.project_statuses enable row level security;
alter table public.projects enable row level security;
alter table public.email_templates enable row level security;
alter table public.email_messages enable row level security;
alter table public.email_events enable row level security;
alter table public.rate_limits enable row level security;

create policy "pipeline_stages: admin full access" on public.pipeline_stages
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "leads: admin full access" on public.leads
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "consent_records: admin read" on public.consent_records
  for select to authenticated using (public.is_admin());
create policy "activities: admin full access" on public.activities
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "project_statuses: signed-in read" on public.project_statuses
  for select to authenticated using (true);
create policy "project_statuses: admin manage" on public.project_statuses
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "projects: admin full access" on public.projects
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "projects: members read" on public.projects
  for select to authenticated using (public.is_client_member(client_id));
create policy "email_templates: admin full access" on public.email_templates
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "email_messages: admin read" on public.email_messages
  for select to authenticated using (public.is_admin());
-- inquiry_resume_tokens, email_events, rate_limits: no policies (service role only).

revoke all on public.pipeline_stages, public.leads, public.consent_records, public.inquiry_resume_tokens,
  public.activities, public.project_statuses, public.projects, public.email_templates, public.email_messages,
  public.email_events, public.rate_limits from anon;
revoke all on public.inquiry_resume_tokens, public.email_events, public.rate_limits from authenticated;
revoke insert, update, delete, truncate on public.consent_records, public.email_messages from authenticated;

revoke execute on function public.check_rate_limit(text, integer, integer) from public, anon, authenticated;
revoke execute on function public.save_inquiry_draft(text, text, text, text, text, timestamptz, text, text, text, text, text, jsonb, text, text) from public, anon, authenticated;
revoke execute on function public.submit_inquiry(text, text, text, text, text, text, text, text, text, jsonb, text, text, text) from public, anon, authenticated;
revoke execute on function public.purge_expired_data() from public, anon, authenticated;
revoke execute on function public.format_business_number(text, text) from public, anon;
revoke execute on function public.cleanup_lead_children() from public, anon, authenticated;
revoke execute on function public.convert_lead_to_project(uuid, text, text, uuid) from public, anon;
grant execute on function public.check_rate_limit(text, integer, integer) to service_role;
grant execute on function public.save_inquiry_draft(text, text, text, text, text, timestamptz, text, text, text, text, text, jsonb, text, text) to service_role;
grant execute on function public.submit_inquiry(text, text, text, text, text, text, text, text, text, jsonb, text, text, text) to service_role;
grant execute on function public.purge_expired_data() to service_role;
grant execute on function public.convert_lead_to_project(uuid, text, text, uuid) to authenticated;
