-- External resources attached to a company's research (filings, articles, decks...). Not part of the versioned note:
-- the list changes immediately and is shown in the order the links were added.

create table public.research_links (
  id         uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id) on delete cascade,
  label      text not null check (length(btrim(label)) between 1 and 80),
  -- Web links only: anything else (javascript:, data:, file:) is rejected here, not just in the form.
  url        text not null check (url ~* '^https?://[^\s]+$' and length(url) <= 2048),
  created_at timestamptz not null default now()
);

create index research_links_company_idx on public.research_links (company_id, created_at);

-- No auth yet: the app runs as anon. RLS stays on so adding auth later only tightens these policies.
alter table public.research_links enable row level security;

create policy "anon can read research links" on public.research_links for select to anon using (true);
create policy "anon can insert research links" on public.research_links for insert to anon with check (true);
create policy "anon can update research links" on public.research_links for update to anon using (true) with check (true);
create policy "anon can delete research links" on public.research_links for delete to anon using (true);
