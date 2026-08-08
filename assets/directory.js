(function () {
  const ACCENT_PAIRS_DARK = [
    ["#3ef2a1", "#4d8bff"],
    ["#ff5cb3", "#a56dff"],
    ["#ffd23f", "#ff8c37"],
    ["#33d9c1", "#3ef2a1"],
    ["#4d8bff", "#a56dff"],
    ["#ff8c37", "#ff5252"],
  ];

  const ACCENT_PAIRS_LIGHT = [
    ["#ff9dc9", "#d9b3ff"],
    ["#ffc39a", "#ff9dc9"],
    ["#b3d9ff", "#d9b3ff"],
    ["#9ee8c9", "#b3d9ff"],
    ["#d9b3ff", "#ff9dc9"],
    ["#ffc39a", "#9ee8c9"],
  ];

  const PILL_PALETTE_DARK = ["#3ef2a1", "#4d8bff", "#ff5cb3", "#ffd23f", "#33d9c1", "#a56dff", "#ff8c37"];
  const PILL_PALETTE_LIGHT = ["#ff6fa8", "#8a63e6", "#3fa9e0", "#e08a3f", "#2fb894", "#e0538c", "#7a8fd6"];

  const PILL_COLORS = {};

  function isLightTheme() {
    return document.documentElement.getAttribute("data-theme") !== "dark";
  }

  function accentPairs() {
    return isLightTheme() ? ACCENT_PAIRS_LIGHT : ACCENT_PAIRS_DARK;
  }

  function pillColorFor(tag) {
    const normalizedTag = (tag || "").trim().toLowerCase();
    const key = `${isLightTheme() ? "light" : "dark"}:${normalizedTag}`;
    if (!PILL_COLORS[key]) {
      const palette = isLightTheme() ? PILL_PALETTE_LIGHT : PILL_PALETTE_DARK;
      const seenForTheme = Object.keys(PILL_COLORS).filter((k) => k.startsWith(isLightTheme() ? "light:" : "dark:")).length;
      PILL_COLORS[key] = palette[seenForTheme % palette.length];
    }
    return PILL_COLORS[key];
  }

  function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str == null ? "" : String(str);
    return div.innerHTML;
  }

  function initials(name) {
    return (name || "?")
      .split(" ")
      .map((p) => p[0])
      .filter(Boolean)
      .slice(0, 2)
      .join("")
      .toUpperCase();
  }

  async function loadContributors() {
    const manifestRes = await fetch("contributors/manifest.json");
    if (!manifestRes.ok) throw new Error("Could not load manifest.json");
    const usernames = await manifestRes.json();

    const cards = await Promise.all(
      usernames.map(async (username) => {
        try {
          const res = await fetch(`contributors/${username}/card.json`);
          if (!res.ok) return null;
          const data = await res.json();
          return { username, ...data };
        } catch (e) {
          console.warn(`Failed to load card for ${username}`, e);
          return null;
        }
      })
    );

    return cards.filter(Boolean);
  }

  function cardTemplate(person, index) {
    const pairs = accentPairs();
    const [c1, c2] = pairs[index % pairs.length];
    const tags = Array.isArray(person.tags) ? person.tags : [];
    const orgLine = [person.role, person.university || person.company]
      .filter(Boolean)
      .join(" · ");
    const github = person.github ? `https://github.com/${person.github}` : null;
    const avatar = github ? `${github}.png?size=104` : null;

    return `
      <a class="card" href="contributors/${escapeHtml(person.username)}/index.html" style="--card-accent-1:${c1}; --card-accent-2:${c2}">
        <div class="card-top">
          ${
            avatar
              ? `<img class="avatar" src="${avatar}" alt="${escapeHtml(person.name)}" loading="lazy" onerror="this.style.display='none'" />`
              : `<div class="avatar" style="display:grid;place-items:center;font-weight:700;color:${c1}">${escapeHtml(initials(person.name))}</div>`
          }
          <div>
            <div class="card-name">${escapeHtml(person.name || person.username)}</div>
            ${person.role ? `<div class="card-role">${escapeHtml(person.role)}</div>` : ""}
          </div>
        </div>
        ${person.university || person.company ? `<div class="card-org">${escapeHtml(person.university || person.company)}</div>` : ""}
        ${person.bio ? `<div class="card-bio">${escapeHtml(person.bio)}</div>` : ""}
        <div class="pills">
          ${tags
            .slice(0, 6)
            .map((t) => `<span class="pill" style="--pill-color:${pillColorFor(t)}">${escapeHtml(t)}</span>`)
            .join("")}
        </div>
        <div class="card-footer">
          <span>@${escapeHtml(person.username)}</span>
          <span class="arrow">view profile →</span>
        </div>
      </a>
    `;
  }

  function render(people, filterState) {
    const grid = document.getElementById("grid");
    const empty = document.getElementById("empty-state");
    const query = filterState.query.trim().toLowerCase();
    const activeTag = filterState.tag;

    const filtered = people.filter((p) => {
      const matchesTag =
        !activeTag ||
        (p.tags || []).some((t) => t.toLowerCase().trim() === activeTag.toLowerCase().trim());
      if (!matchesTag) return false;
      if (!query) return true;
      const haystack = [p.name, p.role, p.university, p.company, p.bio, ...(p.tags || [])]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(query);
    });

    if (filtered.length === 0) {
      grid.innerHTML = "";
      empty.style.display = "block";
      return;
    }

    empty.style.display = "none";
    grid.innerHTML = filtered.map((p, i) => cardTemplate(p, i)).join("");
  }

  function buildTagFilters(people, filterState, onChange) {
    const container = document.getElementById("tag-filters");
    const tagMap = {};

    people.forEach((p) =>
      (p.tags || []).forEach((t) => {
        if (!t) return;
        const lower = t.trim().toLowerCase();
        if (!tagMap[lower]) {
          tagMap[lower] = { count: 0, display: t.trim() };
        }
        tagMap[lower].count += 1;
      })
    );

    const topTags = Object.values(tagMap)
      .sort((a, b) => b.count - a.count)
      .slice(0, 12)
      .map((item) => item.display);

    const allPill = document.createElement("button");
    allPill.className = "filter-pill active";
    allPill.textContent = "All";
    allPill.addEventListener("click", () => {
      filterState.tag = null;
      onChange();
      [...container.children].forEach((c) => c.classList.remove("active"));
      allPill.classList.add("active");
    });
    container.appendChild(allPill);

    topTags.forEach((tag) => {
      const pill = document.createElement("button");
      pill.className = "filter-pill";
      pill.textContent = tag;
      pill.addEventListener("click", () => {
        filterState.tag =
          filterState.tag && filterState.tag.toLowerCase().trim() === tag.toLowerCase().trim()
            ? null
            : tag;
        onChange();
        [...container.children].forEach((c) => c.classList.remove("active"));
        if (filterState.tag) pill.classList.add("active");
        else allPill.classList.add("active");
      });
      container.appendChild(pill);
    });
  }

  async function init() {
    const grid = document.getElementById("grid");
    const filterState = { query: "", tag: null };

    let people = [];
    try {
      people = await loadContributors();
    } catch (e) {
      grid.innerHTML = `<div class="empty-state">Couldn't load the directory right now. Try refreshing?</div>`;
      console.error(e);
      return;
    }

    document.getElementById("stat-count").textContent = people.length;
    const uniqueTags = new Set();
    people.forEach((p) =>
      (p.tags || []).forEach((t) => t && uniqueTags.add(t.trim().toLowerCase()))
    );
    document.getElementById("stat-tags").textContent = uniqueTags.size;

    const rerender = () => render(people, filterState);
    buildTagFilters(people, filterState, rerender);

    const search = document.getElementById("search");
    search.addEventListener("input", () => {
      filterState.query = search.value;
      rerender();
    });

    const themeToggle = document.getElementById("theme-toggle");
    if (themeToggle) themeToggle.addEventListener("click", () => setTimeout(rerender, 0));

    rerender();
  }

  document.addEventListener("DOMContentLoaded", init);
})();