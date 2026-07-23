// Generator: reads the real NYC POPS dataset and the 3 pilot GeoJSON polygons, writes
// TWO seed SQL files. Run with: node scripts/generate-pops-seed.js
//
// 1. pops-seed.sql            — the 392 real spaces (3 active pilots + 389 coming-soon),
//                                each with a deterministic id, its real POPS_Number, and a
//                                simulated `noise` reading.
// 2. pops-simulated-data.sql  — the engagement layer (ratings + activity rows) that makes
//                                computeLiveliness() in index.html actually vary space to
//                                space instead of sitting at a flat neutral 50 everywhere.
//
// Why simulated data at all: there are no noise sensors and very little real user data
// during this pilot, but the app's whole premise is that pin color always means something
// true. So every value here is an EDUCATED GUESS grounded in each space's real attributes
// (Public_Space_Type + Amenities_Required + Permitted_Amenities + Borough from the CSV) —
// not random. A leafy Residential Plaza reads calm; a Subway-adjacent Retail Plaza reads
// loud and busy. See the rule engine below for the exact reasoning per signal.
//
// Both files are IDEMPOTENT (`on conflict ... do nothing`) and fully DETERMINISTIC: every id
// and every simulated value is derived from the space's own POPS_Number via a seeded PRNG, so
// re-running this script always regenerates byte-identical SQL. No random() anywhere.
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = path.join(__dirname, '..');

function parseCSV(text) {
  const rows = [];
  let row = [], field = '', inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i], next = text[i + 1];
    if (inQuotes) {
      if (c === '"' && next === '"') { field += '"'; i++; }
      else if (c === '"') { inQuotes = false; }
      else field += c;
    } else {
      if (c === '"') inQuotes = true;
      else if (c === ',') { row.push(field); field = ''; }
      else if (c === '\r') { /* skip */ }
      else if (c === '\n') { row.push(field); rows.push(row); row = []; field = ''; }
      else field += c;
    }
  }
  if (field.length || row.length) { row.push(field); rows.push(row); }
  return rows;
}

function sqlString(value) {
  if (value === null || value === undefined || value === '') return 'null';
  return "'" + String(value).replace(/'/g, "''") + "'";
}

function sqlArray(value) {
  if (!value) return 'null';
  const items = value.split(';').map(s => s.trim()).filter(s => s && s !== 'None');
  if (!items.length) return 'null';
  return 'ARRAY[' + items.map(i => sqlString(i)).join(',') + ']::text[]';
}

function centroid(geojsonPath) {
  const fc = JSON.parse(fs.readFileSync(geojsonPath, 'utf8'));
  const ring = fc.features[0].geometry.coordinates[0];
  const pts = ring.slice(0, -1); // drop the closing point (same as the first)
  const sum = pts.reduce((a, [lng, lat]) => ({ lng: a.lng + lng, lat: a.lat + lat }), { lng: 0, lat: 0 });
  return { lat: sum.lat / pts.length, lng: sum.lng / pts.length };
}

function chunk(arr, size) {
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

// ---------------------------------------------------------------------------------------
// Deterministic identity: every id and every "random" value below is derived from a space's
// own POPS_Number (verified unique across all 392 CSV rows), so re-running this generator
// always produces the exact same output — safe to commit, diff, and re-run.
// ---------------------------------------------------------------------------------------

// A stable, valid-looking uuid (RFC 4122 v5-shaped) derived from a string. Not cryptographic,
// just needs to be deterministic and effectively collision-free for ~400 spaces x a few
// child rows each.
function uuidFromString(input) {
  const hash = crypto.createHash('sha1').update('poppin:' + input).digest('hex');
  const bytes = hash.slice(0, 32).match(/.{2}/g).map(h => parseInt(h, 16));
  bytes[6] = (bytes[6] & 0x0f) | 0x50; // version 5
  bytes[8] = (bytes[8] & 0x3f) | 0x80; // RFC 4122 variant
  const hex = bytes.map(b => b.toString(16).padStart(2, '0')).join('');
  return [hex.slice(0, 8), hex.slice(8, 12), hex.slice(12, 16), hex.slice(16, 20), hex.slice(20, 32)].join('-');
}

// FNV-1a string hash -> 32-bit seed int, feeding a mulberry32 PRNG. Good enough for seeded
// jitter (not cryptography) — same string always yields the same sequence of floats.
function seedFromString(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}
function mulberry32(seed) {
  let a = seed;
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function rngFor(popsNumber) { return mulberry32(seedFromString(popsNumber)); }

function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
function rand(rng, min, max) { return min + rng() * (max - min); }
function pick(rng, arr) { return arr[Math.floor(rng() * arr.length)]; }
function shuffle(rng, arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ---------------------------------------------------------------------------------------
// The rule engine — this is where a space's real attributes become "educated guesses" about
// what it feels like. `type` is the raw Public_Space_Type text (semicolon-separated, may be
// blank for the 3 pilots). `amenitiesText` is Amenities_Required + Permitted_Amenities
// joined (or, for pilots, their hand-curated `amenities` tags), lowercased.
// "armchair"/"shade"/"scenic" are the pilots' own vocabulary for seating/calm-outdoor cues
// that the CSV expresses as "Seating"/"Planting" — both are folded into the same checks so
// the pilots run through the identical engine as the 389 real spaces, not a special case.
// ---------------------------------------------------------------------------------------
function hasSeating(am) { return am.includes('seating') || am.includes('tables') || am.includes('armchair'); }
function hasCalmOutdoor(am) { return am.includes('planting') || am.includes('trees') || am.includes('water feature') || am.includes('shade') || am.includes('scenic'); }
function hasFood(am) { return am.includes('food service') || am.includes('open air cafe'); }
function hasTables(am) { return am.includes('tables'); } // distinct from general seating — chess/board games need a flat surface
function hasTrees(am) { return am.includes('tree'); } // "Trees within Space" / "Trees on Street" specifically, for wildlife-adjacent activities
function isPlazaLike(type) { return /plaza|open|park/.test(type); }

// Interactions: a real, meaningful count — "how many times has something actually been
// logged here" (see the pops.interactions migration in supabase-schema.sql) — NOT the 1-5
// distinct activities shown in a space's "Activities Here" grid, but the total volume behind
// them. Each repeat post of the same activity tag already increments wishes.votes in the live
// app (submitActivity does an update+1, not a new row); this is that idea taken seriously and
// given a realistic range: a few for obscure spaces, "dozens" typical, 100+ for standouts.
// Most real POPS are genuinely obscure (base starts low), with a long right tail — raising a
// 0-1 draw to the 4th power skews it hard toward 0, so occasional high rolls create real
// outliers instead of a uniform spread.
//
// This is also the SHARED latent factor behind noise/crowd/rating-count below (via
// popularityPctFrom) — without a shared cause, each of those was independently jittered off
// type/amenities alone, and averaging several independently-jittered mid-range signals
// mathematically pulls the Liveliness composite toward the middle even harder than any one
// of them, which is why it was clustering.
function computeInteractions(typeStr, amenitiesText, borough, rng) {
  const type = (typeStr || '').toLowerCase();
  const am = (amenitiesText || '').toLowerCase();
  // First build a 0-100 "buzz" score, same grounded-plus-long-tail shape used elsewhere —
  // then run it through a power curve (below) rather than multiplying it directly, since a
  // direct multiply made "over 100" the outcome for nearly half of all spaces instead of a
  // minority of standouts.
  let buzz = 6; // low enough that a bare arcade/residential space can bottom out near the floor
  if ((borough || '').toLowerCase() === 'manhattan') buzz += rand(rng, 4, 12);
  if (/plaza/.test(type)) buzz += rand(rng, 4, 12);
  if (hasFood(am) || am.includes('retail frontage')) buzz += rand(rng, 6, 16);
  if (am.includes('subway')) buzz += rand(rng, 10, 22);
  if (am.includes('artwork') || am.includes('programs')) buzz += rand(rng, 4, 10);
  if (/arcade|residential/.test(type)) buzz -= rand(rng, 4, 10);
  buzz += Math.pow(rng(), 3) * 42; // usually small, occasionally a big standout boost
  buzz = clamp(buzz, 2, 100);
  // Power curve (exponent > 1) compresses the low-mid range into single digits/dozens and
  // only lets the top slice of buzz scores cross 100 — "some might have over 100" as a
  // genuine minority, not roughly half.
  const interactions = Math.pow(buzz / 100, 1.25) * 175 + rand(rng, 0, 4);
  return clamp(Math.round(interactions), 2, 320);
}

// Rescales the real interactions count back to a 0-100 percentile-ish scale for the noise/
// crowd/rating-count formulas below, which were tuned in 0-100 space. ~130 interactions
// saturates to 100 — above the "dozens" typical case, so most spaces land in a healthy
// spread here rather than everything pinning at the cap.
function popularityPctFrom(interactions) {
  return clamp(interactions / 1.3, 0, 100);
}

function computeBaseSignals(typeStr, amenitiesText, popularityPct, rng) {
  const type = (typeStr || '').toLowerCase();
  const am = (amenitiesText || '').toLowerCase();

  // noise: sheltered/indoor space families read quiet; open street-facing ones read loud;
  // transit/food/retail adjacency pushes it up; greenery/water pulls it back down. Base
  // ranges are wider than they look at first glance (up to their amenity boosts/damps), and
  // popularity pulls the result further toward its own extreme — a popular subway plaza can
  // now genuinely land in the 80s-90s, an obscure arcade in the low teens, instead of
  // everything settling into the same 30-65 middle band.
  let noise;
  if (/arcade|covered|enclosed|concourse|galleria/.test(type)) noise = rand(rng, 12, 38);
  else if (/residential plaza/.test(type)) noise = rand(rng, 20, 45);
  else if (/sidewalk widening|through block|pedestrian circulation|open air|open-air/.test(type)) noise = rand(rng, 45, 75);
  else if (/plaza/.test(type)) noise = rand(rng, 35, 65);
  else noise = rand(rng, 25, 60);
  if (am.includes('subway')) noise += rand(rng, 10, 15);
  if (am.includes('escalator')) noise += rand(rng, 5, 10);
  if (hasFood(am)) noise += rand(rng, 5, 10);
  if (am.includes('retail frontage')) noise += rand(rng, 3, 7);
  if (hasCalmOutdoor(am)) noise -= rand(rng, 5, 10);
  noise += (popularityPct - 30) * 0.45;
  noise = clamp(Math.round(noise), 4, 97);

  // crowd: literally what footfall means, so it's driven MORE by popularity than by noise —
  // noise stays a secondary, correlated influence (a loud space usually is a busy one) rather
  // than crowd being a near-copy of it, which is what collapsed their combined spread before.
  let crowd = popularityPct * 0.65 + noise * 0.2 + rand(rng, 0, 12);
  if (am.includes('subway') || am.includes('retail frontage')) crowd += rand(rng, 5, 10);
  if (hasFood(am)) crowd += rand(rng, 4, 8);
  crowd = clamp(Math.round(crowd), 3, 98);

  // safety (higher = safer): lighting/restrooms/retail eyes-on-the-street/climate control
  // and residential context all read safer; a bare, amenity-less through-block space reads
  // less safe. Not a Liveliness input, so left as its own independent axis — no clustering
  // complaint applied here, no need to entangle it with popularity.
  let safety = rand(rng, 62, 72);
  if (am.includes('lighting')) safety += rand(rng, 3, 8);
  if (am.includes('restroom')) safety += rand(rng, 2, 5);
  if (am.includes('retail frontage')) safety += rand(rng, 2, 6);
  if (am.includes('climate control')) safety += rand(rng, 2, 5);
  if (/residential/.test(type)) safety += rand(rng, 3, 6);
  if (am.includes('none') && /sidewalk widening|through block/.test(type)) safety -= rand(rng, 8, 15);
  safety = clamp(Math.round(safety), 15, 96);

  // welcome (higher = welcoming): amenity richness is the whole signal here — the more a
  // space offers to linger for, the more welcoming it reads. Also not a Liveliness input.
  let welcome = rand(rng, 40, 55);
  if (hasSeating(am)) welcome += rand(rng, 4, 9);
  if (hasFood(am)) welcome += rand(rng, 4, 9);
  if (am.includes('planting')) welcome += rand(rng, 4, 9);
  if (am.includes('artwork')) welcome += rand(rng, 4, 9);
  if (am.includes('water feature')) welcome += rand(rng, 4, 9);
  if (am.includes('drinking fountain')) welcome += rand(rng, 4, 9);
  if (am.includes('none')) welcome -= rand(rng, 10, 18);
  welcome = clamp(Math.round(welcome), 10, 96);

  return { noise, crowd, safety, welcome };
}

// How many simulated ratings a space gets, driven by popularity — busy, well-known spaces
// accumulate many ratings (a stable, confident average); obscure ones stay thin (as low as 2),
// which is itself realistic texture (a 2-rating average is noisier than a 25-rating one).
// Feeds the map thinning priority too (thinMarkersForView keeps more-rated pins first).
function computeRatingCount(popularityPct, rng) {
  const n = 2 + Math.pow(popularityPct / 100, 1.4) * rand(rng, 20, 34);
  return clamp(Math.round(n), 2, 34);
}

// Activity rows: which of the app's 8 ACTIVITY_CATEGORIES (index.html) plausibly get logged
// here, based on what the space actually offers. Each entry is ONE distinct real activity
// (not a whole category) with its own gating condition and a couple of tag-text variants for
// flavor — a space can log several different activities from the SAME category (e.g. both
// "chess" and "frisbee" under sports), unlike the old one-tag-per-category scheme. Every tag
// string is unique across the whole list so two matched rules for the same space can never
// collide into a duplicate wishes row. Several rules per category are intentionally always-
// true/loosely-gated so even a bare "None"-amenity space still gets a plausible, varied mix
// rather than only ever logging "being" activities.
const ACTIVITY_RULES = [
  // work
  { category: 'work', test: am => hasSeating(am), tags: ['reading here', 'reading a paperback'] },
  { category: 'work', test: am => hasSeating(am), tags: ['laptop work', 'answering emails'] },
  { category: 'work', test: am => hasSeating(am), tags: ['studying outside', 'cramming for an exam'] },
  { category: 'work', test: am => hasSeating(am), tags: ['journaling', 'sketchnoting the day'] },
  { category: 'work', test: () => true, tags: ['a quick phone call', 'catching up on a podcast'] },

  // being
  { category: 'being', test: () => true, tags: ['just vibing', 'soaking it in'] },
  { category: 'being', test: () => true, tags: ['people-watching', 'watching the world go by'] },
  { category: 'being', test: () => true, tags: ['taking a break', 'a breather between errands'] },
  { category: 'being', test: () => true, tags: ['napping in the sun', 'catching some rays'] },
  { category: 'being', test: () => true, tags: ['daydreaming', 'zoning out for a bit'] },
  { category: 'being', test: () => true, tags: ['waiting for someone', 'killing time before a meeting'] },

  // food
  { category: 'food', test: am => hasFood(am), tags: ['coffee break', 'an espresso to go'] },
  { category: 'food', test: am => hasFood(am) || hasSeating(am), tags: ['lunch outside', 'eating lunch al fresco'] },
  { category: 'food', test: am => hasFood(am) || am.includes('retail frontage'), tags: ['grabbing a snack', 'a quick bite'] },
  { category: 'food', test: am => hasFood(am), tags: ['an ice cream break', 'a gelato stop'] },
  { category: 'food', test: () => true, tags: ['people-watching with a snack', 'a bag of chips on a bench'] },
  { category: 'food', test: (am, type) => /plaza/.test(type), tags: ['browsing a food cart', 'checking out the food trucks'] },

  // arts
  { category: 'arts', test: am => am.includes('artwork'), tags: ['checking out the art', 'admiring the sculpture'] },
  { category: 'arts', test: (am, type) => hasCalmOutdoor(am) || am.includes('artwork'), tags: ['sketching', 'a quick pencil sketch'] },
  { category: 'arts', test: (am, type) => /plaza|concourse/.test(type), tags: ['live music', 'stopping for a busker'] },
  { category: 'arts', test: am => hasCalmOutdoor(am), tags: ['plein air painting', 'painting outdoors'] },
  { category: 'arts', test: (am, type) => am.includes('programs') || /plaza/.test(type), tags: ['a poetry reading', 'spoken word'] },
  { category: 'arts', test: (am, type) => isPlazaLike(type), tags: ['street photography', 'taking photos'] },

  // social
  { category: 'social', test: am => hasSeating(am), tags: ['meeting friends', 'catching up with a friend'] },
  { category: 'social', test: (am, type) => hasSeating(am) && /plaza/.test(type), tags: ['a group hang', 'meeting up with the crew'] },
  { category: 'social', test: am => hasSeating(am), tags: ['a birthday picnic', 'a small celebration'] },
  { category: 'social', test: am => hasSeating(am), tags: ['a book club meetup', 'a reading group'] },
  { category: 'social', test: am => hasFood(am) && hasSeating(am), tags: ['a coffee date', 'a first date'] },
  { category: 'social', test: am => hasSeating(am), tags: ['a team lunch', 'catching up with coworkers'] },

  // civic
  { category: 'civic', test: am => am.includes('programs'), tags: ['a community event', 'a scheduled program'] },
  { category: 'civic', test: (am, type) => am.includes('programs') || /plaza/.test(type), tags: ['a neighborhood meetup', 'a block association meeting'] },
  { category: 'civic', test: () => true, tags: ['a volunteer cleanup', 'picking up litter'] },
  { category: 'civic', test: (am, type) => /plaza/.test(type), tags: ['a petition table', 'gathering signatures'] },
  { category: 'civic', test: (am, type) => /plaza|urban plaza/.test(type), tags: ['a farmers market stop', 'browsing market stalls'] },
  { category: 'civic', test: am => am.includes('programs'), tags: ['a voter registration table', 'registering to vote'] },

  // nature
  { category: 'nature', test: am => hasTrees(am), tags: ['bird watching', 'spotting a hawk'] },
  { category: 'nature', test: am => hasTrees(am), tags: ['squirrel watching', 'counting squirrels'] },
  { category: 'nature', test: am => am.includes('planting'), tags: ['a garden stroll', 'looking at the plantings'] },
  { category: 'nature', test: am => am.includes('water feature'), tags: ['watching the fountain', 'listening to the water'] },
  { category: 'nature', test: am => hasCalmOutdoor(am), tags: ['a dog walk', 'walking the dog'] },
  { category: 'nature', test: () => true, tags: ['a fresh air break', 'getting some fresh air'] },
  { category: 'nature', test: am => hasCalmOutdoor(am), tags: ['cloud watching', 'watching the sky'] },

  // sports
  { category: 'sports', test: am => hasTables(am), tags: ['a game of chess', 'chess with a stranger'] },
  { category: 'sports', test: am => hasTables(am), tags: ['a board game', 'a deck of cards'] },
  { category: 'sports', test: (am, type) => isPlazaLike(type), tags: ['frisbee', 'tossing a frisbee'] },
  { category: 'sports', test: (am, type) => /skate/.test(type), tags: ['skating', 'practicing tricks'] },
  { category: 'sports', test: (am, type) => isPlazaLike(type), tags: ['hacky sack', 'a pickup game'] },
  { category: 'sports', test: (am, type) => hasCalmOutdoor(am) || /plaza/.test(type), tags: ['yoga', 'a quick stretch'] },
  { category: 'sports', test: (am, type) => isPlazaLike(type), tags: ['jump rope', 'a jump-rope session'] }
];

// Majority 3-5 activities, some spaces only 1-2 — matches real logging patterns better than a
// flat range: most spaces get a fuller mix, a minority (typically the most amenity-bare ones)
// only support a couple of plausible activities.
function pickActivityCount(rng) {
  const r = rng();
  if (r < 0.10) return 1;
  if (r < 0.25) return 2;
  if (r < 0.55) return 3;
  if (r < 0.85) return 4;
  return 5;
}

// Splits `total` into `n` positive integer shares that sum EXACTLY to total (largest-
// remainder method on randomized weights) — so a space's shown activities' vote counts are
// guaranteed consistent with its stored interactions total, not two independently-drawn
// numbers that only approximately match. Shares come out organically uneven (some activities
// clearly more logged than others at the same space) rather than a flat even split.
function splitTotal(total, n, rng) {
  if (n <= 1) return [total];
  const weights = Array.from({ length: n }, () => rng() + 0.15);
  const wsum = weights.reduce((a, b) => a + b, 0);
  const raw = weights.map(w => (w / wsum) * total);
  const shares = raw.map(Math.floor);
  let remainder = total - shares.reduce((a, b) => a + b, 0);
  const byFraction = raw.map((v, i) => ({ i, frac: v - Math.floor(v) })).sort((a, b) => b.frac - a.frac);
  for (let k = 0; k < remainder; k++) shares[byFraction[k % n].i]++;
  return shares.map(v => Math.max(1, v));
}

function pickActivities(typeStr, amenitiesText, interactions, rng) {
  const type = (typeStr || '').toLowerCase();
  const am = (amenitiesText || '').toLowerCase();
  const pool = shuffle(rng, ACTIVITY_RULES.filter(r => r.test(am, type)));
  // Never show more distinct activities than total logs — a space with 4 lifetime interactions
  // can't plausibly have 5 distinct activities on record. Always at least 1 (pool always has
  // >=1 match via the 'being' catch-all rule, and interactions is always >=2).
  const take = Math.max(1, Math.min(pool.length, pickActivityCount(rng), interactions));
  const chosen = pool.slice(0, take);
  const votes = splitTotal(interactions, chosen.length, rng);
  return chosen.map((r, i) => ({
    category: r.category,
    tag: pick(rng, r.tags),
    votes: votes[i]
  }));
}

function buildRatingsRows(popsId, popsNumber, base, count, rng) {
  const rows = [];
  for (let i = 0; i < count; i++) {
    const jitter = () => rand(rng, -12, 12);
    rows.push({
      id: uuidFromString(popsNumber + ':rating:' + i),
      pops_id: popsId,
      safety: clamp(Math.round(base.safety + jitter()), 0, 100),
      crowd: clamp(Math.round(base.crowd + jitter()), 0, 100),
      welcome: clamp(Math.round(base.welcome + jitter()), 0, 100)
    });
  }
  return rows;
}

function buildWishRows(popsId, popsNumber, activities) {
  // id keys off the tag, not the category — a space can now log several different activities
  // from the same category (e.g. both "chess" and "frisbee" under sports), and every tag
  // string across ACTIVITY_RULES is unique by construction, so this can't collide the way
  // keying off category alone did (that produced duplicate primary keys whenever 2+ picks
  // shared a category — a real bug caught by spot-checking generated output, not just stats).
  return activities.map(a => ({
    id: uuidFromString(popsNumber + ':activity:' + a.tag),
    pops_id: popsId,
    tag: a.tag,
    category: a.category,
    votes: a.votes
  }));
}

// ---- the 3 real pilot spaces, not in the official CSV (zero registered POPS on
// Roosevelt Island), lat/lng from their GeoJSON polygon centroids ----
const PILOTS = [
  {
    name: 'Queensboro View', geojson: 'Assets/GIS/Queensboro_View.geojson', scanSlug: 'queensboro-view',
    description: 'A quiet overlook with sightlines to the Queensboro Bridge.',
    amenities: ['sun', 'armchair', 'scenic'], hours: '7am to 9:30pm daily',
    best_time: 'Early evening, as the light hits the bridge'
  },
  {
    name: 'Squirrel Grove', geojson: 'Assets/GIS/Squirrel_Grove.geojson', scanSlug: 'squirrel-grove',
    description: 'A shaded grove with a long communal table.',
    amenities: ['shade', 'seating', 'armchair'], hours: '7am to 9:30pm daily',
    best_time: 'Midday, when the grove is liveliest'
  },
  {
    name: 'Tata Green', geojson: 'Assets/GIS/Tata_Green.geojson', scanSlug: 'tata-green',
    description: 'Open lawn with movable seating.',
    amenities: ['sun', 'wifi', 'armchair'], hours: '7am to 9:30pm daily',
    best_time: 'Weekday mornings, before campus fills up'
  }
];

const popsLines = [];
const simRatings = [];
const simWishes = [];

popsLines.push('-- Generated by scripts/generate-pops-seed.js from Assets/Data/Privately_Owned_Public_Spaces.csv');
popsLines.push('-- and the 3 pilot GeoJSON polygons. Do not hand-edit; re-run the generator instead.');
popsLines.push('-- id is a deterministic uuid derived from each space\'s POPS_Number (pilots: from their scan');
popsLines.push('-- slug), so re-running this script and re-running these inserts is always safe (on conflict');
popsLines.push('-- do nothing) — nothing is ever duplicated, and nothing here ever deletes existing rows.');
popsLines.push('');
popsLines.push('-- The 3 real pilot spaces (status = active), lat/lng are their GeoJSON polygon centroids.');
popsLines.push('-- scan_slug links each to its 3d-space/?scan=<slug> page. noise is simulated (see header');
popsLines.push('-- comment in generate-pops-seed.js) — no sensor hardware exists for this pilot.');
popsLines.push('insert into pops (id, pops_number, name, description, lat, lng, amenities, best_time, hours, status, scan_slug, noise, interactions) values');
popsLines.push(PILOTS.map(p => {
  const c = centroid(path.join(ROOT, p.geojson));
  const popsNumber = 'PILOT-' + p.scanSlug.toUpperCase();
  const id = uuidFromString('pilot:' + p.scanSlug);
  const rng = rngFor(popsNumber);
  const amenitiesText = p.amenities.join(';');
  const interactions = computeInteractions('', amenitiesText, '', rng);
  const popularityPct = popularityPctFrom(interactions);
  const base = computeBaseSignals('', amenitiesText, popularityPct, rng);
  const ratingCount = computeRatingCount(popularityPct, rng);
  buildRatingsRows(id, popsNumber, base, ratingCount, rng).forEach(r => simRatings.push(r));
  buildWishRows(id, popsNumber, pickActivities('', amenitiesText, interactions, rng)).forEach(w => simWishes.push(w));
  return '  (' + [
    sqlString(id), sqlString(popsNumber), sqlString(p.name), sqlString(p.description), c.lat, c.lng,
    'ARRAY[' + p.amenities.map(sqlString).join(',') + ']::text[]',
    sqlString(p.best_time), sqlString(p.hours), sqlString('active'), sqlString(p.scanSlug), base.noise, interactions
  ].join(', ') + ')';
}).join(',\n') + '\non conflict (id) do nothing;');
popsLines.push('');

const csv = fs.readFileSync(path.join(ROOT, 'Assets/Data/Privately_Owned_Public_Spaces.csv'), 'utf8');
const rows = parseCSV(csv);
const header = rows[0];
const idx = name => header.indexOf(name);
const col = {
  popsNumber: idx('POPS_Number'),
  borough: idx('Borough'),
  buildingName: idx('Building_Name'),
  address: idx('Building_Address_With_Zip_Code'),
  spaceType: idx('Public_Space_Type'),
  hours: idx('Hour_Of_Access_Required'),
  amenitiesRequired: idx('Amenities_Required'),
  permittedAmenities: idx('Permitted_Amenities'),
  lat: idx('Latitude'),
  lng: idx('Longitude')
};
const data = rows.slice(1).filter(r => r.length === header.length && r[col.lat] && r[col.lng]);

popsLines.push('-- The 389 real NYC POPS from the official dataset, shown but not yet active. noise is');
popsLines.push('-- simulated the same way as the pilots\' — see generate-pops-seed.js header comment.');
popsLines.push('insert into pops (id, pops_number, name, building_name, building_address, public_space_type, lat, lng, hours, amenities_required, permitted_amenities, status, noise, interactions) values');
popsLines.push(data.map(r => {
  const name = r[col.buildingName] || r[col.address] || 'Unnamed POPS';
  const popsNumber = r[col.popsNumber];
  const id = uuidFromString(popsNumber);
  const rng = rngFor(popsNumber);
  const amenitiesText = (r[col.amenitiesRequired] || '') + ';' + (r[col.permittedAmenities] || '');
  const interactions = computeInteractions(r[col.spaceType], amenitiesText, r[col.borough], rng);
  const popularityPct = popularityPctFrom(interactions);
  const base = computeBaseSignals(r[col.spaceType], amenitiesText, popularityPct, rng);
  const ratingCount = computeRatingCount(popularityPct, rng);
  buildRatingsRows(id, popsNumber, base, ratingCount, rng).forEach(row => simRatings.push(row));
  buildWishRows(id, popsNumber, pickActivities(r[col.spaceType], amenitiesText, interactions, rng)).forEach(w => simWishes.push(w));
  return '  (' + [
    sqlString(id), sqlString(popsNumber), sqlString(name), sqlString(r[col.buildingName]), sqlString(r[col.address]), sqlString(r[col.spaceType]),
    r[col.lat], r[col.lng], sqlString(r[col.hours]),
    sqlArray(r[col.amenitiesRequired]), sqlArray(r[col.permittedAmenities]), sqlString('coming_soon'), base.noise, interactions
  ].join(', ') + ')';
}).join(',\n') + '\non conflict (id) do nothing;');
popsLines.push('');

const popsOutPath = path.join(ROOT, 'pops-seed.sql');
fs.writeFileSync(popsOutPath, popsLines.join('\n'));

// ---------------------------------------------------------------------------------------
// pops-simulated-data.sql — the engagement layer. Chunked into batches of 500 rows per
// INSERT purely to keep individual statements a reasonable size to paste/run; behavior is
// identical to one giant statement.
// ---------------------------------------------------------------------------------------
const simLines = [];
simLines.push('-- Generated by scripts/generate-pops-seed.js — the simulated engagement layer (ratings +');
simLines.push('-- activity rows) that feeds computeLiveliness() in index.html. Every value is an educated');
simLines.push('-- guess derived from each space\'s real Public_Space_Type/amenities, not random — see the');
simLines.push('-- rule engine comments in generate-pops-seed.js for the reasoning per signal.');
simLines.push('-- Do not hand-edit; re-run the generator instead. Idempotent (on conflict do nothing) and');
simLines.push('-- purely additive — never deletes. Requires pops-seed.sql to have been run first.');
simLines.push('');
simLines.push('-- Ratings: safety/crowd/welcome, jittered per row around each space\'s computed tendency.');
chunk(simRatings, 500).forEach(part => {
  simLines.push('insert into ratings (id, pops_id, safety, crowd, welcome) values');
  simLines.push(part.map(r => '  (' + [sqlString(r.id), sqlString(r.pops_id), r.safety, r.crowd, r.welcome].join(', ') + ')').join(',\n') + '\non conflict (id) do nothing;');
  simLines.push('');
});
simLines.push('-- Activities: one row per plausible logged activity, kind=\'activity\', category is one of');
simLines.push('-- ACTIVITY_CATEGORIES\' ids in index.html.');
chunk(simWishes, 500).forEach(part => {
  simLines.push("insert into wishes (id, pops_id, tag, kind, category, votes) values");
  simLines.push(part.map(w => '  (' + [sqlString(w.id), sqlString(w.pops_id), sqlString(w.tag), sqlString('activity'), sqlString(w.category), w.votes].join(', ') + ')').join(',\n') + '\non conflict (pops_id, tag, kind) do nothing;');
  simLines.push('');
});

const simOutPath = path.join(ROOT, 'pops-simulated-data.sql');
fs.writeFileSync(simOutPath, simLines.join('\n'));

console.log('Wrote ' + popsOutPath + ' — ' + PILOTS.length + ' pilot rows + ' + data.length + ' CSV rows = ' + (PILOTS.length + data.length) + ' total pops.');
console.log('Wrote ' + simOutPath + ' — ' + simRatings.length + ' rating rows + ' + simWishes.length + ' activity rows.');
