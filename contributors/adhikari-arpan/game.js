// Byte Snake — a small canvas snake game.
// Eat the snake (food) to grow and score. Bugs occasionally crawl in —
// eating one shrinks you and costs points, dodging them is free.

(function () {
  const COLS = 20;
  const ROWS = 20;
  const CELL = 20; // logical px, canvas is 400x400 and scales via CSS

  const SPEEDS = [
    { label: "slow", ms: 220 },
    { label: "normal", ms: 150 },
    { label: "fast", ms: 100 },
  ];

  const HIGH_SCORE_KEY = "hd-arpan-snake-highscore";

  const canvas = document.getElementById("snake-canvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");

  const overlay = document.getElementById("snake-overlay");
  const overlayTitle = document.getElementById("snake-overlay-title");
  const overlaySub = document.getElementById("snake-overlay-sub");
  const startBtn = document.getElementById("snake-start-btn");
  const pauseBtn = document.getElementById("snake-pause-btn");
  const restartBtn = document.getElementById("snake-restart-btn");
  const speedBtn = document.getElementById("snake-speed-btn");
  const scoreEl = document.getElementById("snake-score");
  const highScoreEl = document.getElementById("snake-highscore");

  let speedIdx = 1;
  let tickMs = SPEEDS[speedIdx].ms;

  let snake, dir, nextDir, food, bug, bugTicksLeft, score, state, acc, lastT;
  let foodsEaten = 0;

  function getHighScore() {
    return Number(localStorage.getItem(HIGH_SCORE_KEY) || 0);
  }
  function setHighScore(v) {
    localStorage.setItem(HIGH_SCORE_KEY, String(v));
    highScoreEl.textContent = v;
  }

  function randCell(exclude) {
    let c;
    do {
      c = { x: Math.floor(Math.random() * COLS), y: Math.floor(Math.random() * ROWS) };
    } while (exclude.some((e) => e.x === c.x && e.y === c.y));
    return c;
  }

  function resetGame() {
    snake = [
      { x: 8, y: 10 },
      { x: 7, y: 10 },
      { x: 6, y: 10 },
    ];
    dir = { x: 1, y: 0 };
    nextDir = dir;
    food = randCell(snake);
    bug = null;
    bugTicksLeft = 0;
    foodsEaten = 0;
    score = 0;
    acc = 0;
    scoreEl.textContent = "0";
    highScoreEl.textContent = getHighScore();
  }

  function showOverlay(title, sub, btnLabel) {
    overlayTitle.textContent = title;
    overlaySub.textContent = sub;
    startBtn.textContent = btnLabel;
    overlay.classList.remove("hidden");
  }
  function hideOverlay() {
    overlay.classList.add("hidden");
  }

  function startGame() {
    resetGame();
    state = "running";
    hideOverlay();
    pauseBtn.textContent = "pause";
    lastT = null;
  }

  function endGame() {
    state = "over";
    const hs = getHighScore();
    const isNew = score > hs;
    if (isNew) setHighScore(score);
    showOverlay(
      "Game Over",
      isNew ? `New high score: ${score}! Play again?` : `Score: ${score}. Beat ${hs}?`,
      "play again"
    );
  }

  function togglePause() {
    if (state === "running") {
      state = "paused";
      pauseBtn.textContent = "resume";
      showOverlay("Paused", "Take a breath. Resume whenever.", "resume");
    } else if (state === "paused") {
      state = "running";
      pauseBtn.textContent = "pause";
      hideOverlay();
      lastT = null;
    }
  }

  function setDirection(dx, dy) {
    // prevent reversing directly into itself
    if (dx === -dir.x && dy === -dir.y) return;
    nextDir = { x: dx, y: dy };
    if (state === "idle") startGame();
    else if (state === "paused") togglePause();
  }

  function step() {
    dir = nextDir;
    const head = { x: snake[0].x + dir.x, y: snake[0].y + dir.y };

    if (head.x < 0 || head.x >= COLS || head.y < 0 || head.y >= ROWS) {
      endGame();
      return;
    }
    if (snake.some((s) => s.x === head.x && s.y === head.y)) {
      endGame();
      return;
    }

    snake.unshift(head);

    let grew = false;
    if (head.x === food.x && head.y === food.y) {
      score += 10;
      foodsEaten++;
      grew = true;
      food = randCell(snake);
      if (foodsEaten % 3 === 0 && !bug) {
        bug = randCell([...snake, food]);
        bugTicksLeft = 40;
      }
    }

    if (bug && head.x === bug.x && head.y === bug.y) {
      score = Math.max(0, score - 5);
      bug = null;
      if (snake.length > 1) snake.pop();
      if (snake.length > 1) snake.pop();
    }

    if (!grew) snake.pop();

    if (bug) {
      bugTicksLeft--;
      if (bugTicksLeft <= 0) bug = null;
    }

    scoreEl.textContent = String(score);
  }

  function drawCell(cx, cy, color, inset) {
    const pad = inset || 1;
    ctx.fillStyle = color;
    ctx.fillRect(cx * CELL + pad, cy * CELL + pad, CELL - pad * 2, CELL - pad * 2);
  }

  function render() {
    ctx.fillStyle = "#0d0d0d";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = "rgba(255,255,255,0.04)";
    for (let i = 1; i < COLS; i++) {
      ctx.beginPath();
      ctx.moveTo(i * CELL, 0);
      ctx.lineTo(i * CELL, canvas.height);
      ctx.stroke();
    }
    for (let j = 1; j < ROWS; j++) {
      ctx.beginPath();
      ctx.moveTo(0, j * CELL);
      ctx.lineTo(canvas.width, j * CELL);
      ctx.stroke();
    }

    if (food) drawCell(food.x, food.y, "#ffd23f", 3);
    if (bug) drawCell(bug.x, bug.y, "#ff5252", 3);

    snake.forEach((s, i) => {
      drawCell(s.x, s.y, i === 0 ? "#3ef2a1" : "#2bb885", 2);
    });
  }

  function loop(t) {
    requestAnimationFrame(loop);
    if (state !== "running") return;
    if (lastT === null) lastT = t;
    acc += t - lastT;
    lastT = t;
    while (acc >= tickMs) {
      step();
      acc -= tickMs;
      if (state !== "running") break;
    }
    render();
  }

  // ---- input ----
  document.addEventListener("keydown", (e) => {
    const k = e.key.toLowerCase();
    if (["arrowup", "arrowdown", "arrowleft", "arrowright", "w", "a", "s", "d", " "].includes(k)) {
      e.preventDefault();
    }
    if (k === " ") {
      if (state === "running" || state === "paused") togglePause();
      return;
    }
    if (k === "arrowup" || k === "w") setDirection(0, -1);
    else if (k === "arrowdown" || k === "s") setDirection(0, 1);
    else if (k === "arrowleft" || k === "a") setDirection(-1, 0);
    else if (k === "arrowright" || k === "d") setDirection(1, 0);
  });

  let touchStart = null;
  canvas.addEventListener("touchstart", (e) => {
    const t = e.changedTouches[0];
    touchStart = { x: t.clientX, y: t.clientY };
  });
  canvas.addEventListener("touchend", (e) => {
    if (!touchStart) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - touchStart.x;
    const dy = t.clientY - touchStart.y;
    if (Math.abs(dx) > Math.abs(dy)) {
      setDirection(dx > 0 ? 1 : -1, 0);
    } else {
      setDirection(0, dy > 0 ? 1 : -1);
    }
    touchStart = null;
  });

  startBtn.addEventListener("click", () => {
    if (state === "paused") togglePause();
    else startGame();
  });
  pauseBtn.addEventListener("click", togglePause);
  restartBtn.addEventListener("click", startGame);
  speedBtn.addEventListener("click", () => {
    speedIdx = (speedIdx + 1) % SPEEDS.length;
    tickMs = SPEEDS[speedIdx].ms;
    speedBtn.textContent = `speed: ${SPEEDS[speedIdx].label}`;
  });

  // ---- init ----
  state = "idle";
  resetGame();
  render();
  showOverlay("Byte Snake", "Press any arrow key, WASD, or the button below to start.", "start game");
  requestAnimationFrame(loop);
})();
