# POPPIN — complete feature specification

Every page, tab, feature, and sub-feature currently built or designed, in one place. Status is marked for each: **live** (real, working code), **designed** (agreed on, not coded), or **conceptual** (discussed, not designed in detail).

---

## 1. Onboarding

**Status: live**

- Shown only on first launch, remembered via local storage, never shown again after
- Logo wordmark with the location pin serving as the dot of the "i," gently bouncing on a continuous loop
- Tagline in a hand-written script font
- One sentence of copy, pure vibe/discovery framing, no civic-mission language on this screen by design
- Hand-sketched background illustrations: a smiling sun, two trees, a small fountain, a person walking a dog, a person about to throw a frisbee
- Single button forward, no account creation, no multi-step signup
- A short reassurance line under the button

---

## 2. Discover (the home screen)

**Status: live**

### Header
- Wordmark (small size), same bouncing pin-dot logo
- Search icon toggle, opens/closes a search bar

### Map
- Real interactive map (Leaflet + OpenStreetMap tiles, no API key)
- Three separate pin layers:
  - **Active POPS pins**: colored using the vibe scale (see Design System below), sized larger for spaces with more ratings, a small icon showing the top-voted activity for that space, a pulsing ring if the space had activity in the last hour
  - **Coming-soon POPS pins**: the other 387 real NYC POPS, clustered into gray blobs with real counts at city zoom, splitting into individual muted pins on zoom in, tapping shows a friendly "not activated yet" message, never a dead end
  - **Live activity (Happening) pins**: small pulsing green pins, either a curated icon or a live photo thumbnail, for anything currently posted nearby
- Map auto-fits its zoom and center to show every pin that's loaded
- Floating "Drop a pin" button, opens the activity-posting flow (see section 4)

### Legend
- A quiet-to-lively gradient bar under the map, labeled, teaching the color system at a glance

### List
- Section header, dynamically either "**X spots within a 10-minute vibe check**" (only shown when real walking-distance math confirms every listed space is genuinely that close) or the safe fallback "**POPS I can walk to**"
- Cards for each active space: name, a short vibe/crowd description in plain words, a colored accent bar, a welcome-percentage badge
- Tapping a card or a map pin opens that space's profile

---

## 3. POPS Profile

**Status: live**

Opens as a two-tab view so nothing requires scrolling.

### Tab: Vibe
- Photo header with a hand-written personality line overlaid directly on the photo (e.g. "the quiet reader's corner")
- Back and save buttons
- Space name, tab switcher
- "Hear the space": a mini audio player row with play button, waveform, duration
- "Explore in 3D": a link out to the space's 3D scan (currently a placeholder alert; the real scan viewer exists separately, see section 6)
- Three drag-to-rate sliders, one each for quiet↔lively, open↔crowded, welcoming↔closed off
  - A fixed white dot shows the current crowd average
  - A draggable dark-ringed handle lets the visitor add their own rating by dragging, or tapping anywhere on the gradient to snap instantly
- "Submit my read & get directions" button, writes a real rating and closes back to the map

### Tab: Details
- Amenities list, icon plus label per amenity on file for that space
- "Food nearby" placeholder block
- Wish-cloud: tag chips sized by vote count, tap an existing one to back it, or type and add a new one
- "Share your spot": upload a photo or a sound recording, both go to real file storage with a metadata record linking back to the space

---

## 4. Happening (live activity pins)

**Status: live**, integrated into the Discover map rather than as its own separate tab right now

### Posting a pin ("Drop a pin")
- Two posting methods, chosen at the top of the flow:
  - **Pick an icon**: a curated set of 12 icons (live music, spikeball/frisbee, free food, sunset/hangout, chess/games, study group, dogs, art/sketch, yoga/stretch, sports, photography, open mic)
  - **Snap a photo**: upload a live photo instead of an icon
- Activity name field
- A message field, written in the app's casual, personal voice ("say it like you'd text a friend")
- Duration picker: 20 min, 30 min, 1 hr, or 2 hr
  - Photo posts are automatically capped at 30 minutes regardless of what's picked, since a "live" photo shouldn't be allowed to claim to be live for two hours
- Posting writes a real row and immediately appears on the map

### Viewing a pin
- Tapping a live pin opens an invite card:
  - The icon or the live photo, prominently
  - Activity name and a live "ends in X minutes" countdown
  - The message, in the hand-written personality font
  - A real headcount of how many people have tapped "I'm in"
  - "I'm in" button, records a response

### Rules baked into the design (not just described, actually built into the flow)
- No identity ever attached to a pin or a response, fully anonymous
- No direct messaging, all coordination happens through the public pin and headcount only
- Hard expiry, pins simply stop showing once their time is up

---

## 5. Passport

**Status: conceptual only.** Fully designed in earlier prototyping (a private, per-person stamp collection, one stamp per rating submitted, explicitly not shared or ranked, with an empty state and a summary count), but not present in the current live codebase. Would need its own build pass.

---

## 6. Scan Viewer (3D)

**Status: live, but standalone**, not yet connected to the main app

- A separate page (`/scan-viewer/`) using Three.js to load a real Polycam GLB export of an actual Cornell Tech space
- Full orbit controls (drag to rotate, scroll to zoom)
- Tapping anywhere on the actual scanned surface returns a real 3D coordinate (proven working against a genuine campus scan)
- This is the proof-of-concept for true in-scan activity pin placement, a designed but not-yet-built extension of the Happening feature, where a pin could be placed by tapping the actual 3D scan instead of a flat map

---

## Data model (Supabase)

| Table | Purpose |
|---|---|
| `pops` | Every space, real NYC POPS data plus the 5 active Cornell Tech pilot sites, includes a `status` column (`active` / `coming_soon`) |
| `ratings` | One row per rating submission (never overwritten), quiet/crowd/welcome values |
| `wishes` | Tag plus vote count, a `kind` column splits "popular activities" from "improvement wishes" using the same table |
| `traces` | A log of contribution events, used to power the "recently active" pulse on the map |
| `media` | Metadata for uploaded photos and recordings, linked to actual files in storage |
| `meetups` | Live activity pins, icon or photo, with an expiry timestamp |
| `meetup_responses` | One row per "I'm in" tap, no identity fields |

Storage buckets: `photos`, `recordings`, `meetup-photos`, all public-read with anonymous public-insert policies (this is a public civic tool, not a private app).

---

## Design system (cross-cutting, applies everywhere)

- **Type**: Grandstander for headlines and buttons, Varela Round for body text and data, a hand-written script reserved only for taglines and personality lines, never for anything functional
- **Color logic**: green is reserved for the app's own identity (logo, header chrome, primary generic buttons). Every space's own color comes from a single quiet-to-lively gradient driven by real rating data, never assigned arbitrarily
- **Logo**: the location pin doubles as the dot of the "i" in the wordmark, with a continuous gentle bounce
- **Iconography**: a chair for seating match (not a walking figure), a curated icon set for activities rather than free-form emoji everywhere

---

## Known gaps, honestly

- **No presence-gating.** Anyone can rate a space or drop an activity pin without being geolocated there. A full design for this exists (the geolocation scaffold) but isn't wired into the live app.
- **No true 3D pin placement yet.** Proven possible, not connected to the live Happening feature.
- **No live updates.** Someone else's rating or "I'm in" tap won't appear on your screen without a manual refresh, no realtime subscriptions yet.
- **Passport doesn't exist in the live app**, despite being fully designed.
- **The 3D and audio links on a profile are currently placeholders**, they don't yet point to a real scan or a real recording per space.
