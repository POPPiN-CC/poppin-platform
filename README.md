# POPPIN

**what's poppin in your neighborhood?**

## What this is

POPPIN is two things at once. It's a consumer app that helps someone find the right public space for what they want to do right now, read, work, hang, or just vibe. Underneath that, it's the Lived Publicness Index, a civic data layer that turns every visit into a record the city has never had: what these spaces actually feel like to use, and who they do or don't serve.

The current build is a live pilot centered on 3 real, self-scanned Cornell Tech campus spaces on Roosevelt Island (Queensboro View, Squirrel Grove, Tata Green), seeded alongside the full official NYC dataset of 392 privately owned public spaces (POPS), so the app already shows the whole city, just with only the pilot sites actually active.

## How it works, in plain terms

**Discover.** Open the app and see a map of New York. The 3 pilot spaces show up in full color, tappable, alive. The other 389 real POPS across the city show up as small gray clusters, real places, just not activated yet, so nothing ever feels broken when you tap one, it just says "coming soon."

**Color means vibe, not identity.** Every pin's color comes from a single Liveliness scale, cool teal-green for quiet spaces, warm amber for lively ones. It's meant to be a computed metric (crowdedness plus logged activity), not a raw slider, so the color is always telling you something true.

**A space's profile is a portrait, not a spec sheet.** Tap a space and you get a personality line first ("the quiet reader's corner"), then the details: a 3D walkthrough for the 3 pilot spaces, and the actual lived-layer data across three axes, safety, open-to-crowded, welcoming-to-closed-off.

**Rating is a drag, not a tap.** Instead of thumbs up or down, you drag a handle along a gradient. It's a small physical moment, place yourself on the same map everyone else's data lives on, and it captures real nuance instead of a binary judgment.

**Happening is live, ephemeral, and anonymous.** Anyone can drop a pin announcing something happening right now, a pickup game, a live set, leftover pizza, either with a quick icon or a live photo. Pins expire on their own, photo posts expire faster since "live" should mean something. No names, no direct messaging, ever, just a public pin and a public headcount.

**Your passport is private.** Every space you've rated becomes a stamp, just for you, never ranked, never shared, never a leaderboard.

## The stack, plainly

- One static `index.html`, no build step, no framework
- **Supabase** for the database, file storage, and the public API, the anon key in the code is meant to be public, access is controlled by row-level security policies, not by hiding it
- **Leaflet** with free map tiles, no API key required
- **GitHub Pages** for hosting
- Real data seeded from NYC's official Department of City Planning POPS dataset (392 spaces) plus hand-placed real coordinates for the 3 active Cornell Tech pilot sites
- **Three.js** with GLTFLoader for the 3D space prototype (`3d-space/`), a separate geofenced page, not yet linked into the main app's per-POPS profile flow

## Repository structure

```
poppin-platform/
  index.html                        the main app
  supabase-schema.sql                run this first, creates every table and bucket (includes all migrations to date)
  pops-seed.sql                      generated seed data — do not hand-edit, re-run the generator instead
  scripts/
    generate-pops-seed.js            reads Assets/Data + the 3 pilot GeoJSONs, writes pops-seed.sql
  FRAMEWORKS/                        the project's living spec: overall app framework and per-feature frameworks
  Assets/
    Data/                            the official NYC POPS dataset (CSV), source of truth for the 389 non-pilot spaces
    GIS/                             per-POPS GeoJSON boundaries, used for geofencing
    Scans/                           per-POPS 3D scans (.glb), compressed for mobile
  3d-space/
    index.html                       standalone geofenced 3D scan viewer + user pins (photo/video/note/emoji)
```

## Getting it running

1. Create a Supabase project, then in the SQL Editor run, in order: `supabase-schema.sql`, then `pops-seed.sql`
2. Copy your project's URL and anon public key from Settings → API
3. Paste both into the two placeholder constants near the top of `index.html`'s script (and `3d-space/index.html`'s, if you want the 3D prototype pointed at the same project)
4. Push everything to GitHub, turn on GitHub Pages (Settings → Pages → main branch, root folder)
5. Open the real `https://` URL, never open `index.html` directly from disk, modern browsers block the app's module system under the `file://` protocol entirely

If the CSV or the pilot GeoJSONs ever change, re-run `node scripts/generate-pops-seed.js` to regenerate `pops-seed.sql` rather than hand-editing it.

## What's real right now versus what's still ahead

**Working:** the map, real ratings via drag-to-rate, the wish-cloud, photo and sound uploads, the live activity pin flow end to end, all writing to a real database. Separately, `3d-space/` is a fully working standalone prototype: geofenced (inside/near/far via the Geolocation API + Turf.js), with photo, video, note, and emoji pins rendered as always-visible billboards in the 3D scan, also writing to the same database.

**Not yet built:** the full-screen map + pullable bottom sheet layout, the filter menu (distance/liveliness/activities), the 8-category activities taxonomy, the profile screen's "What's Happening"/"The Space" restructure, requiring someone to actually be at a space before they can post a live activity pin there (already proven out in `3d-space/`'s geofencing), linking a POPS profile's "Look Inside" button to its actual 3D scan, and the white/brand-matched visual reskin of `3d-space/` (currently dark-themed, built before the design framework existed).

For the fuller picture of what's live, shelled, or still just an idea across the whole platform, see `FRAMEWORKS/POPPIN_App_Framework.md` and `FRAMEWORKS/POPPiN_3D space.md`, those are the files to keep in sync as the build keeps moving.
