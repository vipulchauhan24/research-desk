-- Manual inputs for the Valuation tab. One row per company and key:
--   * a valuation method ('dcf-fcff', 'dcf-fcfe', 'pe', 'ev-ebitda', 'peg', 'earnings-yield', 'reverse-dcf'), or
--   * a shared Base-case table the methods read from ('cash-flows' for Table 2, 'exit-prices' for Table 3).
-- The fields differ per key and change as methods are refined, so they live in one jsonb document that the app
-- validates with Zod. Money inside it is integer paise, never a float.

create table public.valuation_inputs (
  company_id uuid not null references public.companies (id) on delete cascade,
  method     text not null check (method ~ '^[a-z][a-z0-9-]{0,39}$'),
  inputs     jsonb not null check (jsonb_typeof(inputs) = 'object'),
  updated_at timestamptz not null default now(),
  primary key (company_id, method)
);

-- No auth yet: the app runs as anon. RLS stays on so adding auth later only tightens these policies.
alter table public.valuation_inputs enable row level security;

create policy "anon can read valuation inputs" on public.valuation_inputs for select to anon using (true);
create policy "anon can insert valuation inputs" on public.valuation_inputs for insert to anon with check (true);
create policy "anon can update valuation inputs" on public.valuation_inputs for update to anon using (true) with check (true);
