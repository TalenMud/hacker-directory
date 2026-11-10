(function () {
  function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str == null ? "" : String(str);
    return div.innerHTML;
  }

  async function loadLocations() {
    const res = await fetch("contributors/locations.json");
    if (!res.ok) throw new Error("Could not load locations.json");
    return res.json();
  }

  function popupTemplate(person) {
    const github = person.github ? `https://github.com/${person.github}` : null;
    const avatar = github ? `${github}.png?size=64` : null;

    return `
      <div class="map-popup">
        ${avatar ? `<img class="map-popup-avatar" src="${avatar}" alt="${escapeHtml(person.name)}" loading="lazy" onerror="this.style.display='none'" />` : ""}
        <div>
          <div class="map-popup-name">${escapeHtml(person.name)}</div>
          <div class="map-popup-location">${escapeHtml(person.location)}</div>
          <a class="map-popup-link" href="contributors/${escapeHtml(person.username)}/index.html">view profile →</a>
        </div>
      </div>
    `;
  }

  function showEmpty(message) {
    const mapEl = document.getElementById("map");
    const empty = document.getElementById("map-empty");
    if (mapEl) mapEl.style.display = "none";
    if (empty) {
      if (message) empty.textContent = message;
      empty.style.display = "block";
    }
  }

  async function init() {
    const mapEl = document.getElementById("map");
    if (!mapEl) return;

    let locations = [];
    try {
      locations = await loadLocations();
    } catch (e) {
      console.error(e);
      showEmpty("Couldn't load the map right now. Try refreshing?");
      return;
    }

    if (locations.length === 0) {
      showEmpty();
      return;
    }

    // Standard OSM tiles are fine at this repo's traffic level. If this map
    // ever gets busy, swap the tile URL for a provider meant for production
    // use — the OSM policy asks hobby/low-traffic projects only.
    // https://operations.osmfoundation.org/policies/tiles/
    const map = L.map(mapEl, { scrollWheelZoom: false }).setView([20, 0], 2);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 18,
    }).addTo(map);

    const bounds = [];
    locations.forEach((person) => {
      L.marker([person.lat, person.lng]).addTo(map).bindPopup(popupTemplate(person));
      bounds.push([person.lat, person.lng]);
    });

    if (bounds.length > 1) map.fitBounds(bounds, { padding: [40, 40], maxZoom: 6 });
  }

  document.addEventListener("DOMContentLoaded", init);
})();
