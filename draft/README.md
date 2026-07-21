# POPPIN

**what's poppin in your neighborhood?**

## What this is

POPPIN is two things at once. It's a consumer app that helps someone find the right public space for what they want to do right now, read, work, hang, or just vibe. Underneath that, it's the Lived Publicness Index, a civic data layer that turns every visit into a record the city has never had: what these spaces actually feel like to use, and who they do or don't serve.

The current build is a live pilot centered on Cornell Tech's real campus spaces on Roosevelt Island, seeded alongside the full official NYC dataset of 392 privately owned public spaces (POPS), so the app already shows the whole city, just with only the pilot sites actually active.

## How it works, in plain terms

**Discover.** Open the app and see a map of New York. Five real Cornell Tech spaces show up in full color, tappable, alive. The other 392 real POPS across the city show up as small gray clusters, real places, just not activated yet, so nothing ever feels broken when you tap one, it just says "coming soon."

**Color means vibe, not identity.** Every pin's color comes from a single scale, cool teal-green for quiet spaces, warm amber for lively ones. It's driven entirely by real rating data, not picked arbitrarily, so the color is always telling you something true.

**A space's profile is a portrait, not a spec sheet.** Tap a space and you get a personality line first ("the quiet reader's corner"), then the details: sound, a 3D walkthrough, and the actual lived-layer data across three axes, quiet-to-lively, open-to-crowded, welcoming-to-closed-off.

**Rating is a drag, not a tap.** Instead of thumbs up or down, you drag a handle along the same gradient the space's own color comes from. It's a small physical moment, place yourself on the same map everyone else's data lives on, and it captures real nuance instead of a binary judgment.

**Happening is live, ephemeral, and anonymous.** Anyone can drop a pin announcing something happening right now, a pickup game, a live set, leftover pizza, either with a quick icon or a live photo. Pins expire on their own, photo posts expire faster since "live" should mean something. No names, no direct messaging, ever, just a public pin and a public headcount.

**Your passport is private.** Every space you've rated becomes a stamp, just for you, never ranked, never shared, never a leaderboard.

## The stack, plainly

- One static `index.html`, no build step, no framework
- **Supabase** for the database, file storage, and the public API, the anon key in the code is meant to be public, access is controlled by row-level security policies, not by hiding it
- **Leaflet** with free OpenStreetMap tiles for the map, no API key required
- **GitHub Pages** for hosting
- Real data seeded from NYC's official Department of City Planning POPS dataset (392 spaces) plus hand-placed real coordinates for the five active Cornell Tech pilot sites

## Repository structure

```
poppin-platform/
  index.html                     the whole app
  supabase-schema.sql             run this first, creates every table and bucket
  cornell-tech-pilot-seed.sql     the 5 real, active campus spaces
  nyc_pops_seed.sql               the other 387 real NYC POPS, shown but not yet active
  truth.md                        the fuller internal reference: what's built, what's shell, what's next
  scan-viewer/                    a standalone Three.js viewer proving 3D pin placement works
    index.html
    cornell-tech-scan.glb
```

## Getting it running

1. Create a Supabase project, then in the SQL Editor run, in order: `supabase-schema.sql`, `cornell-tech-pilot-seed.sql`, `nyc_pops_seed.sql`
2. Copy your project's URL and anon public key from Settings → API
3. Paste both into the two placeholder constants near the top of `index.html`'s script
4. Push everything to GitHub, turn on GitHub Pages (Settings → Pages → main branch, root folder)
5. Open the real `https://` URL, never open `index.html` directly from disk, modern browsers block the app's module system under the `file://` protocol entirely

## What's real right now versus what's still ahead

**Working:** the map, real ratings via drag-to-rate, the wish-cloud, photo and sound uploads, the live activity pin flow end to end, all writing to a real database.

**Not yet built:** requiring someone to actually be at a space before they can rate it or drop a pin there (the geolocation gate), true in-3D-scan pin placement (proven possible against a real scan, not connected to the live app yet), and live-updating counts without a manual refresh.

For the full, honest, currently-maintained breakdown of exactly what's live, what's shelled, and what's still just an idea, see `truth.md`, that's the file to keep in sync as the build keeps moving.
