// Simulated firewall packet stream — packets flow left to right toward a
// firewall line; each is scored against simple "traffic shape" rules and
// flagged normal / malicious in real time.

(function () {
  let W = 640;
  const H = 360;
  let WALL_X = W - 80;

  let canvas, ctx;
  let packets = [];
  let total = 0;
  let blocked = 0;
  let speedMultiplier = 1;
  const speedLevels = [1, 3, 6];
  let speedIdx = 0;
  let running = true;
  let spawnTimer = 0;

  function isLight() {
    return document.documentElement.getAttribute("data-theme") === "light";
  }

  function rand(min, max) {
    return Math.random() * (max - min) + min;
  }

  function makePacket() {
    // Each packet has a few "traffic shape" features. Malicious packets are
    // drawn from a distribution with unusual size / port / burst timing.
    const isMalicious = Math.random() < 0.28;
    const size = isMalicious ? rand(0.75, 1) : rand(0, 0.55);
    const portOddity = isMalicious ? rand(0.6, 1) : rand(0, 0.4);
    const burst = isMalicious ? rand(0.5, 1) : rand(0, 0.5);

    // Score = simple weighted rule combination (toy IDS logic).
    const score = 0.4 * size + 0.35 * portOddity + 0.25 * burst;
    const flagged = score > 0.5;

    return {
      x: -20,
      y: rand(40, H - 40),
      vy: rand(-0.15, 0.15),
      r: 5 + size * 4,
      isMalicious,
      flagged,
      score,
      resolved: false,
      fade: 1,
    };
  }

  function resetStream() {
    packets = [];
    total = 0;
    blocked = 0;
    updateStats();
  }

  function updateStats() {
    const totalEl = document.getElementById("firewall-total");
    const blockedEl = document.getElementById("firewall-blocked");
    const rateEl = document.getElementById("firewall-rate");
    if (totalEl) totalEl.textContent = total.toLocaleString();
    if (blockedEl) blockedEl.textContent = blocked.toLocaleString();
    if (rateEl)
      rateEl.textContent =
        total > 0 ? `${((blocked / total) * 100).toFixed(1)}%` : "–";
  }

  function step() {
    spawnTimer++;
    if (spawnTimer > 14) {
      spawnTimer = 0;
      packets.push(makePacket());
    }

    for (const pkt of packets) {
      if (pkt.resolved) {
        pkt.fade -= 0.04;
        continue;
      }
      pkt.x += 2.2;
      pkt.y += pkt.vy;
      pkt.y = Math.max(30, Math.min(H - 30, pkt.y));

      if (pkt.x >= WALL_X) {
        pkt.resolved = true;
        total++;
        if (pkt.flagged) blocked++;
        updateStats();
      }
    }

    packets = packets.filter((pkt) => pkt.fade > 0);
  }

  function draw() {
    const light = isLight();
    ctx.fillStyle = light ? "#fffaf3" : "#080808";
    ctx.fillRect(0, 0, W, H);

    // Firewall line
    ctx.strokeStyle = light ? "#d94f4f" : "#ff5c5c";
    ctx.lineWidth = 3;
    ctx.setLineDash([8, 6]);
    ctx.beginPath();
    ctx.moveTo(WALL_X, 10);
    ctx.lineTo(WALL_X, H - 28); // stop short of the bottom so the label has clear space
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.font = "11px monospace";
    ctx.fillStyle = light ? "#8a5a5a" : "#ff9f9f";
    const label = "firewall";
    const labelWidth = ctx.measureText(label).width;
    // Keep the label to the left of the line with a clear gap, but never
    // let it run off the left edge of the canvas either.
    const labelX = Math.max(
      4,
      Math.min(WALL_X - labelWidth - 10, W - labelWidth - 4),
    );
    ctx.fillText(label, labelX, H - 14);

    for (const pkt of packets) {
      let color;
      if (!pkt.resolved) {
        color = pkt.isMalicious
          ? light
            ? "#e05c2f"
            : "#ff9f43"
          : light
            ? "#3fa9e0"
            : "#4d8bff";
      } else {
        color = pkt.flagged
          ? light
            ? "#d94f4f"
            : "#ff5c5c"
          : light
            ? "#2fa88f"
            : "#33d9c1";
      }
      ctx.globalAlpha = pkt.resolved ? Math.max(0, pkt.fade) : 1;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(pkt.x, pkt.y, pkt.r, 0, Math.PI * 2);
      ctx.fill();

      if (pkt.resolved && pkt.flagged) {
        ctx.strokeStyle = color;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(pkt.x - 6, pkt.y - 6);
        ctx.lineTo(pkt.x + 6, pkt.y + 6);
        ctx.moveTo(pkt.x + 6, pkt.y - 6);
        ctx.lineTo(pkt.x - 6, pkt.y + 6);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    }
  }

  function loop() {
    if (running) {
      for (let i = 0; i < speedMultiplier; i++) step();
      draw();
    }
    requestAnimationFrame(loop);
  }

  function resize() {
    const holder = document.getElementById("firewall-canvas-wrap");
    if (!holder || !canvas) return;
    const containerW = holder.getBoundingClientRect().width || 640;
    W = Math.max(280, Math.min(640, Math.floor(containerW)));
    WALL_X = W - 80;
    canvas.width = W;
    canvas.height = H;
  }

  function init() {
    const holder = document.getElementById("firewall-canvas-wrap");
    if (!holder) return;
    canvas = document.createElement("canvas");
    holder.appendChild(canvas);
    ctx = canvas.getContext("2d");
    requestAnimationFrame(resize);
    window.addEventListener("resize", resize);

    const resetBtn = document.getElementById("firewall-reset");
    const speedBtn = document.getElementById("firewall-speed");
    if (resetBtn) resetBtn.addEventListener("click", resetStream);
    if (speedBtn) {
      speedBtn.addEventListener("click", () => {
        speedIdx = (speedIdx + 1) % speedLevels.length;
        speedMultiplier = speedLevels[speedIdx];
        speedBtn.textContent = `speed: ${speedMultiplier}×`;
      });
    }

    resetStream();
    loop();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
