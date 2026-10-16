-- Scenarios (Bear / Base / Bull): immutable saved versions plus one autosaved draft per company,
-- the same shape as research notes.

-- A saved version never changes. There are deliberately no update/delete policies below, so the
-- anon role (and any future role we forget to restrict) can only add versions, not rewrite history.
create table public.scenario_versions (
  id         uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id) on delete cascade,
  version    int  not null check (version > 0),
  -- The whole scenario, validated in the app: method, probabilities, target year and the quarterly and yearly
  -- grids for each case. Amounts inside are integer paise, never floats.
  data       jsonb not null check (jsonb_typeof(data) = 'object'),
  created_at timestamptz not null default now(),
  unique (company_id, version)
);

-- The work in progress. At most one per company, so the primary key is the company. It holds the text as typed
-- (half-typed numbers included), so it is only checked to be an object; a saved version is validated in full.
create table public.scenario_drafts (
  company_id       uuid primary key references public.companies (id) on delete cascade,
  data             jsonb not null check (jsonb_typeof(data) = 'object'),
  -- The saved version this draft was started from; null when the company has no saved version yet.
  based_on_version int check (based_on_version > 0),
  updated_at       timestamptz not null default now()
);

-- Saves the given (already validated) scenario as the next version and removes the draft in one transaction,
-- so a failure can't leave a version with its draft kept, and two saves can't be given the same number.
create function public.save_scenario_version(p_company_id uuid, p_data jsonb)
returns int
language plpgsql
set search_path = public
as $$
declare
  v_next int;
begin
  -- Serialises concurrent saves for the company, even when it has no draft or version row to lock yet.
  perform pg_advisory_xact_lock(hashtextextended(p_company_id::text, 0));

  select coalesce(max(version), 0) + 1 into v_next from scenario_versions where company_id = p_company_id;

  insert into scenario_versions (company_id, version, data) values (p_company_id, v_next, p_data);

  delete from scenario_drafts where company_id = p_company_id;
  return v_next;
end;
$$;

-- No auth yet: the app runs as anon. RLS stays on so adding auth later only tightens these policies.
alter table public.scenario_versions enable row level security;
alter table public.scenario_drafts enable row level security;

create policy "anon can read scenario versions" on public.scenario_versions for select to anon using (true);
create policy "anon can insert scenario versions" on public.scenario_versions for insert to anon with check (true);

create policy "anon can read scenario drafts" on public.scenario_drafts for select to anon using (true);
create policy "anon can insert scenario drafts" on public.scenario_drafts for insert to anon with check (true);
create policy "anon can update scenario drafts" on public.scenario_drafts for update to anon using (true) with check (true);
create policy "anon can delete scenario drafts" on public.scenario_drafts for delete to anon using (true);
