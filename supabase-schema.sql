-- POPPIN Supabase schema
-- Run this in Supabase: Project → SQL Editor → New query → paste all → Run
-- Safe to paste this entire file again at any point — every statement below is guarded
-- (IF NOT EXISTS / IF EXISTS / ON CONFLICT DO NOTHING / DROP-then-CREATE for policies, since
-- Postgres has no CREATE POLICY IF NOT EXISTS). Re-running never duplicates or destroys data;
-- it just re-asserts the current schema. This guarantee wasn't true of the file's original
-- CREATE TABLE/CREATE POLICY statements until this pass — a bare CREATE TABLE erroring
-- ("relation already exists") on a re-paste would abort the whole pasted block, including
-- every later statement in the same paste, since the SQL Editor runs a multi-statement paste
-- as one transaction.

create extension if not exists "pgcrypto";

-- Core spaces table
create table if not exists pops (
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
create table if not exists ratings (
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
create table if not exists wishes (
  id uuid primary key default gen_random_uuid(),
  pops_id uuid references pops(id) on delete cascade not null,
  tag text not null,
  votes int default 1,
  created_at timestamptz default now(),
  unique (pops_id, tag)
);

-- Trace-map dots, one row per contribution event, never edited
create table if not exists traces (
  id uuid primary key default gen_random_uuid(),
  pops_id uuid references pops(id) on delete cascade not null,
  type text check (type in ('rating', 'wish', 'note')) not null,
  lat double precision,
  lng double precision,
  created_at timestamptz default now()
);

-- Photos and sound recordings, file lives in Supabase Storage, this row is the metadata
create table if not exists media (
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
-- (ENABLE ROW LEVEL SECURITY is idempotent by nature in Postgres — re-running it on an
-- already-enabled table is a no-op, not an error, so no guard needed on these lines.)
alter table pops enable row level security;
drop policy if exists "public read pops" on pops;
create policy "public read pops" on pops for select using (true);

alter table ratings enable row level security;
drop policy if exists "public read ratings" on ratings;
create policy "public read ratings" on ratings for select using (true);
drop policy if exists "public insert ratings" on ratings;
create policy "public insert ratings" on ratings for insert with check (true);

alter table wishes enable row level security;
drop policy if exists "public read wishes" on wishes;
create policy "public read wishes" on wishes for select using (true);
drop policy if exists "public insert wishes" on wishes;
create policy "public insert wishes" on wishes for insert with check (true);
drop policy if exists "public update wishes" on wishes;
create policy "public update wishes" on wishes for update using (true);

alter table traces enable row level security;
drop policy if exists "public read traces" on traces;
create policy "public read traces" on traces for select using (true);
drop policy if exists "public insert traces" on traces;
create policy "public insert traces" on traces for insert with check (true);

alter table media enable row level security;
drop policy if exists "public read media" on media;
create policy "public read media" on media for select using (true);
drop policy if exists "public insert media" on media;
create policy "public insert media" on media for insert with check (true);

-- Storage buckets for photos and recordings, run these in the SQL editor too
insert into storage.buckets (id, name, public) values ('photos', 'photos', true)
  on conflict (id) do nothing;
insert into storage.buckets (id, name, public) values ('recordings', 'recordings', true)
  on conflict (id) do nothing;

drop policy if exists "public read photos" on storage.objects;
create policy "public read photos" on storage.objects for select using (bucket_id = 'photos');
drop policy if exists "public upload photos" on storage.objects;
create policy "public upload photos" on storage.objects for insert with check (bucket_id = 'photos');

drop policy if exists "public read recordings" on storage.objects;
create policy "public read recordings" on storage.objects for select using (bucket_id = 'recordings');
drop policy if exists "public upload recordings" on storage.objects;
create policy "public upload recordings" on storage.objects for insert with check (bucket_id = 'recordings');

-- Scan-local pins for the 3D space (3d-space/index.html), one row per contribution, never edited.
-- x/y/z are local coordinates inside a specific scan's GLB, not lat/lng.
create table if not exists scan_pins (
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
drop policy if exists "public read scan_pins" on scan_pins;
create policy "public read scan_pins" on scan_pins for select using (true);
drop policy if exists "public insert scan_pins" on scan_pins;
create policy "public insert scan_pins" on scan_pins for insert with check (true);

insert into storage.buckets (id, name, public) values ('scan-media', 'scan-media', true)
  on conflict (id) do nothing;
drop policy if exists "public read scan-media" on storage.objects;
create policy "public read scan-media" on storage.objects for select using (bucket_id = 'scan-media');
drop policy if exists "public upload scan-media" on storage.objects;
create policy "public upload scan-media" on storage.objects for insert with check (bucket_id = 'scan-media');

-- Migration: added after scan_pins already existed in a live project — widen the type
-- check to allow in-app recorded video clips (short, silent, capped-duration, no separate
-- bucket needed, reuses scan-media). The drop is IF EXISTS so this is safe whether or not a
-- given database ever had the original (pre-video) constraint name to begin with.
alter table scan_pins drop constraint if exists scan_pins_type_check;
alter table scan_pins add constraint scan_pins_type_check
  check (type in ('note', 'emoji', 'photo', 'recording', 'video'));

-- Migration: brings the main map/list app (formerly draft/index.html) onto this same
-- project instead of a separate one, so pops and scan_pins can eventually cross-reference.
alter table pops add column if not exists status text check (status in ('active', 'coming_soon')) default 'coming_soon';

alter table wishes add column if not exists kind text check (kind in ('activity', 'wish')) default 'wish';
-- Drops both the original 2-column constraint name AND the new 3-column one before re-adding
-- it — the old-name drop alone only protects the first re-run; by the second, the OLD name is
-- long gone but wishes_pops_id_tag_kind_key already exists from the first run's ADD, so a
-- bare (unguarded) ADD CONSTRAINT would fail then. Postgres has no ADD CONSTRAINT IF NOT
-- EXISTS, so drop-then-add (same technique used for policies) is what actually makes this
-- safe to paste any number of times.
alter table wishes drop constraint if exists wishes_pops_id_tag_key;
alter table wishes drop constraint if exists wishes_pops_id_tag_kind_key;
alter table wishes add constraint wishes_pops_id_tag_kind_key unique (pops_id, tag, kind);

-- Live activity pins ("Happening"). post_type distinguishes a quick curated-icon post from
-- a live photo post, since photo posts should expire faster by convention (enforced in the
-- app, not the DB).
create table if not exists meetups (
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
create table if not exists meetup_responses (
  id uuid primary key default gen_random_uuid(),
  meetup_id uuid references meetups(id) on delete cascade not null,
  created_at timestamptz default now()
);

alter table meetups enable row level security;
drop policy if exists "public read meetups" on meetups;
create policy "public read meetups" on meetups for select using (true);
drop policy if exists "public insert meetups" on meetups;
create policy "public insert meetups" on meetups for insert with check (true);

alter table meetup_responses enable row level security;
drop policy if exists "public read meetup_responses" on meetup_responses;
create policy "public read meetup_responses" on meetup_responses for select using (true);
drop policy if exists "public insert meetup_responses" on meetup_responses;
create policy "public insert meetup_responses" on meetup_responses for insert with check (true);

insert into storage.buckets (id, name, public) values ('meetup-photos', 'meetup-photos', true)
  on conflict (id) do nothing;
drop policy if exists "public read meetup photos" on storage.objects;
create policy "public read meetup photos" on storage.objects for select using (bucket_id = 'meetup-photos');
drop policy if exists "public upload meetup photos" on storage.objects;
create policy "public upload meetup photos" on storage.objects for insert with check (bucket_id = 'meetup-photos');

-- Migration: aligns pops/ratings with FRAMEWORKS/POPPIN_App_Framework.md.
-- pops gains the real fields the official NYC POPS CSV actually has (see
-- Assets/Data/Privately_Owned_Public_Spaces.csv); the old free-form `amenities`
-- column stays, reserved for hand-curated icon-friendly tags on the 3 real pilot
-- spaces, since the CSV's raw amenity text doesn't map cleanly to the icon lookup.
alter table pops add column if not exists building_name text;
alter table pops add column if not exists building_address text;
alter table pops add column if not exists public_space_type text;
alter table pops add column if not exists amenities_required text[];
alter table pops add column if not exists permitted_amenities text[];

-- ratings: ratings a POPS on quiet<->lively give way to unsafe<->safe. Liveliness
-- becomes a computed metric (crowdedness + logged activity) instead of a raw slider,
-- so it no longer needs a column here at all.
alter table ratings drop column if exists quiet;
alter table ratings add column if not exists safety int check (safety between 0 and 100);

-- Migration: Phase 5 (profile screen restructure, per FRAMEWORKS/POPPIN_App_Framework.md).
-- scan_slug links a POPS row to its 3d-space/?scan=<slug> page — null for the 389 real
-- spaces with no scan, set only on the 3 pilots. "Look Inside" uses this directly instead
-- of guessing from the name.
alter table pops add column if not exists scan_slug text;
update pops set scan_slug = 'queensboro-view' where name = 'Queensboro View';
update pops set scan_slug = 'squirrel-grove' where name = 'Squirrel Grove';
update pops set scan_slug = 'tata-green' where name = 'Tata Green';

-- category is set only for kind='activity' rows (one of ACTIVITY_CATEGORIES' ids in
-- index.html) — replaces the earlier keyword-guessing stand-in now that the app actually
-- has a real submission form asking the user to pick a category.
alter table wishes add column if not exists category text;

-- Migration: Phase 6 (computed Liveliness, per FRAMEWORKS/POPPIN_App_Framework.md:75).
-- Liveliness is a weighted composite of the crowd rating + logged activity + a noise-sensor
-- reading. There's no sensor hardware in the pilot, so `noise` (0-100) comes from simulated
-- data; it stays null until that data is generated, and computeLiveliness() in index.html
-- redistributes its weight to the other signals while it's null.
alter table pops add column if not exists noise int check (noise between 0 and 100);

-- Migration: simulated-dataset generator (scripts/generate-pops-seed.js). pops_number is the
-- CSV's own stable unique id (Assets/Data/Privately_Owned_Public_Spaces.csv, verified unique
-- across all 392 rows) — kept as provenance and as the deterministic seed the generator
-- derives each space's uuid and simulated values from, so re-running it is always idempotent.
-- Pilots (not in the CSV) get a synthetic 'PILOT-<scan-slug>' value instead.
-- `if not exists` on both of these: Supabase's SQL Editor runs a pasted multi-statement block
-- as one transaction, so one already-applied ALTER TABLE mid-paste would otherwise roll back
-- every statement after it too, silently.
alter table pops add column if not exists pops_number text;

-- Migration: interactions — supersedes the `popularity` column from the same session (never
-- applied, safe to drop): a hidden 0-100 abstract score turned out to be the wrong shape.
-- interactions is a real, meaningful count instead — "how many times has something actually
-- been logged here" (each repeat post of the same activity tag already increments
-- wishes.votes; interactions is that idea taken seriously and given a realistic range, a few
-- for obscure spaces up to 100+ for standouts) — displayable to users, not just a hidden
-- backend signal. It's also the shared cause behind noise/crowd/rating-count generation
-- (see generate-pops-seed.js) — averaging several independently-jittered mid-range signals
-- mathematically pulls the Liveliness composite toward the middle even harder than any one
-- signal alone, which was the original source of everything clustering together on the scale;
-- a shared real factor behind all of them is what actually produces spread.
alter table pops drop column if exists popularity;
alter table pops add column if not exists interactions int check (interactions >= 0);

-- Migration: batch Street View photos, one per POPS, sourced externally (Python/Colab +
-- the Street View Static API) and uploaded directly to this bucket — not through the app, so
-- no insert policy here (unlike photos/recordings, which are deliberately open for the live
-- user-upload feature). No new pops column either: the app derives each photo's expected path
-- directly from pops.pops_number ({pops_number}.jpg) at render time, so dropping a correctly
-- named file into the bucket is the entire integration step — see index.html's streetviewUrl().
insert into storage.buckets (id, name, public) values ('streetview', 'streetview', true)
  on conflict (id) do nothing;
drop policy if exists "public read streetview" on storage.objects;
create policy "public read streetview" on storage.objects for select using (bucket_id = 'streetview');

-- Seed your pilot POPS here, replace lat/lng with the real coordinates.
-- Uncomment and edit before running, or add these through the Supabase table editor instead.
-- insert into pops (name, description, lat, lng, amenities, best_time, hours) values
--   ('Cornell Tech green', 'Open lawn with movable seating', 40.7554, -73.9598, array['wifi','plug','sun','armchair'], 'Weekday mornings, before 11am', '6am to 10pm'),
--   ('River terrace atrium', 'Glassed-in seating with river views', 40.7549, -73.9603, array['wifi','plug','armchair'], 'Early afternoon, 1 to 3pm', '7am to 9pm'),
--   ('Mainland plaza', 'Paved plaza, tables and ledges', 40.7551, -73.9591, array['sun','armchair'], 'Late morning, before the lunch rush', '6am to 11pm');
