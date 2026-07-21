# POPPIN — the scaffold of truth

One reference document for what's live, what's shelled, and what's still concept.

## Status at a glance

**Live and working right now:** the discovery map (real OpenStreetMap tiles via Leaflet, no API key), the POPS list and profile screens matched to the Figma design, ratings that write to Supabase, Popular Activities and the improvement wish-cloud, the trace log, quick thumbs up/down feedback, the "what I am doing here" activity input, and photo/recording upload to Supabase Storage.

**Proven, not yet wired in:** a Three.js viewer loading a real Cornell Tech Polycam scan (GLB), confirmed working, tapping the actual scanned surface returns real x, y, z coordinates. Lives at `/scan-viewer/`, separate from the main app for now.

**Shell, structure defined, not built:** geolocation zones (gating contribution behind actual presence in a POPS), and live activity pins (the UNO-meetup feature), including its safety rules.

**Concept only, no shell yet:** spot stories (audio memories tied to a location), the presence layer (who else is here right now), and art or sketch contributions. All three were discussed and intentionally not built yet, the presence layer specifically needs its privacy rules settled first.

## Platform purpose, one paragraph

POPPIN is a two-faced platform: a consumer app that helps people find the right POPS for what they want to do right now, and the Lived Publicness Index, the civic data layer underneath, that turns those same visits into the dataset New York has never collected, the lived, felt experience of its privately owned public spaces, including who these spaces fail to serve. Every feature in this document either collects that missing data or puts it to use.

## Tech stack

- Frontend: one static `index.html`, no build step, no framework, vanilla JS and the Supabase JS client loaded from a CDN
- Mapping: Leaflet with OpenStreetMap tiles, free, no API key, no account
- Backend: Supabase, Postgres plus file storage plus realtime, the anon public key lives in the client code on purpose, it is safe to be public, access is enforced by row-level security policies, not by hiding the key
- Hosting: GitHub Pages off the poppin-platform repository's main branch
- 3D: Three.js with GLTFLoader, reading GLB exports straight from Polycam

## Repository structure

This is what the repo should look like once the renames from the last upload are cleaned up:

```
poppin-platform/
  index.html                  the real app, must live at the root
  supabase-schema.sql         run this in Supabase SQL editor
 POPPiN_Overall.md                    this document
  README.md                   setup and deploy steps
  scan-viewer/
    index.html               Three.js scan viewer, pin-placement test
    cornell-tech-scan.glb    the real Polycam export
```

Every file that is meant to be its own page needs its own folder with its own `index.html` inside it. Two files both named `index.html` in the same folder will always collide, that's what happened with `index_1.html` and `index_5.html`, and the fix is always the same: give the second one its own subfolder.

## Data model

Everything currently live or shelled, in one place:

```
pops              id, name, description, lat, lng, amenities[],
                  best_time, hours

ratings           id, pops_id, quiet, crowd, welcome, lat, lng
                  (one row per submission, never overwritten)

wishes            id, pops_id, tag, kind ('activity' | 'wish'),
                  votes  (kind splits Popular Activities from
                  the improvement wish-cloud, same mechanism)

traces            id, pops_id, type ('rating'|'wish'|'note'), lat, lng

media             id, pops_id, type ('photo'|'recording'),
                  storage_path, caption, lat, lng

-- shelled, not yet created --
meetups           id, pops_id, activity, message, lat, lng, expires_at
meetup_responses  id, meetup_id  (no identity fields, on purpose)
```

## Live features, what index.html actually does today

- Loads real POPS from Supabase and shows them as pins on a real map and as cards in a list
- Filters by activity tag and by text search
- A profile screen per space showing averaged ratings, amenities, popular activities, and the improvement wish-cloud
- Submitting a rating writes a real row and immediately updates the visible averages
- Tapping a wish tag, or typing a new one, writes to Supabase and re-renders live
- Photo and recording uploads go to real Supabase Storage buckets with a metadata row linking back to the space

## Shell features, next to build

### Geolocation zones

Full detail already written up separately. In short: check whether the visitor is inside, near, or far from a POPS using the browser's Geolocation API and Turf.js, and gate the write actions, rating, wishes, pins, behind being actually inside. This is the fix for a risk already named in the studio proposal: without it, anyone can rate a space from their couch.

### Live activity pins

Full detail and safety rules already written up separately. In short: someone drops a pin inside a POPS, names an activity, sets an expiry, and it appears live for others nearby. Build the flat-map version first, that's achievable with what already exists. True in-scan 3D placement, tapping inside the actual Polycam model, is a real second step, proven technically feasible against the real Cornell Tech scan, but not yet connected to the live app or the database.

## The day-zero pilot method

Before any of this had real users, the plan was always to seed it with real fieldwork: a trained observer at a pilot site, using a Whyte-style protocol, recording who is present, what they are doing, and how long they stay, across different times of day. That observed data becomes the calibration set the platform's matching and rating logic gets checked against. This hasn't changed, and it's still the right first move before opening the app to the public.

## Design system, from the Figma reference

- Logo: black "P" and "PPIN" with a coral pin replacing the O, small coral italic tagline underneath
- Primary coral: used for the logo pin, the search button border, all primary call-to-action buttons
- Green: the welcome percent badge and the thumbs-up button
- Red: the thumbs-down button
- Four-color tag system: orange, blue, green, purple, rotated across activity and wish tags so the same word doesn't always render the same color
- Icon language: a chair icon for seating match, not a walking figure, that one is a real, deliberate correction made mid-build

## Rules and requirements, consolidated

Pulled from every feature discussion so far, these apply project-wide, not to any one screen.

- **Anonymous by default.** Ratings, wishes, traces, and pins carry no identity unless a feature explicitly requires otherwise.
- **Public-interest data governance.** The aggregate belongs to the public and to advocacy partners like MAS and APOPS, never to a private company that could sell or bury it.
- **No private contact between users, ever.** This applies most directly to live activity pins: no direct messaging, no usernames tied to real identity, coordination happens only through the public pin itself.
- **Presence should eventually gate contribution.** Ratings and pins should require the poster to be geolocated at or near the POPS, once the geolocation shell is built, this is the real fix for gaming and remote fake contributions.
- **Ephemeral features stay ephemeral.** Live activity pins expire hard and leave no persistent history, this is a live bulletin board, not a feed.
- **Presence and location sharing default to aggregate, not individual.** A count of how many people are nearby, not a trackable trail of named individuals, until an explicit opt-in system is designed.
- **Open content needs a moderation path.** Photos, recordings, and freeform text carry more risk than a tap-based rating and need at least a basic review or report mechanism before this goes fully public.
- **Analysis stays weighted for equity.** The platform actively surfaces under-rated, under-used spaces rather than just amplifying whatever is already popular, this is the core protection against the bias already named in the studio proposal.

## Open questions, carried forward

- How long should a geo-trace persist before it folds into the permanent trace layer?
- Who moderates open content at pilot scale, a person on the team, or a lightweight automated filter first?
- Does a live activity pin need a minimum number of "I'm in" responses before it's shown widely, or is every pin visible immediately?
- What's the real threshold for showing an aggregate presence count without implying a space is empty when it only has one or two people in it?
