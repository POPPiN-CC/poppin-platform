# POPPIN app framework

A plain-language guide to every screen, every color, every piece of text, and every asset the app needs. Use this to build, check work against, and update as things change.

---

## Part 1: The design basics (use these everywhere, don't improvise new ones)

### Colors

| Name | Hex code | Where it's used |
|---|---|---|
| App green | `#1FBF6B` | The logo, the header search button, generic buttons that aren't tied to one specific space |
| Vibe scale, quiet end | `#0EA5A0` | Cool teal-green, for very quiet spaces |
| Vibe scale, mid | `#7FBF3F` | Yellow-green, balanced spaces |
| Vibe scale, lively end | `#E8763D` | Warm amber, lively/bustling spaces |
| Text, dark | `#1A1A1A` | Headlines, names |
| Text, muted | `#8A8A82` | Subtitles, secondary info |
| Background | `#FAFAF8` | The app's main background, warm off-white, never pure white |
| Line/border | `#EEEEEE` | Card borders, dividers |
| Panel/tag background | `#F1F0EC` | Neutral tag chips, amenity backgrounds |

**The one rule that matters most**: a space's own color is never picked by hand. It's always calculated from real data (how quiet or lively people say it is). Green is the only color that's "hardcoded," and it's reserved for the app itself, not any specific place.

### Fonts

| Font | Used for | Never used for |
|---|---|---|
| Grandstander (bold, rounded, playful) | Headlines, space names, buttons, section labels | Long paragraphs, data numbers |
| Varela Round | Everyday body text, descriptions, form fields, list items | Headlines |
| Reenie Beanie (hand-written script) | Only two things: the tagline under the logo, and a space's one-line "personality" description | Anything functional, buttons, data, navigation |

### The logo

- The word "POPPIN," in Grandstander, bold
- The dot over the "i" is replaced by a small location-pin shape, filled in App Green
- That pin dot has a small continuous bounce animation, it never sits perfectly still
- On the very first launch only, it does a bigger "pop" (scales in fast with a few confetti pieces flying out) before settling down, this only happens once per install, not every time the app opens

---

## Part 2: Every screen, in order

### Screen 1: Onboarding
Shown once, the very first time someone opens the app. Never shown again after.

**What's on it, top to bottom:**
- Faint hand-sketched background drawings: a smiling sun, two trees, a small fountain, a person walking a dog, a person about to throw a frisbee (all drawn in a single thin gray-brown line, no color, just texture)
- The logo (large size)
- The tagline, in the script font: "what's poppin in your neighborhood?"
- One line of body text: "Find your perfect spot to read, work, hang, or just vibe, right now." (the word "vibe" is colored in App Green)
- One button: "Let's go"
- One small reassurance line under the button: "No account needed to look around"

**What it does NOT have:** no sign-up form, no map, no mention of "helping the city collect data," that framing is intentionally left out of this first screen.

---

### Screen 2: Discover (the main/home screen)
What you land on right after onboarding, and every time you reopen the app after that.

**Top bar:**
- Small logo (top left)
- A search icon in a green-outlined box (top right), tapping it opens a search field

**The map:**
- A real, zoomable street map of the whole city
- A handful of colored pins, these are the real, active spaces (currently just the 5 Cornell Tech pilot spots)
- A big cluster of small gray dots, these represent the other roughly 390 real NYC public spaces that exist but aren't turned on yet
- A floating button that says "Drop a pin," for posting a live activity (see Screen 4)

**Right under the map:** a thin color bar labeled "Quiet" on one end and "Lively" on the other, this is the legend explaining what the pin colors mean

**Below that, a list:**
- A heading that says either "3 spots within a 10-minute vibe check" (only when that's actually true, calculated from real walking distance) or the plain fallback "POPS I can walk to"
- A card for each real, active space: name, a couple of words about how it feels right now, a percentage badge, a colored strip on the left

**What happens when you tap things:**
- Tap a colored pin or a card, opens that space's profile (Screen 3)
- Tap a gray "coming soon" pin, a small message pops up: "[space name] is a real NYC POPS, we just haven't gotten to it yet. Check back soon!"
- Tap the gray pin cluster with a number on it, zooms in and splits into individual pins

---

### Screen 3: A space's profile
What you see after tapping into one specific space.

This screen has two tabs at the top: Vibe and Details. Only one is visible at a time, so you never have to scroll far.

**Tab 1: Vibe** (this is the one people land on by default)
- A photo at the top (currently a placeholder gray box, needs real photos, see Asset List below)
- Written directly on the photo, in the script font: the space's one-line personality description, like "the quiet reader's corner"
- The space's name, in Grandstander
- A small sound player: a play button, a waveform graphic, and the clip length
- A small "Explore in 3D" row (currently just shows an alert message, needs to be connected to a real scan, see Asset List)
- Three sliders, each showing a gradient bar from one end to the other:
  1. Quiet to Lively
  2. Open seating to Crowded
  3. Welcoming to Closed off
- On each slider: a small white dot shows what everyone else has said on average. A dark-ringed circle is yours to drag, wherever you drag it (or tap) becomes your rating
- One button at the bottom: "Submit my read & get directions"

**Tab 2: Details**
- A row of amenities (icons plus words, like "seating," "wifi," "shade")
- A "Food nearby" placeholder box (currently empty, needs real content)
- A row of tag bubbles under "What would make this better," each one is something people wish the space had, tap one to add your vote, or type your own idea and add it
- Two buttons under "Share your spot": "Add a photo" and "Add a recording"

---

### Screen 4: Dropping a live activity pin
Opens when you tap the "Drop a pin" button on the Discover screen.

**What's on it:**
- Two big options to choose from:
  - "Pick an icon" (a fast option, shows a grid of 12 small icons to choose from: music, frisbee/spikeball, pizza, sunset, chess, books, a dog, art, yoga, a soccer ball, a camera, a microphone)
  - "Snap a photo" (upload a real photo instead of picking an icon)
- A text field for the activity's name (e.g. "UNO night")
- A text field for a short message, written casually, like texting a friend
- A dropdown for how long it lasts: 20 minutes, 30 minutes, 1 hour, or 2 hours
  - Important rule: if you chose "snap a photo," the time automatically gets capped at 30 minutes max, even if you try to pick longer, because a "live" photo shouldn't be allowed to claim to be live for hours
- A button: "Post it"

After posting, a small pulsing green pin appears on the map at that spot.

Tapping a live pin opens a card showing: the icon or photo, the activity name, a countdown of minutes left, the message, how many people have said they're in, and a button: "I'm in"

---

## Part 3: Screens that are designed but not built yet

### Passport (not in the app yet)
A private page, just for the person using the app, showing a stamp for every space they've rated. Never shown to anyone else, never ranked or turned into a leaderboard. Has its own header: "Your passport" with the subtitle "Private to you. Not shared or ranked."

### True 3D pin placement (partially built, not connected)
A separate, working test page already exists where you can look around a real 3D scan of a Cornell Tech space and tap directly on it to drop a pin exactly where you tapped. This isn't hooked up to the main app yet, right now "Explore in 3D" on a profile just shows a placeholder message.

---

## UI assets that already exist as real files

These aren't descriptions, they're actual SVG files (with PNG previews below) pulled directly from the same code running in the app, so they're pixel-consistent with what's live. They ship alongside this document in a `poppin-assets` folder, `logo/`, `illustrations/`, and `icons/` subfolders.

### Logo

| Asset | Preview | File |
|---|---|---|
| Wordmark | ![wordmark](poppin-assets/logo/poppin-wordmark.png) | `logo/poppin-wordmark.svg` |
| App icon | ![app icon](poppin-assets/logo/poppin-app-icon.png) | `logo/poppin-app-icon.svg` |

### Onboarding illustrations

| Asset | Preview | File |
|---|---|---|
| Sun | ![sun](poppin-assets/illustrations/sun.png) | `illustrations/sun.svg` |
| Tree | ![tree](poppin-assets/illustrations/tree.png) | `illustrations/tree.svg` |
| Fountain | ![fountain](poppin-assets/illustrations/fountain.png) | `illustrations/fountain.svg` |
| Dog walker | ![dog walker](poppin-assets/illustrations/dog-walker.png) | `illustrations/dog-walker.svg` |
| Frisbee throw | ![frisbee](poppin-assets/illustrations/frisbee-throw.png) | `illustrations/frisbee-throw.svg` |

These are the exact placeholder line-art pieces currently live on the onboarding screen, simple, single-weight stroke in muted warm gray. They're intentionally simple stand-ins, the polished real illustration set is still on the "still needed" list below.

### UI icons

| Asset | Preview | File |
|---|---|---|
| Search | ![search](poppin-assets/icons/icon-search.png) | `icons/icon-search.svg` |
| Back | ![back](poppin-assets/icons/icon-back.png) | `icons/icon-back.svg` |
| Save (heart) | ![heart](poppin-assets/icons/icon-heart.png) | `icons/icon-heart.svg` |
| Play | ![play](poppin-assets/icons/icon-play.png) | `icons/icon-play.svg` |
| Chair (seating match) | ![chair](poppin-assets/icons/icon-chair.png) | `icons/icon-chair.svg` |

These are real, clean SVG paths, easy to recolor or resize, meant to replace the emoji currently standing in for these icons in the live app code.

---

## Part 4: Every asset still needed

This is the honest list of real content the app is waiting on. Everything below is currently either a gray placeholder box or missing entirely.

| Asset | Needed for | Status |
|---|---|---|
| Real photos of each of the 5 active spaces | Profile photo header, "Share your spot" gallery | Missing, currently gray boxes |
| Real sound recordings of each space | The "Hear the space" player | Missing, currently a fake static waveform |
| The 3 named 3D scans, linked to their matching space | "Explore in 3D" button | 3 scans exist (one confirmed working, the Cornell Tech scan), not yet linked into the main app or named for the other two |
| Cute names for all 3 scanned spaces | Same as above | 2 named so far: "Queensboro View" and "Geese Haven," third still needs a name |
| "Food nearby" content per space | Details tab | Missing entirely, currently an empty gray box |
| A real app icon graphic (for home screen or app store, if ever needed) | Outside the app itself | Not started |

---

## How to use this document

Treat this as the source of truth for "what should this look like and say." If you or I change a color, a piece of copy, or add a screen, update this file in the same sitting, don't let it drift out of date. For the more technical, code-level status (what's actually live in Supabase versus still a plan), that's truth.md, this document and that one are meant to be read together, this one for what it should look like, that one for what's actually built.
