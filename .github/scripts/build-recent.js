// Rebuilds contributors/recent.json: contributors whose folder was touched
// by a commit in the last WINDOW_DAYS, newest first.
//
// "Touched" means any commit changing contributors/<username>/**, so both
// a brand new card and an update to an existing one count. This needs full
// git history (fetch-depth: 0 in the workflow) — a shallow checkout would
// report every folder as touched "now", by the checkout commit itself.

const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const CONTRIBUTORS_DIR = "contributors";
const OUTPUT_PATH = path.join(CONTRIBUTORS_DIR, "recent.json");
const WINDOW_DAYS = 14;

// Same rule as build-manifest.js: a folder only counts if it has a
// card.json, since that's what actually shows up on the site.
function listContributorFolders(dir) {
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .filter((name) => fs.existsSync(path.join(dir, name, "card.json")));
}

// ISO 8601 author date of the most recent commit touching this folder, or
// null if git has no history for it.
function lastActivity(folder) {
  const out = execFileSync(
    "git",
    ["log", "-1", "--format=%aI", "--", path.join(CONTRIBUTORS_DIR, folder)],
    { encoding: "utf8" }
  ).trim();
  return out || null;
}

function buildRecent(folders, now = new Date()) {
  const cutoff = now.getTime() - WINDOW_DAYS * 24 * 60 * 60 * 1000;

  return folders
    .map((username) => ({ username, date: lastActivity(username) }))
    .filter((entry) => entry.date && new Date(entry.date).getTime() >= cutoff)
    .sort((a, b) => new Date(b.date) - new Date(a.date));
}

module.exports = { buildRecent, listContributorFolders, WINDOW_DAYS };

if (require.main === module) {
  const recent = buildRecent(listContributorFolders(CONTRIBUTORS_DIR));
  fs.writeFileSync(OUTPUT_PATH, `${JSON.stringify(recent, null, 2)}\n`);
  console.log(`${recent.length} contributor(s) active in the last ${WINDOW_DAYS} days`);
}
