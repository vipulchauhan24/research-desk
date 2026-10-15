-- Order book and capex rows for the "Order book and capex" tab. Amounts are integer paise (bigint), never floats.
-- Months (order date, execution deadline) are stored as the first day of the month. Commissioning is a fiscal
-- quarter, kept as the year the fiscal year ends in plus the quarter (Q3 FY27 = 2027, 3) to match how it is shown.

create table public.order_book_rows (
  id           uuid primary key default gen_random_uuid(),
  company_id   uuid not null references public.companies (id) on delete cascade,
  customer     text not null check (length(btrim(customer)) between 1 and 120),
  ordered_on   date not null check (extract(day from ordered_on) = 1),
  value_paise  bigint not null check (value_paise > 0),
  execution_by date not null check (extract(day from execution_by) = 1),
  -- Completed orders are already executed, so they stay listed but drop out of the headline total.
  status       text not null check (status in ('Open', 'In execution', 'Completed')),
  source_note  text check (source_note is null or length(btrim(source_note)) between 1 and 200),
  -- Web links only: anything else (javascript:, data:, file:) is rejected here, not just in the form.
  source_url   text check (source_url is null or (source_url ~* '^https?://[^\s]+$' and length(source_url) <= 2048)),
  created_at   timestamptz not null default now()
);

create index order_book_rows_company_idx on public.order_book_rows (company_id, ordered_on desc);

create table public.capex_rows (
  id                    uuid primary key default gen_random_uuid(),
  company_id            uuid not null references public.companies (id) on delete cascade,
  project               text not null check (length(btrim(project)) between 1 and 120),
  capacity_added        text check (capacity_added is null or length(btrim(capacity_added)) between 1 and 120),
  outlay_paise          bigint not null check (outlay_paise > 0),
  funding               text check (funding is null or length(btrim(funding)) between 1 and 80),
  status                text not null check (status in ('Planned', 'In progress', 'Commissioned')),
  commissioning_fy      smallint not null check (commissioning_fy between 2000 and 2100),
  commissioning_quarter smallint not null check (commissioning_quarter between 1 and 4),
  source_note           text check (source_note is null or length(btrim(source_note)) between 1 and 200),
  source_url            text check (source_url is null or (source_url ~* '^https?://[^\s]+$' and length(source_url) <= 2048)),
  created_at            timestamptz not null default now()
);

create index capex_rows_company_idx on public.capex_rows (company_id, commissioning_fy, commissioning_quarter);

-- No auth yet: the app runs as anon. RLS stays on so adding auth later only tightens these policies.
alter table public.order_book_rows enable row level security;
alter table public.capex_rows enable row level security;

create policy "anon can read order book rows" on public.order_book_rows for select to anon using (true);
create policy "anon can insert order book rows" on public.order_book_rows for insert to anon with check (true);
create policy "anon can update order book rows" on public.order_book_rows for update to anon using (true) with check (true);
create policy "anon can delete order book rows" on public.order_book_rows for delete to anon using (true);

create policy "anon can read capex rows" on public.capex_rows for select to anon using (true);
create policy "anon can insert capex rows" on public.capex_rows for insert to anon with check (true);
create policy "anon can update capex rows" on public.capex_rows for update to anon using (true) with check (true);
create policy "anon can delete capex rows" on public.capex_rows for delete to anon using (true);
