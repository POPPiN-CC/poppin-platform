# POPPiN: 3D space

**Status: Shell.** Structure and pattern are here; working code is not yet built.

## What you will build

A portal within the POPPiN site that asks for the visitor's location, checks whether they are inside a specific polygon (in this case, a privately owned public space), and shows a different interface depending on whether they are inside, or outside. This interface will present a 3D model of a specific POPS. Inside a POPS the page will allow users to add content (images, recordings, emojis, drawings etc.) tied to specific locations within the model; outside, users can view the 3D space with user submitions.

## Prerequisites

- A code editor and a browser
- A GeoJSON of the POPS boundary or boundaries you want to test against. NYC POPS boundaries: https://data.cityofnewyork.us/City-Government/Privately-Owned-Public-Space-POPS/rvih-nhyn (points, so you will need to draft your own polygons or buffer them)
- For the proof of concept, specifically submitted GeoJSON polygons.

## The pattern

Three ingredients:

1. **Location** from the browser's Geolocation API.
2. **Geometry** you carry with the site (a GeoJSON in `assets/data/`).
3. **A decision function** that returns a state (`inside`, `outside`) and drives the UI.
4. **3D Scans** of each site (a .obj in `assets/scans/`).
4. **User submissions** are allowed to be placed by users who are in the site. (images, videos, recordings)

## Data sources

- NYC POPS point dataset: https://data.cityofnewyork.us/City-Government/Privately-Owned-Public-Space-POPS/rvih-nhyn

## API notes

**Browser Geolocation API**

```js
navigator.geolocation.getCurrentPosition(
  pos => { const { latitude, longitude, accuracy } = pos.coords; },
  err => { /* handle denied, timeout, unavailable */ },
  { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 }
);
```

Notes:
- Requires HTTPS. `http://localhost` works too.
- User must grant permission each session in some browsers.
- Accuracy on desktop is often 5 to 30 km (IP-based). On mobile with GPS, 5 to 50 m.
- Use `watchPosition` to react to movement, not `getCurrentPosition`.

**Turf.js**

```html
<script src="https://cdn.jsdelivr.net/npm/@turf/turf@6.5.0/turf.min.js"></script>
```

```js
const point = turf.point([longitude, latitude]);
const inside = turf.booleanPointInPolygon(point, popsPolygon);
```

## Walkthrough (outline)

1. **Page shell** with three states: `#waiting`, `#outside`, `#inside`. All hidden except `#waiting`.
2. **Load POPS GeoJSON** on page load.
3. **Request geolocation** with a clear reason ("We need your location to check whether you are inside this public space").
4. **Decide state** using Turf. If inside any polygon, set `state = 'inside'`. If within 100 m of any polygon, `state = 'near'`. Otherwise, `state = 'far'`.
5. **Swap UI** by toggling classes on `<body>`.
6. **Watch position** and re-decide whenever the user moves more than 10 m.

## UI patterns to try

- **Inside:** unlock the ability to add to the site
- **Far:** show a map with all POPS and allow users to view the 3d space with user submissions
- **Manual Entry:** a backdoor that lets users pretend to be in the GeoFenced area (for administrative use

## Extensions

- **Time zones.** Change the interface based on the time of day too. A POPS is legally required to be publicly accessible during specific hours; show that state.

## Common pitfalls

- **HTTPS required.** GitHub Pages serves HTTPS by default. Custom domains need a valid cert.
- **Denied permission.** Have a manual location entry fallback.
- **Accuracy on desktop.** Test on your phone. Desktop GPS is essentially useless.
- **Turf bundle size.** `turf.min.js` is ~500KB. If you only need `booleanPointInPolygon`, import that module directly.
