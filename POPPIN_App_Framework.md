# POPPIN app framework

---

## Part 1: The design basics (audit all pages to match visual consistency)

### Colors

| Name | Hex code | Where it's used |
|---|---|---|
| App green | `#1FBF6B` | The logo, the header search button, generic buttons that aren't tied to one specific space |
| Liveliness scale, quiet end | `#0EA5A0` | Cool teal-green, for very quiet spaces |
| Liveliness scale, mid | `#7FBF3F` | Yellow-green, balanced spaces |
| Liveliness scale, lively end | `#E8763D` | Warm amber, lively/bustling spaces |
| Text, dark | `#1A1A1A` | Headlines, names |
| Text, muted | `#8A8A82` | Subtitles, secondary info |
| Background | `#FAFAF8` | The app's main background, warm off-white, never pure white |
| Line/border | `#EEEEEE` | Card borders, dividers |
| Panel/tag background | `#F1F0EC` | Neutral tag chips, amenity backgrounds |

**Dynamic Coloring**: each space is given a color determined by data. It's always calculated from real data (how quiet or lively people say it is). This will be reflected in the map icons for the spaces. Green is the only color that's "hardcoded," and it's reserved for the app itself, not any specific place.

### Fonts

| Font | Used for | Never used for |
|---|---|---|
| Grandstander (bold, rounded, playful) | Headlines, space names, buttons, section labels | Long paragraphs, data numbers |
| Varela Round | Everyday body text, descriptions, form fields, list items | Headlines |
| Reenie Beanie (hand-written script) | Only two things: the tagline under the logo, and a space's one-line "personality" description | Anything functional, buttons, data, navigation |

### The logo

- The word "POPPIN," in Grandstander, bold
- The dot over the "i" is replaced by a small balloon icon in assets/vectors
- That balloon dot has a small continuous bounce animation, it never sits perfectly still

---
## Part 2: The Data stored for each POPS

### Basic Info
Name, Address, opening hours, 





## Part 2: Every screen

### Screen 1: Welcome
Shown on loading the site.

**What's on it, top to bottom:**
- Faint hand-sketched background drawings: a smiling sun, two trees, a small fountain, a person walking a dog, a person about to throw a frisbee (all drawn in a single thin gray-brown line, no color, just texture)
- The logo (large size)
- The tagline, in the script font: "what's poppin in your neighborhood?"
- One line of body text: "Find your perfect spot to read, work, hang, or just vibe, right now." (the word "vibe" is colored in App Green)
- One button: "Let's go"



---

### Screen 2: Discover (the main/home screen)
What you land on right after welcome.

**Top bar:**
- Small logo (top left)
- A search icon in a green-outlined box (top right), tapping it opens a search field. It searches POPS by: POPS name, map location
- A filter toggle that opens a filter menu for three categories: Distance, Liveliness, Actvities.
  -Distance from user by: 5-minute walk (0.4 miles), 10-minute walk (0.8 miles), 15-minute walk (1.5miles)
  -Liveliness is based off the number of peoples in the POPS and the number of activities logged there recently.
  -ACtivities are in the broad categories: WOrk and Focus, Arts and Culture, Social and Group, Food and Leisure, Community and Civic, Sports and Games, Nature and Animals, Just Being There. Activities are in these categories, but can be more specifically logged by users

**The map:**
- A real, zoomable street map of the whole city. Use https://api.maptiler.com/maps/topo-v4/?key=vtjgKwXzB0PXf3QnsdSn#15.1/40.75202/-73.96056
- The map will be the full screen of the app
- A handful of pins, these are the real, active spaces (currently just the 3 Cornell Tech pilot spots)
- The other real POPS pins, that are not part of the pilot but will show up as normal like the rest
- The colors of the pins is based on the Liveliness scale of each POPS


**Below that, a list:**
- A pullable list tucked away at the base of the screen, with a handle to pull up (reference is google maps phone interface)
- By default, this will show you the 5 closest POPS
- This will show the results of the search or filters
- For each POPS in the list, it displays under the name: ammenity icons, current activities

**What happens when you tap things:**
- Tap a colored pin or a POPS from the list, opens that space's profile (Screen 3)
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
