// Metropolis-Hastings sampler over a 2D mixture-of-Gaussians target,
// rendered as a live heatmap with the current walker on top.

(function () {
const W = 640;
const H = 420;

// Target distribution: mixture of 3 unnormalised Gaussians.
const MODES = [
{ x: -1.3, y: 0.6, sx: 0.5, sy: 0.5, w: 1.0 },
{ x: 1.1, y: -0.7, sx: 0.35, sy: 0.7, w: 0.8 },
{ x: 0.4, y: 1.2, sx: 0.6, sy: 0.35, w: 0.6 },
];

function targetDensity(x, y) {
let p = 0;
for (const m of MODES) {
const dx = (x - m.x) / m.sx;
const dy = (y - m.y) / m.sy;
p += m.w * Math.exp(-0.5 * (dx * dx + dy * dy));
}
return p;
}

// World coords roughly [-3, 3] map to canvas.
const SCALE = 90;
function toScreen(x, y) {
return [W / 2 + x * SCALE, H / 2 - y * SCALE];
}

let sketch = function (p) {
let current = { x: 0, y: 0, density: 0 };
let steps = 0;
let accepted = 0;
let speedMultiplier = 1;
const speedLevels = [1, 4, 12];
let speedIdx = 0;

const gridCols = 80;
const gridRows = Math.round((gridCols * H) / W);
let heat;

const trail = [];
const MAX_TRAIL = 60;

function resetChain() {
current = { x: 0, y: 0, density: targetDensity(0, 0) };
steps = 0;
accepted = 0;
heat = new Float32Array(gridCols * gridRows);
trail.length = 0;
updateStats();
}

function updateStats() {
const stepsEl = document.getElementById("mcmc-steps");
const accEl = document.getElementById("mcmc-accepted");
const rateEl = document.getElementById("mcmc-rate");
if (stepsEl) stepsEl.textContent = steps.toLocaleString();
if (accEl) accEl.textContent = accepted.toLocaleString();
if (rateEl) rateEl.textContent = steps > 0 ? `${((accepted / steps) * 100).toFixed(1)}%` : "–";
}

function stepChain() {
const proposalSd = 0.45;
const px = current.x + p.randomGaussian(0, proposalSd);
const py = current.y + p.randomGaussian(0, proposalSd);
const pDensity = targetDensity(px, py);

const acceptRatio = current.density > 0 ? pDensity / current.density : 1;
const accept = pDensity >= current.density || Math.random() < acceptRatio;

if (accept) {
current = { x: px, y: py, density: pDensity };
accepted++;
}

steps++;

const gx = Math.floor(((current.x + 3) / 6) * gridCols);
const gy = Math.floor(((3 - current.y) / 6) * gridRows);
if (gx >= 0 && gx < gridCols && gy >= 0 && gy < gridRows) {
heat[gy * gridCols + gx] += 1;
}

trail.push({ x: current.x, y: current.y });
if (trail.length > MAX_TRAIL) trail.shift();
}

function isLight() {
return document.documentElement.getAttribute("data-theme") === "light";
}

p.setup = function () {
const holder = document.getElementById("mcmc-canvas-wrap");
const canvas = p.createCanvas(W, H);
canvas.parent(holder);
p.pixelDensity(1);
resetChain();

const resetBtn = document.getElementById("mcmc-reset");
const speedBtn = document.getElementById("mcmc-speed");
if (resetBtn) resetBtn.addEventListener("click", resetChain);
if (speedBtn) {
speedBtn.addEventListener("click", () => {
speedIdx = (speedIdx + 1) % speedLevels.length;
speedMultiplier = speedLevels[speedIdx];
speedBtn.textContent = `speed: ${speedMultiplier}×`;
});
}
};

p.draw = function () {
const light = isLight();
if (light) p.background(255, 250, 243);
else p.background(8, 8, 8);

for (let i = 0; i < speedMultiplier; i++) stepChain();
updateStats();

// Heatmap
let maxHeat = 1;
for (let i = 0; i < heat.length; i++) if (heat[i] > maxHeat) maxHeat = heat[i];

const cellW = W / gridCols;
const cellH = H / gridRows;
p.noStroke();
for (let gy = 0; gy < gridRows; gy++) {
for (let gx = 0; gx < gridCols; gx++) {
const v = heat[gy * gridCols + gx];
if (v <= 0) continue;
const t = Math.min(1, Math.log(1 + v) / Math.log(1 + maxHeat));
const col = heatColor(t, light);
p.fill(col[0], col[1], col[2], col[3]);
p.rect(gx * cellW, gy * cellH, cellW + 1, cellH + 1);
}
}

// Trail
p.noFill();
for (let i = 1; i < trail.length; i++) {
const a = trail[i - 1];
const b = trail[i];
const alpha = (i / trail.length) * 160;
if (light) p.stroke(140, 70, 120, alpha);
else p.stroke(220, 240, 255, alpha);
p.strokeWeight(1.5);
const [ax, ay] = toScreen(a.x, a.y);
const [bx, by] = toScreen(b.x, b.y);
p.line(ax, ay, bx, by);
}

// Current walker
const [cx, cy] = toScreen(current.x, current.y);
p.noStroke();
if (light) {
p.fill(230, 83, 140, 70);
p.circle(cx, cy, 22);
p.fill(230, 83, 140);
p.circle(cx, cy, 9);
} else {
p.fill(62, 242, 161, 60);
p.circle(cx, cy, 22);
p.fill(62, 242, 161);
p.circle(cx, cy, 9);
}
};

function heatColor(t, light) {
// t in [0,1] -> cool to warm ramp
const stops = light
? [
[255, 250, 243, 0],
[179, 217, 255, 110],
[217, 179, 255, 160],
[255, 179, 217, 200],
[255, 157, 201, 225],
[255, 138, 91, 245],
]
: [
[10, 10, 10, 0],
[51, 217, 193, 70],
[77, 139, 255, 120],
[165, 109, 255, 170],
[255, 92, 179, 210],
[255, 210, 63, 240],
];
const scaled = t * (stops.length - 1);
const i0 = Math.floor(scaled);
const i1 = Math.min(stops.length - 1, i0 + 1);
const frac = scaled - i0;
const c0 = stops[i0];
const c1 = stops[i1];
return [
p.lerp(c0[0], c1[0], frac),
p.lerp(c0[1], c1[1], frac),
p.lerp(c0[2], c1[2], frac),
p.lerp(c0[3], c1[3], frac),
];
}
};

new p5(sketch);
})();
