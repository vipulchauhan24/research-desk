-- Documents (PDFs and links) and the predicted-vs-actual tracker for the "Documents and tracker" tab.

create table public.documents (
  id           uuid primary key default gen_random_uuid(),
  company_id   uuid not null references public.companies (id) on delete cascade,
  title        text not null check (length(btrim(title)) between 1 and 120),
  doc_type     text not null check (doc_type in ('Concall', 'Quarterly result', 'Investor presentation', 'Annual report', 'Other')),
  -- The quarter or year the document covers ('Q1 FY27', 'FY26'); free text.
  period       text check (period is null or length(btrim(period)) between 1 and 20),
  doc_date     date not null,
  -- Exactly one source: a PDF in the 'documents' storage bucket (path + original file name), or a web link.
  storage_path text,
  file_name    text check (file_name is null or length(btrim(file_name)) between 1 and 255),
  -- Web links only: anything else (javascript:, data:, file:) is rejected here, not just in the form.
  url          text check (url is null or (url ~* '^https?://[^\s]+$' and length(url) <= 2048)),
  -- Text pasted from the document (e.g. a concall summary).
  summary      text check (summary is null or length(summary) <= 20000),
  created_at   timestamptz not null default now(),
  constraint documents_one_source check (
    (storage_path is not null and file_name is not null and url is null)
    or (storage_path is null and file_name is null and url is not null)
  )
);

create index documents_company_idx on public.documents (company_id, doc_date desc);

-- One prediction per metric, case and quarter. Values are integers: paise for 'crore' metrics, basis points
-- (hundredths of a percent) for 'percent' metrics. Verdicts are computed from these, never stored.
create table public.tracker_rows (
  id         uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id) on delete cascade,
  -- Fiscal year as the year it ends in (Q1 FY27 = 2027, 1).
  fiscal_year smallint not null check (fiscal_year between 2000 and 2100),
  quarter     smallint not null check (quarter between 1 and 4),
  metric      text not null check (length(btrim(metric)) between 1 and 60),
  unit        text not null check (unit in ('crore', 'percent')),
  case_name   text not null check (case_name in ('Bear', 'Base', 'Bull')),
  predicted   bigint not null,
  -- Null until the quarter is reported.
  actual      bigint,
  created_at  timestamptz not null default now(),
  constraint tracker_rows_unique unique (company_id, fiscal_year, quarter, metric, case_name)
);

-- No auth yet: the app runs as anon. RLS stays on so adding auth later only tightens these policies.
alter table public.documents enable row level security;
alter table public.tracker_rows enable row level security;

create policy "anon can read documents" on public.documents for select to anon using (true);
create policy "anon can insert documents" on public.documents for insert to anon with check (true);
create policy "anon can update documents" on public.documents for update to anon using (true) with check (true);
create policy "anon can delete documents" on public.documents for delete to anon using (true);

create policy "anon can read tracker rows" on public.tracker_rows for select to anon using (true);
create policy "anon can insert tracker rows" on public.tracker_rows for insert to anon with check (true);
create policy "anon can update tracker rows" on public.tracker_rows for update to anon using (true) with check (true);
create policy "anon can delete tracker rows" on public.tracker_rows for delete to anon using (true);

-- Private bucket for uploaded PDFs: opened through short-lived signed links, never a public URL.
-- The bucket itself refuses anything but PDFs over 20 MB, so the limits hold even if the form check is bypassed.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('documents', 'documents', false, 20971520, array['application/pdf'])
on conflict (id) do nothing;

create policy "anon can read document files" on storage.objects for select to anon using (bucket_id = 'documents');
create policy "anon can upload document files" on storage.objects for insert to anon with check (bucket_id = 'documents');
create policy "anon can delete document files" on storage.objects for delete to anon using (bucket_id = 'documents');
