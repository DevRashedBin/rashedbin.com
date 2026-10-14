-- ─────────────────────────────────────────────────────────────────────────────
-- Foundation: identity, roles, clients, business settings, numbering, audit.
--
-- Security model
--   * Every table has Row Level Security enabled. Nothing is reachable through
--     the API unless a policy allows it.
--   * Admin access requires role = 'admin' in profiles AND a session that has
--     passed TOTP verification (JWT claim aal = 'aal2'). An admin password alone
--     grants nothing at the database level.
--   * Clients see only the client records they are members of, and never
--     internal notes, audit entries or business settings.
--   * Roles can only be changed by privileged database roles (the admin
--     bootstrap script uses the service role); never through the API.
-- ─────────────────────────────────────────────────────────────────────────────

-- ── Helpers ─────────────────────────────────────────────────────────────────

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- ── Profiles & roles ────────────────────────────────────────────────────────

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role text not null default 'client' check (role in ('admin', 'client')),
  full_name text check (char_length(full_name) <= 200),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.profiles is 'One row per auth user. role is changed only by privileged roles.';

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

-- Create a profile for every new auth user. New users are always clients;
-- promotion to admin happens only through the bootstrap script.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, role, full_name)
  values (new.id, 'client', nullif(new.raw_user_meta_data ->> 'full_name', ''));
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- Block role changes from API roles, even if a future policy allowed updates.
-- Not SECURITY DEFINER, so current_user is the calling API role.
create or replace function public.prevent_role_escalation()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.role is distinct from old.role
     and current_user in ('anon', 'authenticated') then
    raise exception 'role changes are not permitted' using errcode = '42501';
  end if;
  return new;
end;
$$;

create trigger profiles_prevent_role_escalation
before update on public.profiles
for each row execute function public.prevent_role_escalation();

-- True only for an admin whose current session passed MFA.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce((auth.jwt() ->> 'aal') = 'aal2', false)
     and exists (
       select 1 from public.profiles p
       where p.id = auth.uid() and p.role = 'admin'
     );
$$;

-- ── Clients ─────────────────────────────────────────────────────────────────

create table public.clients (
  id uuid primary key default gen_random_uuid(),
  display_name text not null check (char_length(display_name) between 1 and 200),
  company_name text check (char_length(company_name) <= 200),
  contact_name text check (char_length(contact_name) <= 200),
  billing_email text not null check (
    char_length(billing_email) <= 254
    and billing_email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'
  ),
  phone text check (char_length(phone) <= 50),
  website_url text check (char_length(website_url) <= 300),
  billing_address text check (char_length(billing_address) <= 1000),
  country_code text check (country_code ~ '^[A-Z]{2}$'),
  tax_id text check (char_length(tax_id) <= 100),
  default_currency text not null default 'USD' check (default_currency in ('USD', 'GBP', 'EUR', 'BDT')),
  archived_at timestamptz,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.clients is
  'Client billing entities. Must not hold internal-only fields: members can read every column.';

-- One active client per billing email prevents duplicate client records.
create unique index clients_billing_email_active_key
  on public.clients (lower(billing_email))
  where archived_at is null;

create index clients_display_name_idx on public.clients (lower(display_name));

create trigger clients_set_updated_at
before update on public.clients
for each row execute function public.set_updated_at();

-- Portal users linked to a client. One user may belong to several clients.
create table public.client_members (
  client_id uuid not null references public.clients (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (client_id, user_id)
);

create index client_members_user_id_idx on public.client_members (user_id);

create or replace function public.is_client_member(target_client_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.client_members m
    where m.client_id = target_client_id and m.user_id = auth.uid()
  );
$$;

-- ── Internal notes (admin only) ─────────────────────────────────────────────

create table public.internal_notes (
  id uuid primary key default gen_random_uuid(),
  subject_type text not null check (subject_type in ('client', 'lead', 'project')),
  subject_id uuid not null,
  body text not null check (char_length(body) between 1 and 10000),
  author_id uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

comment on table public.internal_notes is
  'Private notes. Kept separate from client-visible tables so no client policy can expose them.';

create index internal_notes_subject_idx on public.internal_notes (subject_type, subject_id, created_at desc);

-- ── Business settings (single row) ──────────────────────────────────────────

create table public.business_settings (
  id boolean primary key default true check (id),
  business_name text not null default 'Rashed' check (char_length(business_name) between 1 and 200),
  legal_name text check (char_length(legal_name) <= 200),
  contact_email text check (contact_email is null or contact_email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  phone text check (char_length(phone) <= 50),
  address text check (char_length(address) <= 1000),
  website text check (char_length(website) <= 300),
  tax_id text check (char_length(tax_id) <= 100),
  default_currency text not null default 'USD' check (default_currency in ('USD', 'GBP', 'EUR', 'BDT')),
  invoice_prefix text not null default 'INV' check (invoice_prefix ~ '^[A-Z0-9]{1,10}$'),
  project_prefix text not null default 'RB' check (project_prefix ~ '^[A-Z0-9]{1,10}$'),
  number_padding smallint not null default 4 check (number_padding between 3 and 8),
  default_payment_terms_days smallint not null default 14 check (default_payment_terms_days between 0 and 365),
  invoice_footer text check (char_length(invoice_footer) <= 2000),
  default_terms text check (char_length(default_terms) <= 5000),
  updated_by uuid references auth.users (id) on delete set null,
  updated_at timestamptz not null default now()
);

insert into public.business_settings (id) values (true);

create trigger business_settings_set_updated_at
before update on public.business_settings
for each row execute function public.set_updated_at();

-- ── Business numbering ──────────────────────────────────────────────────────

create table public.number_sequences (
  scope text not null check (scope in ('invoice', 'project', 'lead', 'receipt')),
  year integer not null check (year between 2000 and 2999),
  last_value integer not null default 0 check (last_value >= 0),
  primary key (scope, year)
);

-- Returns the next number for a scope and year. Concurrency-safe: the upsert
-- takes a row lock, so two callers can never receive the same value.
create or replace function public.next_sequence_value(p_scope text, p_year integer)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v integer;
begin
  -- Inside SECURITY DEFINER, current_user is the owner, so authorise on the
  -- API role from the request JWT. Direct database sessions (migrations,
  -- maintenance) carry no JWT claims and are already privileged.
  if not (
    public.is_admin()
    or auth.role() = 'service_role'
    or current_setting('request.jwt.claims', true) is null
    or current_setting('request.jwt.claims', true) = ''
  ) then
    raise exception 'not authorised' using errcode = '42501';
  end if;
  insert into public.number_sequences as s (scope, year, last_value)
  values (p_scope, p_year, 1)
  on conflict (scope, year) do update set last_value = s.last_value + 1
  returning s.last_value into v;
  return v;
end;
$$;

-- ── Audit log (append-only) ─────────────────────────────────────────────────

create table public.audit_log (
  id bigint generated always as identity primary key,
  occurred_at timestamptz not null default now(),
  actor_id uuid,
  actor_role text not null default current_user,
  action text not null,
  table_name text not null,
  record_id text,
  old_data jsonb,
  new_data jsonb
);

create index audit_log_occurred_at_idx on public.audit_log (occurred_at desc);
create index audit_log_record_idx on public.audit_log (table_name, record_id);

create or replace function public.audit_row()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  rec jsonb := case when tg_op = 'DELETE' then to_jsonb(old) else to_jsonb(new) end;
begin
  insert into public.audit_log (actor_id, actor_role, action, table_name, record_id, old_data, new_data)
  values (
    auth.uid(),
    current_user,
    tg_op,
    tg_table_name,
    coalesce(rec ->> 'id', rec ->> 'client_id'),
    case when tg_op in ('UPDATE', 'DELETE') then to_jsonb(old) end,
    case when tg_op in ('INSERT', 'UPDATE') then to_jsonb(new) end
  );
  return null;
end;
$$;

-- Nobody, including the service role, may rewrite history through SQL.
create or replace function public.audit_log_immutable()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  raise exception 'audit_log is append-only' using errcode = '42501';
end;
$$;

create trigger audit_log_no_update
before update or delete on public.audit_log
for each row execute function public.audit_log_immutable();

create trigger audit_log_no_truncate
before truncate on public.audit_log
for each statement execute function public.audit_log_immutable();

create trigger profiles_audit after insert or update or delete on public.profiles
for each row execute function public.audit_row();
create trigger clients_audit after insert or update or delete on public.clients
for each row execute function public.audit_row();
create trigger client_members_audit after insert or update or delete on public.client_members
for each row execute function public.audit_row();
create trigger business_settings_audit after update on public.business_settings
for each row execute function public.audit_row();
create trigger internal_notes_audit after insert or delete on public.internal_notes
for each row execute function public.audit_row();

-- ── Row Level Security ──────────────────────────────────────────────────────

alter table public.profiles enable row level security;
alter table public.clients enable row level security;
alter table public.client_members enable row level security;
alter table public.internal_notes enable row level security;
alter table public.business_settings enable row level security;
alter table public.number_sequences enable row level security;
alter table public.audit_log enable row level security;

-- profiles
create policy "profiles: read own" on public.profiles
  for select to authenticated using (id = auth.uid());
create policy "profiles: admin read all" on public.profiles
  for select to authenticated using (public.is_admin());
create policy "profiles: update own name" on public.profiles
  for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

-- clients
create policy "clients: admin full access" on public.clients
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "clients: members read" on public.clients
  for select to authenticated using (public.is_client_member(id));

-- client_members
create policy "client_members: admin full access" on public.client_members
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "client_members: read own" on public.client_members
  for select to authenticated using (user_id = auth.uid());

-- internal_notes, business_settings, audit_log: admin only
create policy "internal_notes: admin full access" on public.internal_notes
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "business_settings: admin read" on public.business_settings
  for select to authenticated using (public.is_admin());
create policy "business_settings: admin update" on public.business_settings
  for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "audit_log: admin read" on public.audit_log
  for select to authenticated using (public.is_admin());
-- number_sequences: no policies; accessed only via next_sequence_value().

-- ── Privileges (defence in depth on top of RLS) ─────────────────────────────

revoke all on public.profiles, public.clients, public.client_members, public.internal_notes,
  public.business_settings, public.number_sequences, public.audit_log from anon;
revoke all on public.number_sequences from authenticated;
revoke insert, update, delete, truncate on public.audit_log from authenticated;
revoke insert, delete, truncate on public.business_settings from authenticated;
revoke insert, delete, truncate on public.profiles from authenticated;
-- Users may only edit their own display name, never their role.
revoke update on public.profiles from authenticated;
grant update (full_name) on public.profiles to authenticated;

revoke execute on function public.next_sequence_value(text, integer) from public, anon;
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.audit_row() from public, anon, authenticated;
grant execute on function public.is_admin() to authenticated;
grant execute on function public.is_client_member(uuid) to authenticated;
grant execute on function public.next_sequence_value(text, integer) to authenticated;
