-- POPPIN Supabase schema
-- Run this in Supabase: Project → SQL Editor → New query → paste all → Run

create extension if not exists "pgcrypto";

-- Core spaces table
create table pops (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  lat double precision not null,
  lng double precision not null,
  amenities text[] default '{}',
  best_time text,
  hours text,
  created_at timestamptz default now()
);

-- One row per rating submission (never averaged in place, always appended)
create table ratings (
  id uuid primary key default gen_random_uuid(),
  pops_id uuid references pops(id) on delete cascade not null,
  quiet int check (quiet between 0 and 100),
  crowd int check (crowd between 0 and 100),
  welcome int check (welcome between 0 and 100),
  lat double precision,
  lng double precision,
  created_at timestamptz default now()
);

-- Wish-cloud tags, one row per tag per space, vote count increments in place
create table wishes (
  id uuid primary key default gen_random_uuid(),
  pops_id uuid references pops(id) on delete cascade not null,
  tag text not null,
  votes int default 1,
  created_at timestamptz default now(),
  unique (pops_id, tag)
);

-- Trace-map dots, one row per contribution event, never edited
create table traces (
  id uuid primary key default gen_random_uuid(),
  pops_id uuid references pops(id) on delete cascade not null,
  type text check (type in ('rating', 'wish', 'note')) not null,
  lat double precision,
  lng double precision,
  created_at timestamptz default now()
);

-- Photos and sound recordings, file lives in Supabase Storage, this row is the metadata
create table media (
  id uuid primary key default gen_random_uuid(),
  pops_id uuid references pops(id) on delete cascade not null,
  type text check (type in ('photo', 'recording')) not null,
  storage_path text not null,
  caption text,
  lat double precision,
  lng double precision,
  created_at timestamptz default now()
);

-- Row level security: public civic tool, anonymous contributions, append-only
alter table pops enable row level security;
create policy "public read pops" on pops for select using (true);

alter table ratings enable row level security;
create policy "public read ratings" on ratings for select using (true);
create policy "public insert ratings" on ratings for insert with check (true);

alter table wishes enable row level security;
create policy "public read wishes" on wishes for select using (true);
create policy "public insert wishes" on wishes for insert with check (true);
create policy "public update wishes" on wishes for update using (true);

alter table traces enable row level security;
create policy "public read traces" on traces for select using (true);
create policy "public insert traces" on traces for insert with check (true);

alter table media enable row level security;
create policy "public read media" on media for select using (true);
create policy "public insert media" on media for insert with check (true);

-- Storage buckets for photos and recordings, run these in the SQL editor too
insert into storage.buckets (id, name, public) values ('photos', 'photos', true);
insert into storage.buckets (id, name, public) values ('recordings', 'recordings', true);

create policy "public read photos" on storage.objects for select using (bucket_id = 'photos');
create policy "public upload photos" on storage.objects for insert with check (bucket_id = 'photos');

create policy "public read recordings" on storage.objects for select using (bucket_id = 'recordings');
create policy "public upload recordings" on storage.objects for insert with check (bucket_id = 'recordings');

-- Seed your pilot POPS here, replace lat/lng with the real coordinates.
-- Uncomment and edit before running, or add these through the Supabase table editor instead.
-- insert into pops (name, description, lat, lng, amenities, best_time, hours) values
--   ('Cornell Tech green', 'Open lawn with movable seating', 40.7554, -73.9598, array['wifi','plug','sun','armchair'], 'Weekday mornings, before 11am', '6am to 10pm'),
--   ('River terrace atrium', 'Glassed-in seating with river views', 40.7549, -73.9603, array['wifi','plug','armchair'], 'Early afternoon, 1 to 3pm', '7am to 9pm'),
--   ('Mainland plaza', 'Paved plaza, tables and ledges', 40.7551, -73.9591, array['sun','armchair'], 'Late morning, before the lunch rush', '6am to 11pm');
