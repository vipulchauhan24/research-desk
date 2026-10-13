-- Companies (Analysis list) and their manually entered prices.

create table public.companies (
  id            uuid primary key default gen_random_uuid(),
  name          text not null check (length(btrim(name)) > 0),
  -- Stored upper-case so the (exchange, symbol) uniqueness below can't be dodged by casing.
  symbol        text not null check (symbol = upper(symbol) and symbol ~ '^[A-Z0-9&-]{1,20}$'),
  exchange      text not null check (exchange in ('NSE', 'BSE')),
  -- Free text on purpose: the UI offers a fixed list, but adding a category shouldn't need a migration.
  business_type text not null check (length(btrim(business_type)) > 0),
  idea_source   text not null check (idea_source in ('Big order', 'PEAD', 'Analyst', 'Other')),
  status        text not null default 'Watch' check (status in ('Watch', 'Buy', 'Hold', 'Sell')),
  created_at    timestamptz not null default now(),
  unique (exchange, symbol)
);

-- One row per price the user typed in. The current price is the row with the latest as_of.
create table public.price_entries (
  id          uuid primary key default gen_random_uuid(),
  company_id  uuid not null references public.companies (id) on delete cascade,
  -- Paise, not rupees, so stored money is never a float.
  price_paise bigint not null check (price_paise > 0),
  as_of       date not null default current_date,
  created_at  timestamptz not null default now(),
  unique (company_id, as_of)
);

create index price_entries_company_latest_idx on public.price_entries (company_id, as_of desc);

-- No auth yet: the app runs as anon. RLS stays on so adding auth later only tightens these policies.
alter table public.companies enable row level security;
alter table public.price_entries enable row level security;

create policy "anon can read companies" on public.companies for select to anon using (true);
create policy "anon can insert companies" on public.companies for insert to anon with check (true);
create policy "anon can update companies" on public.companies for update to anon using (true) with check (true);
create policy "anon can delete companies" on public.companies for delete to anon using (true);

create policy "anon can read price entries" on public.price_entries for select to anon using (true);
create policy "anon can insert price entries" on public.price_entries for insert to anon with check (true);
create policy "anon can update price entries" on public.price_entries for update to anon using (true) with check (true);
create policy "anon can delete price entries" on public.price_entries for delete to anon using (true);
