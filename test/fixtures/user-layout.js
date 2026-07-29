// Reconstruct the exact board state from the user's JSON.
const { solveMinesweeper } = require('../../solver.js');

const cells = [];
const userCells = [
  // rows 1-9, cols 1-9
  ['revealed', 0], ['revealed', 1], ['hidden', null], ['hidden', null], ['hidden', null], ['hidden', null], ['revealed', 2], ['revealed', 0], ['revealed', 0], // row 1
  ['revealed', 0], ['revealed', 1], ['hidden', null], ['hidden', null], ['hidden', null], ['hidden', null], ['revealed', 3], ['revealed', 1], ['revealed', 0], // row 2
  ['revealed', 0], ['revealed', 1], ['revealed', 1], ['revealed', 1], ['revealed', 1], ['revealed', 2], ['hidden', null], ['revealed', 1], ['revealed', 0], // row 3
  ['revealed', 0], ['revealed', 0], ['revealed', 0], ['revealed', 0], ['revealed', 0], ['revealed', 1], ['revealed', 1], ['revealed', 1], ['revealed', 0], // row 4
  ['revealed', 0], ['revealed', 0], ['revealed', 0], ['revealed', 0], ['revealed', 0], ['revealed', 0], ['revealed', 0], ['revealed', 0], ['revealed', 0], // row 5
  ['revealed', 1], ['revealed', 1], ['revealed', 1], ['revealed', 1], ['revealed', 1], ['revealed', 1], ['revealed', 1], ['revealed', 1], ['revealed', 0], // row 6
  ['hidden', null], ['hidden', null], ['hidden', null], ['hidden', null], ['hidden', null], ['hidden', null], ['hidden', null], ['revealed', 1], ['revealed', 0], // row 7
  ['hidden', null], ['hidden', null], ['hidden', null], ['hidden', null], ['hidden', null], ['hidden', null], ['hidden', null], ['revealed', 3], ['revealed', 2], // row 8
  ['hidden', null], ['hidden', null], ['hidden', null], ['hidden', null], ['hidden', null], ['hidden', null], ['hidden', null], ['hidden', null], ['hidden', null], // row 9
];

for (let r = 1; r <= 9; r++) {
  for (let c = 1; c <= 9; c++) {
    const [state, number] = userCells[(r - 1) * 9 + c - 1];
    cells.push({ row: r, col: c, state, number });
  }
}

// Build clues
const clues = [];
for (let i = 0; i < 81; i++) {
  if (cells[i].state !== 'revealed' || !Number.isInteger(cells[i].number)) continue;
  const nb = [];
  const r = Math.floor(i / 9), c = i % 9;
  for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
    if (!dr && !dc) continue;
    const rr = r + dr, cc = c + dc;
    if (rr < 0 || rr >= 9 || cc < 0 || cc >= 9) continue;
    if (cells[rr * 9 + cc].state === 'hidden') nb.push(rr * 9 + cc);
  }
  clues.push({ idx: i, number: cells[i].number, hidden: nb });
}

// Brute force
const hiddenIdx = [];
for (let i = 0; i < 81; i++) if (cells[i].state === 'hidden') hiddenIdx.push(i);
const F = hiddenIdx.length;
let valid = 0;
const mineCount = new Float64Array(81);
for (let bits = 0; bits < (1 << F); bits++) {
  if (popcount(bits) !== 10) continue;
  const mineSet = new Set();
  for (let b = 0; b < F; b++) if (bits & (1 << b)) mineSet.add(hiddenIdx[b]);
  let ok = true;
  for (const cl of clues) {
    let s = 0;
    for (const n of cl.hidden) if (mineSet.has(n)) s++;
    if (s !== cl.number) { ok = false; break; }
  }
  if (!ok) continue;
  valid++;
  for (const i of mineSet) mineCount[i]++;
}
console.log('valid configs:', valid);
console.log('probabilities (0-indexed row-major):');
for (let r = 0; r < 9; r++) {
  const row = [];
  for (let c = 0; c < 9; c++) {
    const i = r * 9 + c;
    const p = cells[i].state === 'hidden' ? (valid ? mineCount[i] / valid : 0) : 0;
    row.push(p.toFixed(2));
  }
  console.log(`r${r + 1}: ${row.join(' ')}`);
}

function popcount(x) { let s = 0; while (x) { s += x & 1; x >>= 1; } return s; }

// Now run our solver
const result = solveMinesweeper({ rows: 9, cols: 9, totalMines: 10, cells });
console.log('\nSOLVER OUTPUT:');
for (let r = 0; r < 9; r++) {
  const row = [];
  for (let c = 0; c < 9; c++) {
    const i = r * 9 + c;
    row.push(result.probabilities[i].toFixed(2));
  }
  console.log(`r${r + 1}: ${row.join(' ')}`);
}
