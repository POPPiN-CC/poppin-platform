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

-- Scan-local pins for the 3D space (3d-space/index.html), one row per contribution, never edited.
-- x/y/z are local coordinates inside a specific scan's GLB, not lat/lng.
create table scan_pins (
  id uuid primary key default gen_random_uuid(),
  scan_id text not null,
  type text check (type in ('note', 'emoji', 'photo', 'recording')) not null,
  text text,
  storage_path text,
  x double precision not null,
  y double precision not null,
  z double precision not null,
  created_at timestamptz default now()
);

alter table scan_pins enable row level security;
create policy "public read scan_pins" on scan_pins for select using (true);
create policy "public insert scan_pins" on scan_pins for insert with check (true);

insert into storage.buckets (id, name, public) values ('scan-media', 'scan-media', true);
create policy "public read scan-media" on storage.objects for select using (bucket_id = 'scan-media');
create policy "public upload scan-media" on storage.objects for insert with check (bucket_id = 'scan-media');

-- Migration: added after scan_pins already existed in a live project — widen the type
-- check to allow in-app recorded video clips (short, silent, capped-duration, no separate
-- bucket needed, reuses scan-media). Run only if scan_pins was created before this existed.
alter table scan_pins drop constraint scan_pins_type_check;
alter table scan_pins add constraint scan_pins_type_check
  check (type in ('note', 'emoji', 'photo', 'recording', 'video'));

-- Migration: brings the main map/list app (formerly draft/index.html) onto this same
-- project instead of a separate one, so pops and scan_pins can eventually cross-reference.
alter table pops add column status text check (status in ('active', 'coming_soon')) default 'coming_soon';

alter table wishes add column kind text check (kind in ('activity', 'wish')) default 'wish';
alter table wishes drop constraint wishes_pops_id_tag_key;
alter table wishes add constraint wishes_pops_id_tag_kind_key unique (pops_id, tag, kind);

-- Live activity pins ("Happening"). post_type distinguishes a quick curated-icon post from
-- a live photo post, since photo posts should expire faster by convention (enforced in the
-- app, not the DB).
create table meetups (
  id uuid primary key default gen_random_uuid(),
  pops_id uuid references pops(id) on delete cascade not null,
  activity text not null,
  message text,
  post_type text check (post_type in ('icon', 'photo')) default 'icon',
  icon text,
  photo_path text,
  lat double precision,
  lng double precision,
  expires_at timestamptz not null,
  created_at timestamptz default now()
);

-- One row per "I'm in" tap, no identity fields, on purpose.
create table meetup_responses (
  id uuid primary key default gen_random_uuid(),
  meetup_id uuid references meetups(id) on delete cascade not null,
  created_at timestamptz default now()
);

alter table meetups enable row level security;
create policy "public read meetups" on meetups for select using (true);
create policy "public insert meetups" on meetups for insert with check (true);

alter table meetup_responses enable row level security;
create policy "public read meetup_responses" on meetup_responses for select using (true);
create policy "public insert meetup_responses" on meetup_responses for insert with check (true);

insert into storage.buckets (id, name, public) values ('meetup-photos', 'meetup-photos', true);
create policy "public read meetup photos" on storage.objects for select using (bucket_id = 'meetup-photos');
create policy "public upload meetup photos" on storage.objects for insert with check (bucket_id = 'meetup-photos');

-- Migration: aligns pops/ratings with FRAMEWORKS/POPPIN_App_Framework.md.
-- pops gains the real fields the official NYC POPS CSV actually has (see
-- Assets/Data/Privately_Owned_Public_Spaces.csv); the old free-form `amenities`
-- column stays, reserved for hand-curated icon-friendly tags on the 3 real pilot
-- spaces, since the CSV's raw amenity text doesn't map cleanly to the icon lookup.
alter table pops add column building_name text;
alter table pops add column building_address text;
alter table pops add column public_space_type text;
alter table pops add column amenities_required text[];
alter table pops add column permitted_amenities text[];

-- ratings: ratings a POPS on quiet<->lively give way to unsafe<->safe. Liveliness
-- becomes a computed metric (crowdedness + logged activity) instead of a raw slider,
-- so it no longer needs a column here at all.
alter table ratings drop column quiet;
alter table ratings add column safety int check (safety between 0 and 100);

-- Migration: Phase 5 (profile screen restructure, per FRAMEWORKS/POPPIN_App_Framework.md).
-- scan_slug links a POPS row to its 3d-space/?scan=<slug> page — null for the 389 real
-- spaces with no scan, set only on the 3 pilots. "Look Inside" uses this directly instead
-- of guessing from the name.
alter table pops add column scan_slug text;
update pops set scan_slug = 'queensboro-view' where name = 'Queensboro View';
update pops set scan_slug = 'squirrel-grove' where name = 'Squirrel Grove';
update pops set scan_slug = 'tata-green' where name = 'Tata Green';

-- category is set only for kind='activity' rows (one of ACTIVITY_CATEGORIES' ids in
-- index.html) — replaces the earlier keyword-guessing stand-in now that the app actually
-- has a real submission form asking the user to pick a category.
alter table wishes add column category text;

-- Seed your pilot POPS here, replace lat/lng with the real coordinates.
-- Uncomment and edit before running, or add these through the Supabase table editor instead.
-- insert into pops (name, description, lat, lng, amenities, best_time, hours) values
--   ('Cornell Tech green', 'Open lawn with movable seating', 40.7554, -73.9598, array['wifi','plug','sun','armchair'], 'Weekday mornings, before 11am', '6am to 10pm'),
--   ('River terrace atrium', 'Glassed-in seating with river views', 40.7549, -73.9603, array['wifi','plug','armchair'], 'Early afternoon, 1 to 3pm', '7am to 9pm'),
--   ('Mainland plaza', 'Paved plaza, tables and ledges', 40.7551, -73.9591, array['sun','armchair'], 'Late morning, before the lunch rush', '6am to 11pm');
