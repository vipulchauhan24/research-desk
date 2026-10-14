-- Research notes: immutable saved versions plus one autosaved draft per company.

-- A saved version never changes. There are deliberately no update/delete policies below, so the
-- anon role (and any future role we forget to restrict) can only add versions, not rewrite history.
create table public.note_versions (
  id          uuid primary key default gen_random_uuid(),
  company_id  uuid not null references public.companies (id) on delete cascade,
  version     int  not null check (version > 0),
  -- ProseMirror JSON only, never HTML.
  content     jsonb not null check (jsonb_typeof(content) = 'object' and content ->> 'type' = 'doc'),
  change_note text not null check (length(btrim(change_note)) between 1 and 120),
  created_at  timestamptz not null default now(),
  unique (company_id, version)
);

-- The work in progress. At most one per company, so the primary key is the company.
create table public.note_drafts (
  company_id      uuid primary key references public.companies (id) on delete cascade,
  content         jsonb not null check (jsonb_typeof(content) = 'object' and content ->> 'type' = 'doc'),
  -- The saved version this draft was started from; null when the company has no saved version yet.
  based_on_version int check (based_on_version > 0),
  updated_at      timestamptz not null default now()
);

-- Turns the draft into the next saved version and removes the draft in one transaction, so a failure
-- can't leave a version without its draft removed, and two saves can't be given the same number.
create function public.save_note_version(p_company_id uuid, p_change_note text)
returns int
language plpgsql
set search_path = public
as $$
declare
  v_content jsonb;
  v_next    int;
begin
  select content into v_content from note_drafts where company_id = p_company_id for update;
  if not found then
    raise exception 'There is no draft to save' using errcode = 'P0002';
  end if;

  select coalesce(max(version), 0) + 1 into v_next from note_versions where company_id = p_company_id;

  insert into note_versions (company_id, version, content, change_note)
  values (p_company_id, v_next, v_content, btrim(p_change_note));

  delete from note_drafts where company_id = p_company_id;
  return v_next;
end;
$$;

-- No auth yet: the app runs as anon. RLS stays on so adding auth later only tightens these policies.
alter table public.note_versions enable row level security;
alter table public.note_drafts enable row level security;

create policy "anon can read note versions" on public.note_versions for select to anon using (true);
create policy "anon can insert note versions" on public.note_versions for insert to anon with check (true);

create policy "anon can read note drafts" on public.note_drafts for select to anon using (true);
create policy "anon can insert note drafts" on public.note_drafts for insert to anon with check (true);
create policy "anon can update note drafts" on public.note_drafts for update to anon using (true) with check (true);
create policy "anon can delete note drafts" on public.note_drafts for delete to anon using (true);
