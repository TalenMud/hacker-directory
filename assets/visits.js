(function () {
  // Free, keyless hit counter (https://countapi.mileshilliard.com) — CORS-enabled,
  // no backend of our own needed. Only counted on the canonical deployed site so
  // local dev, forks, and PR previews don't inflate the shared number.
  const COUNTER_KEY = "talenmud.github.io-hacker-directory-visits";
  const CANONICAL_HOST = "talenmud.github.io";

  function hideStat() {
    const wrap = document.getElementById("stat-visits-wrap");
    if (wrap) wrap.style.display = "none";
  }

  async function trackVisit() {
    if (location.hostname !== CANONICAL_HOST) {
      hideStat();
      return;
    }
    try {
      const res = await fetch(`https://countapi.mileshilliard.com/api/v1/hit/${COUNTER_KEY}`);
      if (!res.ok) throw new Error(`counter request failed: ${res.status}`);
      const data = await res.json();
      const el = document.getElementById("stat-visits");
      if (el) el.textContent = Number(data.value).toLocaleString();
    } catch (e) {
      console.warn("Visit counter unavailable", e);
      hideStat();
    }
  }

  document.addEventListener("DOMContentLoaded", trackVisit);
})();
