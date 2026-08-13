(function () {
  const PAGE_SIZE = 20;

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
    const key = `${isLightTheme() ? "light" : "dark"}:${tag}`;
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

  // #149 fix: one fetch instead of manifest.json + N per-contributor card.json fetches.
  async function loadContributors() {
    const res = await fetch("contributors/people.json");
    if (!res.ok) throw new Error("Could not load people.json");
    return res.json();
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

  // #150: filtering always runs over the full `people` list, never the
  // currently-paginated slice — search/tag filters shouldn't miss people
  // who just haven't been paged into view yet.
  function filterPeople(people, filterState) {
    const query = filterState.query.trim().toLowerCase();
    const activeTag = filterState.tag;

    return people.filter((p) => {
      const matchesTag = !activeTag || (p.tags || []).includes(activeTag);
      if (!matchesTag) return false;
      if (!query) return true;
      const haystack = [p.name, p.role, p.university, p.company, p.bio, ...(p.tags || [])]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(query);
    });
  }

  // #150: renders only filterState.visibleCount of the filtered set, and
  // shows/hides the "Load more" button depending on whether more remain.
  function render(people, filterState) {
    const grid = document.getElementById("grid");
    const empty = document.getElementById("empty-state");
    const loadMoreWrap = document.getElementById("load-more-wrap");
    const loadMoreBtn = document.getElementById("load-more");

    const filtered = filterPeople(people, filterState);

    if (filtered.length === 0) {
      grid.innerHTML = "";
      empty.style.display = "block";
      loadMoreWrap.style.display = "none";
      return;
    }

    empty.style.display = "none";

    const visible = filtered.slice(0, filterState.visibleCount);
    grid.innerHTML = visible.map((p, i) => cardTemplate(p, i)).join("");

    const remaining = filtered.length - visible.length;
    if (remaining > 0) {
      loadMoreWrap.style.display = "block";
      loadMoreBtn.textContent = `Load more (${remaining} left)`;
    } else {
      loadMoreWrap.style.display = "none";
    }
  }

  function buildTagFilters(people, filterState, onChange) {
    const container = document.getElementById("tag-filters");
    const tagCounts = {};
    const displayTag = {}; // lowercase → first-seen casing
    people.forEach((p) => (p.tags || []).forEach((t) => {
      const key = t.toLowerCase();
      tagCounts[key] = (tagCounts[key] || 0) + 1;
      if (!displayTag[key]) displayTag[key] = t;
    }));
  
  // Simple debounce helper: delays `fn` until `wait` ms after the last call.
  function debounce(fn, wait) {
    let t = null;
    return function (...args) {
      const ctx = this;
      if (t) clearTimeout(t);
      t = setTimeout(() => fn.apply(ctx, args), wait);
    };
  }
    const topTags = Object.entries(tagCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 12)
      .map(([key]) => displayTag[key]);

    const allPill = document.createElement("button");
    allPill.className = "filter-pill active";
    allPill.textContent = "All";
    allPill.addEventListener("click", () => {
      filterState.tag = null;
      filterState.visibleCount = PAGE_SIZE;
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
        filterState.tag = filterState.tag === tag ? null : tag;
        filterState.visibleCount = PAGE_SIZE; // #150: reset pagination on filter change
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
    const filterState = { query: "", tag: null, visibleCount: PAGE_SIZE };

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
    people.forEach((p) => (p.tags || []).forEach((t) => uniqueTags.add(t.toLowerCase())));
    document.getElementById("stat-tags").textContent = uniqueTags.size;

    const rerender = () => render(people, filterState);
    buildTagFilters(people, filterState, rerender);

    const search = document.getElementById("search");
    // Debounce the search input so filtering only runs after the user pauses typing.
    const debouncedSearch = debounce((value) => {
      filterState.query = value;
      filterState.visibleCount = PAGE_SIZE; // #150: reset pagination on new search
      rerender();
    }, 200); // 200ms is a good middle-ground between responsiveness and work

    search.addEventListener("input", () => {
      debouncedSearch(search.value);
    });

    const loadMoreBtn = document.getElementById("load-more");
    loadMoreBtn.addEventListener("click", () => {
      filterState.visibleCount += PAGE_SIZE;
      rerender();
    });

    const themeToggle = document.getElementById("theme-toggle");
    if (themeToggle) themeToggle.addEventListener("click", () => setTimeout(rerender, 0));

    rerender();
  }

  document.addEventListener("DOMContentLoaded", init);
})();