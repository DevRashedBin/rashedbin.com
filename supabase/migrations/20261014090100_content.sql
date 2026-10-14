-- ─────────────────────────────────────────────────────────────────────────────
-- Public website content editable from the admin dashboard.
-- Published rows are readable by everyone; only an MFA-verified admin can
-- read drafts or make changes. Structured fields are validated in the app with
-- Zod; the database enforces shapes that must never be wrong.
-- ─────────────────────────────────────────────────────────────────────────────

create table public.services (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) <= 80),
  position integer not null default 0,
  published boolean not null default false,
  name text not null check (char_length(name) between 1 and 120),
  short_name text not null check (char_length(short_name) between 1 and 40),
  summary text not null check (char_length(summary) between 1 and 200),
  meta_title text not null check (char_length(meta_title) between 1 and 70),
  meta_description text not null check (char_length(meta_description) between 50 and 170),
  eyebrow text not null check (char_length(eyebrow) between 1 and 80),
  headline text not null check (char_length(headline) between 1 and 160),
  intro text not null check (char_length(intro) between 1 and 600),
  problems jsonb not null default '[]' check (jsonb_typeof(problems) = 'array'),
  deliverables jsonb not null default '[]' check (jsonb_typeof(deliverables) = 'array'),
  approach jsonb not null default '[]' check (jsonb_typeof(approach) = 'array'),
  ideal_for jsonb not null default '[]' check (jsonb_typeof(ideal_for) = 'array'),
  faqs jsonb not null default '[]' check (jsonb_typeof(faqs) = 'array'),
  related jsonb not null default '[]' check (jsonb_typeof(related) = 'array'),
  demo text not null check (demo in (
    'blueprint', 'before-after', 'editable-blocks', 'bug-trace',
    'crawl-index', 'security-layers', 'vitals', 'checkout-flow'
  )),
  cta jsonb not null check (jsonb_typeof(cta) = 'object'),
  updated_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index services_position_idx on public.services (position);

create trigger services_set_updated_at
before update on public.services
for each row execute function public.set_updated_at();

create trigger services_audit after insert or update or delete on public.services
for each row execute function public.audit_row();

create table public.faqs (
  id uuid primary key default gen_random_uuid(),
  scope text not null default 'general' check (scope in ('general')),
  question text not null check (char_length(question) between 1 and 200),
  answer text not null check (char_length(answer) between 1 and 2000),
  position integer not null default 0,
  published boolean not null default true,
  updated_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index faqs_scope_position_idx on public.faqs (scope, position);

create trigger faqs_set_updated_at
before update on public.faqs
for each row execute function public.set_updated_at();

create trigger faqs_audit after insert or update or delete on public.faqs
for each row execute function public.audit_row();

alter table public.services enable row level security;
alter table public.faqs enable row level security;

create policy "services: public read published" on public.services
  for select to anon, authenticated using (published);
create policy "services: admin full access" on public.services
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "faqs: public read published" on public.faqs
  for select to anon, authenticated using (published);
create policy "faqs: admin full access" on public.faqs
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

revoke insert, update, delete, truncate on public.services, public.faqs from anon;

-- Replace the general FAQ list atomically (delete + insert in one transaction).
-- SECURITY INVOKER: runs with the caller's rights, so RLS still requires an
-- MFA-verified admin.
create or replace function public.replace_general_faqs(items jsonb)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'not authorised' using errcode = '42501';
  end if;
  if jsonb_typeof(items) <> 'array' then
    raise exception 'items must be an array' using errcode = '22023';
  end if;
  delete from public.faqs where scope = 'general';
  insert into public.faqs (scope, question, answer, position, updated_by)
  select 'general', i.question, i.answer, i.ord::integer, auth.uid()
  from jsonb_to_recordset(items) with ordinality as i(question text, answer text, ord bigint);
end;
$$;

revoke execute on function public.replace_general_faqs(jsonb) from public, anon;
grant execute on function public.replace_general_faqs(jsonb) to authenticated;
