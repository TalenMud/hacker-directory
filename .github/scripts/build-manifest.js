// Rebuilds contributors/manifest.json from the folders that are actually there.
//
// The manifest sets the order of the cards on the homepage, so entries that
// are already correct keep their place. This only fixes the ones whose
// spelling doesn't match their folder, drops the ones whose folder is gone,
// and appends the ones nobody added.
//
// The spelling matters more than it looks: GitHub Pages serves from a
// case-sensitive filesystem, so a manifest entry of "ExampleUser" pointing at a
// folder called "exampleuser" 404s — and assets/directory.js drops a card it
// can't fetch without saying anything, so the person just isn't on the site.

const fs = require("fs");
const path = require("path");

const CONTRIBUTORS_DIR = "contributors";
const MANIFEST_PATH = path.join(CONTRIBUTORS_DIR, "manifest.json");

// A contributor folder is one with a card.json in it — that's the file the
// homepage fetches, so a folder without one has nothing to put on the grid.
function listContributorFolders(dir) {
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .filter((name) => fs.existsSync(path.join(dir, name, "card.json")));
}

function buildManifest(current, folders) {
  const byLowercase = new Map(folders.map((folder) => [folder.toLowerCase(), folder]));
  const kept = new Set();
  const manifest = [];

  for (const entry of current) {
    if (typeof entry !== "string") continue;
    const folder = byLowercase.get(entry.toLowerCase());
    if (!folder || kept.has(folder)) continue;
    kept.add(folder);
    manifest.push(folder);
  }

  // Anyone who didn't add themselves goes on the end, alphabetically, so the
  // result doesn't depend on the order the filesystem happened to hand us.
  const missing = folders.filter((folder) => !kept.has(folder));
  manifest.push(...missing.sort((a, b) => a.localeCompare(b)));

  return manifest;
}

module.exports = { buildManifest, listContributorFolders };

if (require.main === module) {
  let current = [];
  try {
    const raw = fs.readFileSync(MANIFEST_PATH, "utf8");
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      current = parsed;
    } else {
      console.warn(
        `${MANIFEST_PATH} should contain an array of usernames. Rebuilding from folders…`
      );
    }
  } catch (e) {
    console.warn(`Could not read ${MANIFEST_PATH}: ${e.message}`);
    console.warn("Rebuilding manifest from contributor folders…");
  }

  const manifest = buildManifest(current, listContributorFolders(CONTRIBUTORS_DIR));

  // Emptying the manifest would take the whole directory off the homepage. If
  // it comes to that, something is wrong with the checkout rather than with
  // the repo, so stop instead of committing it.
  if (manifest.length === 0 && current.length > 0) {
    console.error("Refusing to empty the manifest: no contributor folder has a card.json.");
    process.exit(1);
  }

  // Spell out what moved, so the commit isn't a mystery in the run log.
  const before = new Set(current);
  const after = new Set(manifest);
  for (const name of current) if (!after.has(name)) console.log(`- ${name}`);
  for (const name of manifest) if (!before.has(name)) console.log(`+ ${name}`);

  fs.writeFileSync(MANIFEST_PATH, `${JSON.stringify(manifest, null, 2)}\n`);
  console.log(`${manifest.length} contributors in the manifest`);
}
