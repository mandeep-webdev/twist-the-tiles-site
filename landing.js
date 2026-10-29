(() => {
  'use strict';

  // ---------------------------------------------------------------------
  // Tile art (same order and colours as lib/data/tile_themes.dart).
  // ---------------------------------------------------------------------
  const WORLDS = [
    { name: 'Fruits', levels: '1–10', dir: 'fruit', tiles: [
      ['apple', 'EF5350'], ['lemon', 'FFCA28'], ['orange', 'FF9800'],
      ['grapes', 'AB47BC'], ['strawberry', 'EC407A'], ['watermelon', '66BB6A'],
      ['kiwi', '9CCC65'], ['cherry', '8E0E3C'], ['banana', 'FFD54F']] },
    { name: 'Vegetables', levels: '11–20', dir: 'vegetable', tiles: [
      ['carrot', 'FF8F00'], ['borocoli', '43A047'], ['corn', 'FDD835'],
      ['eggplant', '7E57C2'], ['tomato', 'E53935'], ['mushroom', 'EC407A'],
      ['capsicum', 'FF7043'], ['cucumber', '9CCC65'], ['onion', 'AB47BC']] },
    { name: 'Animals', levels: '21–30', dir: 'animal', tiles: [
      ['lion', 'FFD54F'], ['panda', '90A4AE'], ['fox', 'FF80AB'],
      ['monkey', '8D6E63'], ['hedgehog', '8BC34A'], ['tiger', 'D84315'],
      ['koala', '78909C'], ['penguin', '4FC3F7'], ['rabbit', 'CE93D8']] },
    { name: 'Sweets', levels: '31–40', dir: 'sweet', tiles: [
      ['donut', 'F06292'], ['macaron', '80CBC4'], ['cupcake', 'BA68C8'],
      ['cakeslice', 'F48FB1'], ['choco', '8D6E63'], ['candy', '9575CD'],
      ['lollipop', 'FF8A65'], ['icecream', '81C784'], ['cottoncandy', '4FC3F7']] },
    { name: 'Ocean', levels: '41–50', dir: 'ocean', tiles: [
      ['octopus', '7E57C2'], ['fish', 'FF9800'], ['jellyfish', 'F48FB1'],
      ['whale', '42A5F5'], ['crab', 'EF5350'], ['turtle', '26A69A'],
      ['seahorse', '4DD0E1'], ['pufferfish', 'FFEE58'], ['starfish', 'FFCA28']] },
    { name: 'Space', levels: '51–60', dir: 'space', tiles: [
      ['spacerocket', 'EF5350'], ['ringplanet', 'AB47BC'], ['moon', 'FFCA28'],
      ['astronaut', '4FC3F7'], ['comet', 'FF7043'], ['saucer', '7E57C2'],
      ['alien', '9CCC65'], ['earth', '1E88E5'], ['sattelite', 'B0BEC5']] },
    { name: 'Vehicles', levels: '61–70', dir: 'vehicles', tiles: [
      ['car', 'E53935'], ['bus', 'FFCA28'], ['airplane', '81D4FA'],
      ['truck', '1E88E5'], ['tractor', '66BB6A'], ['cycle', 'FF7043'],
      ['helicopter', 'AB47BC'], ['rocket', 'FF8A65'], ['scooter', '4DB6AC']] },
    { name: 'Fantasy', levels: '71–80', dir: 'fantasy', tiles: [
      ['unicorn', 'CE93D8'], ['dragon', '66BB6A'], ['fairy', 'F48FB1'],
      ['babyphenix', 'FF7043'], ['hat', '7E57C2'], ['potion', 'FFCA28'],
      ['ball', '42A5F5'], ['book', 'C62828'], ['egg', '26C6DA']] },
    { name: 'Flowers', levels: '81–90', dir: 'flower', tiles: [
      ['cheery', 'A1887F'], ['dassy', 'FFF176'], ['hibiscus', 'EF5350'],
      ['hydrangea', '42A5F5'], ['lavender', '9575CD'], ['lotus', 'F06292'],
      ['marigold', 'FF9800'], ['rose', 'C62828'], ['sunflower', 'FFCA28']] },
    { name: 'Mega Mix', levels: '91–100', mixed: [
      ['fruit/apple', 'EF5350'], ['vegetable/carrot', 'FF8F00'], ['animal/lion', 'FFD54F'],
      ['sweet/donut', 'F06292'], ['ocean/octopus', '7E57C2'], ['space/earth', '1E88E5'],
      ['vehicles/car', 'E53935'], ['fantasy/unicorn', 'CE93D8'], ['animal/penguin', '4FC3F7']] },
  ];

  const src = (path) => `img/tiles/${path}.webp`;
  const tilesOf = (w) => w.mixed
    ? w.mixed.map(([p, c]) => ({ src: src(p), color: c }))
    : w.tiles.map(([n, c]) => ({ src: src(`${w.dir}/${n}`), color: c }));

  const faceStyle = (hex) =>
    `background: linear-gradient(180deg, #${hex}cc 0%, #${hex}66 100%)`;

  // ---------------------------------------------------------------------
  // Worlds grid
  // ---------------------------------------------------------------------
  const worldsGrid = document.getElementById('worldsGrid');
  if (worldsGrid) {
    worldsGrid.innerHTML = WORLDS.map((w) => `
      <div class="world">
        <h3>${w.name}</h3>
        <div class="world-tiles">
          ${tilesOf(w).map((t) => `<span style="${faceStyle(t.color)}"><img src="${t.src}" alt="" loading="lazy" width="96" height="96"></span>`).join('')}
        </div>
        <p>Levels ${w.levels}</p>
      </div>`).join('');
  }

  // ---------------------------------------------------------------------
  // Playable puzzle (same rules as lib/game/puzzle_rules.dart)
  // ---------------------------------------------------------------------
  const grid = document.getElementById('grid');
  if (!grid) return;

  const board = document.getElementById('board');
  const targetEl = document.getElementById('target');
  const movesEl = document.getElementById('moves');
  const winEl = document.getElementById('win');
  const winStars = document.getElementById('winStars');
  const winText = document.getElementById('winText');
  const hintEl = document.getElementById('hint');
  const SOLVED = [0, 1, 2, 3, 4, 5, 6, 7, 8];
  const ANIM_MS = 300;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Level 1 of the game: top row left, then right column down.
  let start = [5, 0, 1, 3, 4, 8, 6, 7, 2];
  let board9 = start.slice();
  let best = 2;
  let moves = 0;
  let busy = false;
  let theme = WORLDS[0];
  let firstPuzzle = true;
  const tileEls = [];

  function applyMove(b, m) {
    const r = b.slice();
    if (m.row != null) {
      const s = m.row * 3;
      const t = [b[s], b[s + 1], b[s + 2]];
      for (let c = 0; c < 3; c++) r[s + ((c + m.dir + 3) % 3)] = t[c];
    } else {
      const t = [b[m.col], b[m.col + 3], b[m.col + 6]];
      for (let i = 0; i < 3; i++) r[m.col + ((i + m.dir + 3) % 3) * 3] = t[i];
    }
    return r;
  }

  const ALL_MOVES = [];
  for (let i = 0; i < 3; i++) {
    ALL_MOVES.push({ row: i, dir: -1 }, { row: i, dir: 1 }, { col: i, dir: -1 }, { col: i, dir: 1 });
  }

  // Shortest solution length by breadth-first search (puzzles here are short).
  function shortest(b) {
    const goal = SOLVED.join();
    let frontier = [b];
    const seen = new Set([b.join()]);
    for (let depth = 0; depth <= 6; depth++) {
      const next = [];
      for (const s of frontier) {
        if (s.join() === goal) return depth;
        for (const m of ALL_MOVES) {
          const n = applyMove(s, m);
          const k = n.join();
          if (!seen.has(k)) { seen.add(k); next.push(n); }
        }
      }
      frontier = next;
    }
    return 6;
  }

  function scramble() {
    let b;
    do {
      b = SOLVED.slice();
      const steps = 3 + Math.floor(Math.random() * 2);
      let last = null;
      for (let i = 0; i < steps; i++) {
        let m;
        do { m = ALL_MOVES[Math.floor(Math.random() * ALL_MOVES.length)]; }
        while (last && m.row === last.row && m.col === last.col);
        b = applyMove(b, m);
        last = m;
      }
    } while (shortest(b) < 3);
    return b;
  }

  function buildTiles() {
    const tiles = tilesOf(theme);
    grid.innerHTML = '';
    tileEls.length = 0;
    tiles.forEach((t, id) => {
      const el = document.createElement('div');
      el.className = 'tile';
      el.innerHTML = `<div class="face" style="${faceStyle(t.color)}"><img src="${t.src}" alt="" draggable="false"></div>`;
      grid.appendChild(el);
      tileEls[id] = el;
    });
    targetEl.innerHTML = tiles.map((t) =>
      `<span class="mini" style="${faceStyle(t.color)}"><img src="${t.src}" alt=""></span>`).join('');
    place(true);
  }

  function place(instant) {
    board9.forEach((id, cell) => {
      const el = tileEls[id];
      if (instant) el.classList.add('no-anim');
      el.style.setProperty('--c', cell % 3);
      el.style.setProperty('--r', Math.floor(cell / 3));
    });
    if (instant) {
      void grid.offsetWidth;
      tileEls.forEach((el) => el.classList.remove('no-anim'));
    }
  }

  function newGame(b) {
    start = b;
    board9 = b.slice();
    best = shortest(b);
    moves = 0;
    busy = false;
    movesEl.textContent = '0';
    winEl.hidden = true;
    board.classList.remove('solved');
    place(true);
  }

  function doMove(m) {
    if (busy || !winEl.hidden) return;
    busy = true;

    // The tile that wraps leaves through one edge (a ghost copy) and
    // enters from the opposite edge.
    const line = m.row != null
      ? [m.row * 3, m.row * 3 + 1, m.row * 3 + 2]
      : [m.col, m.col + 3, m.col + 6];
    const leavingCell = m.dir > 0 ? line[2] : line[0];
    const wrapId = board9[leavingCell];
    const wrapEl = tileEls[wrapId];

    if (!reduceMotion) {
      const ghost = wrapEl.cloneNode(true);
      ghost.classList.add('no-anim');
      grid.appendChild(ghost);
      void ghost.offsetWidth;
      ghost.classList.remove('no-anim');
      if (m.row != null) ghost.style.setProperty('--c', m.dir > 0 ? 3 : -1);
      else ghost.style.setProperty('--r', m.dir > 0 ? 3 : -1);
      setTimeout(() => ghost.remove(), ANIM_MS + 40);

      wrapEl.classList.add('no-anim');
      if (m.row != null) wrapEl.style.setProperty('--c', m.dir > 0 ? -1 : 3);
      else wrapEl.style.setProperty('--r', m.dir > 0 ? -1 : 3);
      void wrapEl.offsetWidth;
      wrapEl.classList.remove('no-anim');
    }

    board9 = applyMove(board9, m);
    moves++;
    movesEl.textContent = String(moves);
    requestAnimationFrame(() => place(false));

    if (firstPuzzle && moves === 1) {
      hintEl.innerHTML = m.row === 0 && m.dir === -1
        ? 'Nice! Now slide the <strong>right column down</strong>.'
        : 'Tip: <strong>Restart</strong> and try the top row left, then the right column down.';
    }

    setTimeout(() => {
      busy = false;
      if (board9.join() === SOLVED.join()) win();
    }, ANIM_MS);
  }

  function win() {
    const stars = moves <= best ? 3 : moves <= best + 2 ? 2 : 1;
    winStars.innerHTML = [1, 2, 3].map((i) => `<span class="${i <= stars ? '' : 'off'}">★</span>`).join('');
    winText.textContent = stars === 3
      ? `Perfect! Solved in ${moves} moves, the best possible.`
      : `Solved in ${moves} moves. The best is ${best}. Try for 3 stars!`;
    board.classList.add('solved');
    setTimeout(() => { winEl.hidden = false; confetti(); }, 450);
    if (firstPuzzle) {
      firstPuzzle = false;
      hintEl.textContent = 'The game has 100 levels like this, and they get trickier!';
    }
  }

  function confetti() {
    if (reduceMotion) return;
    const colors = ['#ffc93c', '#2fd8ff', '#ec407a', '#66bb6a', '#ab47bc', '#fff'];
    for (let i = 0; i < 36; i++) {
      const p = document.createElement('span');
      p.className = 'confetti';
      const a = Math.random() * Math.PI * 2;
      const d = 120 + Math.random() * 160;
      p.style.background = colors[i % colors.length];
      p.style.setProperty('--dx', `${Math.cos(a) * d}px`);
      p.style.setProperty('--dy', `${Math.sin(a) * d - 60}px`);
      p.style.setProperty('--rot', `${Math.random() * 720 - 360}deg`);
      board.appendChild(p);
      setTimeout(() => p.remove(), 1200);
    }
  }

  // Drag (mouse, pen or finger) to slide a row or column.
  let drag = null;
  grid.addEventListener('pointerdown', (e) => {
    const r = grid.getBoundingClientRect();
    drag = {
      x: e.clientX,
      y: e.clientY,
      col: Math.min(2, Math.max(0, Math.floor(((e.clientX - r.left) / r.width) * 3))),
      row: Math.min(2, Math.max(0, Math.floor(((e.clientY - r.top) / r.height) * 3))),
    };
    grid.setPointerCapture(e.pointerId);
  });
  grid.addEventListener('pointerup', (e) => {
    if (!drag) return;
    const dx = e.clientX - drag.x;
    const dy = e.clientY - drag.y;
    const min = grid.clientWidth * 0.08;
    if (Math.max(Math.abs(dx), Math.abs(dy)) >= min) {
      if (Math.abs(dx) > Math.abs(dy)) doMove({ row: drag.row, dir: dx > 0 ? 1 : -1 });
      else doMove({ col: drag.col, dir: dy > 0 ? 1 : -1 });
    }
    drag = null;
  });
  grid.addEventListener('pointercancel', () => { drag = null; });

  document.getElementById('reset').addEventListener('click', () => newGame(start));
  const fresh = () => {
    if (firstPuzzle) {
      firstPuzzle = false;
      hintEl.textContent = 'Drag rows sideways and columns up or down.';
    }
    newGame(scramble());
  };
  document.getElementById('shuffle').addEventListener('click', fresh);
  document.getElementById('again').addEventListener('click', fresh);

  document.querySelectorAll('.theme-tabs button').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.theme-tabs button').forEach((b) =>
        b.setAttribute('aria-selected', String(b === btn)));
      theme = WORLDS.find((w) => w.dir === btn.dataset.theme);
      buildTiles();
    });
  });

  buildTiles();
  newGame(start);

  // Warm up the other demo themes so switching tabs is instant.
  window.addEventListener('load', () => {
    ['ocean', 'space'].forEach((dir) =>
      tilesOf(WORLDS.find((w) => w.dir === dir)).forEach((t) => { new Image().src = t.src; }));
  });
})();
