// Flip Match -- classic memory/concentration game. Difficulty scales by
// grid size: each level adds more pairs to remember.

const SYMBOLS = ["🍎","🍋","🍇","🍓","🍉","🍒","🥑","🍍","🥕","🌽","🍑","🥝","🍌","🍊"];
const LEVELS = [
  { cols: 3, rows: 4 },
  { cols: 4, rows: 4 },
  { cols: 5, rows: 4 },
  { cols: 6, rows: 4 },
];

const STORAGE_KEY = "flipmatch.progress";
function loadProgress() { return parseInt(localStorage.getItem(STORAGE_KEY) || "0", 10); }
function saveProgress(v) { localStorage.setItem(STORAGE_KEY, String(v)); }

function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function buildDeck(levelIndex) {
  const { cols, rows } = LEVELS[levelIndex];
  const pairCount = (cols * rows) / 2;
  const chosen = SYMBOLS.slice(0, pairCount);
  return shuffle([...chosen, ...chosen]);
}

let unlockedLevel = loadProgress();
let levelIndex = 0;
let deck = [];
let flippedIdx = [];
let matched = new Set();
let moves = 0;
let locked = false;
let won = false;

const app = document.getElementById("app");

function startLevel(idx) {
  levelIndex = idx;
  deck = buildDeck(idx);
  flippedIdx = [];
  matched = new Set();
  moves = 0;
  locked = false;
  won = false;
  render();
}

function flip(i) {
  if (locked || matched.has(i) || flippedIdx.includes(i) || flippedIdx.length >= 2) return;
  flippedIdx.push(i);
  if (flippedIdx.length === 2) {
    moves++;
    const [a, b] = flippedIdx;
    if (deck[a] === deck[b]) {
      matched.add(a);
      matched.add(b);
      flippedIdx = [];
      if (matched.size === deck.length) {
        won = true;
        if (levelIndex >= unlockedLevel && levelIndex + 1 > unlockedLevel) {
          unlockedLevel = levelIndex + 1;
          saveProgress(unlockedLevel);
        }
      }
    } else {
      locked = true;
      setTimeout(() => { flippedIdx = []; locked = false; render(); }, 700);
    }
  }
  render();
}

function render() {
  const { cols } = LEVELS[levelIndex];
  let html = `
    <div class="eyebrow">Flip Match &middot; Level ${levelIndex + 1}</div>
    <h1>Flip Match</h1>
    <div class="sub">Find every pair. Fewer moves, better score.</div>
    <div class="stat-row">
      <div class="stat"><div class="num">${moves}</div><div class="label">Moves</div></div>
      <div class="stat"><div class="num">${matched.size / 2}/${deck.length / 2}</div><div class="label">Pairs</div></div>
    </div>
    <div class="grid" style="grid-template-columns: repeat(${cols}, 1fr);">
  `;
  deck.forEach((sym, i) => {
    const isUp = flippedIdx.includes(i) || matched.has(i);
    const cls = matched.has(i) ? "matched" : isUp ? "up" : "";
    html += `<div class="card ${cls}" data-i="${i}">${isUp ? sym : ""}</div>`;
  });
  html += `</div>`;
  if (won) {
    const isLast = levelIndex >= LEVELS.length - 1;
    html += `<div class="overlay">
      <div>Level ${levelIndex + 1} cleared in ${moves} moves!</div>
      <button class="btn" id="nextBtn">${isLast ? "Play again" : "Next level"}</button>
    </div>`;
  }
  app.innerHTML = html;
  app.querySelectorAll("[data-i]").forEach(el => {
    el.addEventListener("click", () => flip(parseInt(el.getAttribute("data-i"), 10)));
  });
  const next = document.getElementById("nextBtn");
  if (next) next.addEventListener("click", () => {
    const isLast = levelIndex >= LEVELS.length - 1;
    startLevel(isLast ? levelIndex : levelIndex + 1);
  });
}

startLevel(Math.min(unlockedLevel, LEVELS.length - 1));

// ponytail: read-only state accessors for external tooling (recording/QA scripts)
window.LEVELS = LEVELS;
window.getState = () => ({ deck, matched, moves, won, levelIndex, flippedIdx });

(function selfCheck() {
  const check = (cond, msg) => { if (!cond) console.error("Flip Match self-check FAILED:", msg); };
  LEVELS.forEach((lv, i) => check((lv.cols * lv.rows) % 2 === 0, `level ${i} has an even card count`));
  const d = buildDeck(0);
  const counts = {};
  d.forEach(s => counts[s] = (counts[s] || 0) + 1);
  check(Object.values(counts).every(c => c === 2), "every symbol appears exactly twice");
  console.log("Flip Match self-check passed.");
})();
