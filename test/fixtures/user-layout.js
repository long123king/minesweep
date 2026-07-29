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
const expected = new Float64Array(81);
// Enumerate combinations of size totalMines.
function recurse(start, picked, depth) {
  if (depth === 10) {
    const mineSet = new Set();
    for (let k = 0; k < picked.length; k++) mineSet.add(picked[k]);
    for (const cl of clues) {
      let s = 0;
      for (const n of cl.hidden) if (mineSet.has(n)) s++;
      if (s !== cl.number) return;
    }
    valid++;
    for (const i of mineSet) mineCount[i]++;
    for (let i = 0; i < 81; i++) {
      if (cells[i].state === 'hidden' && !mineSet.has(i)) expected[i]++;
    }
    return;
  }
  const need = 10 - depth;
  for (let i = start; i <= F - need; i++) {
    picked[depth] = hiddenIdx[i];
    recurse(i + 1, picked, depth + 1);
  }
}
recurse(0, new Array(10), 0);
for (let i = 0; i < 81; i++) {
  if (cells[i].state === 'hidden') expected[i] = (valid ? expected[i] / valid : 0);
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
