-- Run this once in the Supabase SQL editor.

create table profiles (
  id uuid primary key references auth.users on delete cascade,
  name text,
  is_admin boolean not null default false
);

create function handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into profiles (id, name) values (new.id, new.raw_user_meta_data->>'name');
  return new;
end $$;

create trigger on_auth_user_created after insert on auth.users
for each row execute function handle_new_user();

create function is_admin() returns boolean
language sql security definer stable set search_path = public as $$
  select coalesce((select is_admin from profiles where id = auth.uid()), false)
$$;

create table modules (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  role text not null default 'General',
  summary text not null default '',
  mins int not null default 5,
  steps jsonb not null default '[]',   -- [{ "t": "title", "b": "markdown body", "video": "optional url" }]
  quiz jsonb,                          -- { "q": "...", "o": ["a","b","c"], "a": 1 }
  published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table progress (
  user_id uuid references auth.users on delete cascade,
  module_id uuid references modules on delete cascade,
  step int not null default 0,
  done boolean not null default false,
  updated_at timestamptz not null default now(),
  primary key (user_id, module_id)
);

alter table profiles enable row level security;
alter table modules enable row level security;
alter table progress enable row level security;

-- Nobody can edit profiles from the client, so nobody can make themselves admin.
create policy "read own profile" on profiles for select using (id = auth.uid());

-- Anyone (including guests) reads published modules. Admins read and write everything.
create policy "read published" on modules for select using (published or is_admin());
create policy "admin insert" on modules for insert with check (is_admin());
create policy "admin update" on modules for update using (is_admin());
create policy "admin delete" on modules for delete using (is_admin());

create policy "own progress" on progress for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Image uploads for the CMS.
-- 50 MB is the Supabase free-plan ceiling per file. Raise both numbers on a paid plan.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('media', 'media', true, 52428800,
        array['image/*', 'video/mp4', 'video/webm', 'video/quicktime']);
create policy "admin upload" on storage.objects for insert to authenticated
  with check (bucket_id = 'media' and is_admin());
create policy "admin manage" on storage.objects for update to authenticated
  using (bucket_id = 'media' and is_admin());
create policy "admin remove" on storage.objects for delete to authenticated
  using (bucket_id = 'media' and is_admin());

-- Starter module.
insert into modules (title, role, summary, mins, published, steps, quiz) values (
  'Categorising a hazardous materials inventory', 'Health & Safety',
  'Sort chemicals into hazard classes so they are stored safely.', 6, true,
  '[{"t":"Find the hazard class","b":"Every chemical belongs to one or more GHS hazard classes: flammable, corrosive, toxic, oxidiser.\n\nStart with the label pictogram."},
    {"t":"Check Section 2 of the SDS","b":"The Safety Data Sheet lists the classification in Section 2 and storage advice in Section 7.\n\n- Note every class listed\n- Record the UN number if shown"},
    {"t":"Assign a storage group","b":"Group by compatibility, not alphabet.\n\n- Keep acids away from bases\n- Keep oxidisers away from flammables"}]',
  '{"q":"A product is both flammable and an oxidiser. What do you do?","o":["Store with flammables only","Record both classes and keep it apart from both groups","Ignore the oxidiser class"],"a":1}'
);

-- After you sign up in the app, make yourself an admin:
-- update profiles set is_admin = true where id = (select id from auth.users where email = 'you@example.com');
