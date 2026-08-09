// Feedforward neural network forward-pass visualizer.
// A small network (input -> hidden -> output) repeatedly runs a forward
// pass on a randomized input vector. Signal pulses travel along edges,
// edge thickness/opacity reflects weight magnitude, node fill reflects
// activation, and the output layer lights up the winning class.

(function () {
  let W = 640;
  const H = 380;

  const LAYER_SIZES = [4, 6, 5, 3];
  let LAYER_X = [80, 260, 440, 580];
  const CLASS_LABELS = ["normal", "suspicious", "malicious"];

  function computeLayerX() {
    const leftMargin = 40;
    const rightMargin = 95; // extra room so output labels ("suspicious") fit inside the canvas
    const usable = W - leftMargin - rightMargin;
    LAYER_X = LAYER_SIZES.map(
      (_, l) => leftMargin + (usable * l) / (LAYER_SIZES.length - 1),
    );
  }

  let canvas, ctx;
  let layers = []; // layers[l] = array of {x, y, activation}
  let weights = []; // weights[l] = matrix [from][to] connecting layer l -> l+1
  let pulses = []; // traveling signal dots {l, from, to, t}
  let running = true;
  let cycle = 0;
  let cycleTimer = 0;
  const CYCLE_LEN = 90;

  function isLight() {
    return document.documentElement.getAttribute("data-theme") === "light";
  }

  function rand(min, max) {
    return Math.random() * (max - min) + min;
  }

  function sigmoid(x) {
    return 1 / (1 + Math.exp(-x));
  }

  function buildNetwork() {
    layers = LAYER_SIZES.map((size, l) => {
      const x = LAYER_X[l];
      const arr = [];
      for (let i = 0; i < size; i++) {
        const y = H / 2 + (i - (size - 1) / 2) * (H / (size + 1.6));
        arr.push({ x, y, activation: 0 });
      }
      return arr;
    });

    weights = [];
    for (let l = 0; l < LAYER_SIZES.length - 1; l++) {
      const fromN = LAYER_SIZES[l];
      const toN = LAYER_SIZES[l + 1];
      const mat = [];
      for (let i = 0; i < fromN; i++) {
        const row = [];
        for (let j = 0; j < toN; j++) row.push(rand(-1, 1));
        mat.push(row);
      }
      weights.push(mat);
    }
  }

  function randomizeInput() {
    for (let i = 0; i < layers[0].length; i++) {
      layers[0][i].activation = rand(0, 1);
    }
  }

  function forwardPass() {
    for (let l = 0; l < weights.length; l++) {
      const fromLayer = layers[l];
      const toLayer = layers[l + 1];
      for (let j = 0; j < toLayer.length; j++) {
        let sum = 0;
        for (let i = 0; i < fromLayer.length; i++) {
          sum += fromLayer[i].activation * weights[l][i][j];
        }
        toLayer[j].activation = sigmoid(sum);
      }
    }
  }

  function spawnPulsesForLayer(l) {
    const fromLayer = layers[l];
    const toLayer = layers[l + 1];
    for (let i = 0; i < fromLayer.length; i++) {
      for (let j = 0; j < toLayer.length; j++) {
        if (Math.random() < 0.55) {
          pulses.push({ l, i, j, t: 0 });
        }
      }
    }
  }

  function startCycle() {
    randomizeInput();
    pulses = [];
    cycleTimer = 0;
    cycle++;
    // Reset downstream activations visually until the pulse arrives.
    for (let l = 1; l < layers.length; l++) {
      for (const n of layers[l]) n.activation = 0;
    }
    spawnPulsesForLayer(0);
    updateStats();
  }

  function updateStats() {
    const stepEl = document.getElementById("nn-passes");
    if (stepEl) stepEl.textContent = cycle.toLocaleString();

    const outLayer = layers[layers.length - 1];
    let maxIdx = 0;
    for (let i = 1; i < outLayer.length; i++) {
      if (outLayer[i].activation > outLayer[maxIdx].activation) maxIdx = i;
    }
    const predEl = document.getElementById("nn-pred");
    const confEl = document.getElementById("nn-conf");
    if (predEl) predEl.textContent = CLASS_LABELS[maxIdx] || "–";
    if (confEl) {
      const total = outLayer.reduce((s, n) => s + n.activation, 0) || 1;
      confEl.textContent = `${((outLayer[maxIdx].activation / total) * 100).toFixed(1)}%`;
    }
  }

  function step() {
    cycleTimer++;

    // Advance pulses.
    const PULSE_SPEED = 0.045;
    for (const p of pulses) p.t += PULSE_SPEED;

    // When pulses for a layer transition complete, compute that layer's
    // activations and spawn the next wave.
    const layerDoneThreshold = 1.0;
    for (let l = 0; l < weights.length; l++) {
      const layerPulses = pulses.filter((p) => p.l === l);
      if (layerPulses.length === 0) continue;
      const allDone = layerPulses.every((p) => p.t >= layerDoneThreshold);
      if (allDone && !layers[l + 1]._computed) {
        // compute this layer's activations from previous layer
        const fromLayer = layers[l];
        const toLayer = layers[l + 1];
        for (let j = 0; j < toLayer.length; j++) {
          let sum = 0;
          for (let i = 0; i < fromLayer.length; i++) {
            sum += fromLayer[i].activation * weights[l][i][j];
          }
          toLayer[j].activation = sigmoid(sum);
        }
        layers[l + 1]._computed = true;
        if (l + 1 < weights.length) spawnPulsesForLayer(l + 1);
        updateStats();
      }
    }

    pulses = pulses.filter((p) => p.t < 1.15);

    if (cycleTimer > CYCLE_LEN && pulses.length === 0) {
      for (const l of layers) l._computed = false;
      startCycle();
    }
  }

  function weightColor(w, light) {
    const alpha = Math.min(1, Math.abs(w));
    if (w >= 0) {
      return light
        ? `rgba(47,168,143,${0.15 + alpha * 0.5})`
        : `rgba(51,217,193,${0.15 + alpha * 0.5})`;
    }
    return light
      ? `rgba(217,79,79,${0.15 + alpha * 0.5})`
      : `rgba(255,92,92,${0.15 + alpha * 0.5})`;
  }

  function draw() {
    const light = isLight();
    ctx.fillStyle = light ? "#fffaf3" : "#080808";
    ctx.fillRect(0, 0, W, H);

    // Edges
    for (let l = 0; l < weights.length; l++) {
      const fromLayer = layers[l];
      const toLayer = layers[l + 1];
      for (let i = 0; i < fromLayer.length; i++) {
        for (let j = 0; j < toLayer.length; j++) {
          const w = weights[l][i][j];
          ctx.strokeStyle = weightColor(w, light);
          ctx.lineWidth = 0.5 + Math.abs(w) * 2.2;
          ctx.beginPath();
          ctx.moveTo(fromLayer[i].x, fromLayer[i].y);
          ctx.lineTo(toLayer[j].x, toLayer[j].y);
          ctx.stroke();
        }
      }
    }

    // Pulses
    for (const p of pulses) {
      const fromLayer = layers[p.l];
      const toLayer = layers[p.l + 1];
      const a = fromLayer[p.i];
      const b = toLayer[p.j];
      const t = Math.min(1, p.t);
      const x = a.x + (b.x - a.x) * t;
      const y = a.y + (b.y - a.y) * t;
      ctx.fillStyle = light ? "#e0538c" : "#3ef2a1";
      ctx.beginPath();
      ctx.arc(x, y, 3, 0, Math.PI * 2);
      ctx.fill();
    }

    // Nodes
    for (let l = 0; l < layers.length; l++) {
      for (const n of layers[l]) {
        const r = 12 + n.activation * 6;
        const glow = light
          ? `rgba(224,83,140,${0.15 + n.activation * 0.5})`
          : `rgba(62,242,161,${0.15 + n.activation * 0.5})`;
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(n.x, n.y, r + 6, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = light ? "#3a3a3a" : "#e8e8e8";
        ctx.beginPath();
        ctx.arc(n.x, n.y, r * 0.55, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = light ? "#c88" : "#4d8bff";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(n.x, n.y, r, 0, Math.PI * 2);
        ctx.stroke();
      }
    }

    // Output labels — font scales down on narrow canvases, and x is
    // clamped so text never runs past the canvas edge.
    const outLayer = layers[layers.length - 1];
    const fontSize = W < 400 ? 9 : 11;
    ctx.font = `${fontSize}px monospace`;
    ctx.fillStyle = light ? "#6b6b6b" : "#aaaaaa";
    for (let i = 0; i < outLayer.length; i++) {
      const label = CLASS_LABELS[i] || "";
      const textWidth = ctx.measureText(label).width;
      const x = Math.min(outLayer[i].x + 16, W - textWidth - 4);
      ctx.fillText(label, x, outLayer[i].y + 4);
    }

    // Layer captions
    ctx.font = `${fontSize}px monospace`;
    ctx.fillStyle = light ? "#8a8a8a" : "#888888";
    ctx.fillText("input", Math.max(2, LAYER_X[0] - 14), H - 12);
    ctx.fillText("hidden", Math.max(2, LAYER_X[1] - 18), H - 12);
    ctx.fillText("hidden", Math.max(2, LAYER_X[2] - 18), H - 12);
    ctx.fillText("output", Math.min(LAYER_X[3] - 18, W - 44), H - 12);
  }

  function loop() {
    if (running) {
      step();
      draw();
    }
    requestAnimationFrame(loop);
  }

  function resize() {
    const holder = document.getElementById("neural-canvas-wrap");
    if (!holder || !canvas) return;
    const containerW = holder.getBoundingClientRect().width || 640;
    W = Math.max(280, Math.min(640, Math.floor(containerW)));
    computeLayerX();
    canvas.width = W;
    canvas.height = H;
    buildNetwork();
    cycle = 0;
    startCycle();
  }

  function init() {
    const holder = document.getElementById("neural-canvas-wrap");
    if (!holder) return;
    canvas = document.createElement("canvas");
    holder.appendChild(canvas);
    ctx = canvas.getContext("2d");

    // Paint something immediately at a safe default, then correct the
    // size once layout has settled (avoids measuring width=0 too early).
    canvas.width = W;
    canvas.height = H;
    computeLayerX();
    buildNetwork();
    startCycle();
    requestAnimationFrame(resize);
    window.addEventListener("resize", resize);

    const resetBtn = document.getElementById("nn-reset");
    const toggleBtn = document.getElementById("nn-toggle");
    if (resetBtn) {
      resetBtn.addEventListener("click", () => {
        buildNetwork();
        cycle = 0;
        startCycle();
      });
    }
    if (toggleBtn) {
      toggleBtn.addEventListener("click", () => {
        running = !running;
        toggleBtn.textContent = running ? "pause" : "resume";
      });
    }

    loop();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
