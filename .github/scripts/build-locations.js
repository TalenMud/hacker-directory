// Rebuilds contributors/locations.json: approximate coordinates for
// contributors who opted in with a "location" field in their card.json.
//
// Geocoding happens here, at build time, so no third-party API calls are
// ever made from a visitor's browser. A location string is only looked up
// once — contributors/locations.json doubles as the cache, so re-runs only
// pay the Nominatim cost for locations nobody has resolved yet.

const fs = require("fs");
const path = require("path");

const CONTRIBUTORS_DIR = "contributors";
const OUTPUT_PATH = path.join(CONTRIBUTORS_DIR, "locations.json");
const MANIFEST_PATH = path.join(CONTRIBUTORS_DIR, "manifest.json");

// Nominatim's usage policy caps this at one request/second and asks for a
// descriptive User-Agent, not a browser string.
// https://operations.osmfoundation.org/policies/nominatim/
const GEOCODE_DELAY_MS = 1100;
const USER_AGENT = "hacker-directory-contributor-map (https://github.com/TalenMud/hacker-directory)";

// Round to ~1 decimal degree (roughly 11km) so a specific address pasted by
// mistake still only ever shows up at city precision.
const COORD_PRECISION = 1;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function round(n) {
  const factor = 10 ** COORD_PRECISION;
  return Math.round(n * factor) / factor;
}

async function geocode(location) {
  const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(location)}`;
  const res = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
  if (!res.ok) throw new Error(`Nominatim returned ${res.status}`);
  const results = await res.json();
  if (results.length === 0) return null;
  return { lat: round(Number(results[0].lat)), lng: round(Number(results[0].lon)) };
}

function loadUsernames() {
  return JSON.parse(fs.readFileSync(MANIFEST_PATH, "utf8"));
}

function loadCard(username) {
  const cardPath = path.join(CONTRIBUTORS_DIR, username, "card.json");
  if (!fs.existsSync(cardPath)) return null;
  try {
    return JSON.parse(fs.readFileSync(cardPath, "utf8"));
  } catch (e) {
    return null;
  }
}

function loadExisting() {
  if (!fs.existsSync(OUTPUT_PATH)) return [];
  try {
    return JSON.parse(fs.readFileSync(OUTPUT_PATH, "utf8"));
  } catch (e) {
    return [];
  }
}

async function buildLocations(usernames, { geocodeFn = geocode, delay = sleep } = {}) {
  const existing = loadExisting();
  const cacheByLocation = new Map(existing.map((e) => [e.location.toLowerCase(), { lat: e.lat, lng: e.lng }]));

  const entries = [];
  for (const username of usernames) {
    const card = loadCard(username);
    const location = card && typeof card.location === "string" ? card.location.trim() : "";
    if (!location) continue;

    let coords = cacheByLocation.get(location.toLowerCase());
    if (!coords) {
      try {
        coords = await geocodeFn(location);
      } catch (e) {
        console.warn(`Could not geocode "${location}" for ${username}: ${e.message}`);
        coords = null;
      }
      await delay(GEOCODE_DELAY_MS);
    }

    if (!coords) continue;
    entries.push({
      username,
      name: card.name || username,
      github: card.github || username,
      location,
      lat: coords.lat,
      lng: coords.lng,
    });
  }

  return entries.sort((a, b) => a.username.localeCompare(b.username));
}

module.exports = { buildLocations, geocode, loadUsernames };

if (require.main === module) {
  (async () => {
    const locations = await buildLocations(loadUsernames());
    fs.writeFileSync(OUTPUT_PATH, `${JSON.stringify(locations, null, 2)}\n`);
    console.log(`${locations.length} contributor(s) with a location set`);
  })();
}
