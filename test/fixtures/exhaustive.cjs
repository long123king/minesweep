// Direct exhaustive check of all C(28,10) ~ 13M mine placements.
const cells = [];
const userCells = [
  ['revealed', 0], ['revealed', 1], ['hidden'], ['hidden'], ['hidden'], ['hidden'], ['revealed', 2], ['revealed', 0], ['revealed', 0],
  ['revealed', 0], ['revealed', 1], ['hidden'], ['hidden'], ['hidden'], ['hidden'], ['revealed', 3], ['revealed', 1], ['revealed', 0],
  ['revealed', 0], ['revealed', 1], ['revealed', 1], ['revealed', 1], ['revealed', 1], ['revealed', 2], ['hidden'], ['revealed', 1], ['revealed', 0],
  ['revealed', 0], ['revealed', 0], ['revealed', 0], ['revealed', 0], ['revealed', 0], ['revealed', 1], ['revealed', 1], ['revealed', 1], ['revealed', 0],
  ['revealed', 0], ['revealed', 0], ['revealed', 0], ['revealed', 0], ['revealed', 0], ['revealed', 0], ['revealed', 0], ['revealed', 0], ['revealed', 0],
  ['revealed', 1], ['revealed', 1], ['revealed', 1], ['revealed', 1], ['revealed', 1], ['revealed', 1], ['revealed', 1], ['revealed', 1], ['revealed', 0],
  ['hidden'], ['hidden'], ['hidden'], ['hidden'], ['hidden'], ['hidden'], ['hidden'], ['revealed', 1], ['revealed', 0],
  ['hidden'], ['hidden'], ['hidden'], ['hidden'], ['hidden'], ['hidden'], ['hidden'], ['revealed', 3], ['revealed', 2],
  ['hidden'], ['hidden'], ['hidden'], ['hidden'], ['hidden'], ['hidden'], ['hidden'], ['hidden'], ['hidden'],
];
for (let r = 1; r <= 9; r++) for (let c = 1; c <= 9; c++) {
  const [st, n] = userCells[(r - 1) * 9 + c - 1];
  cells.push({ row: r, col: c, state: st, number: n });
}

const clues = [];
for (let i = 0; i < 81; i++) {
  if (cells[i].state !== 'revealed' || !Number.isInteger(cells[i].number)) continue;
  const r = Math.floor(i / 9), c = i % 9;
  const nb = [];
  for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
    if (!dr && !dc) continue;
    const rr = r + dr, cc = c + dc;
    if (rr < 0 || rr >= 9 || cc < 0 || cc >= 9) continue;
    if (cells[rr * 9 + cc].state === 'hidden') nb.push(rr * 9 + cc);
  }
  clues.push({ idx: i, number: cells[i].number, hidden: nb });
}

const hiddenIdx = [];
for (let i = 0; i < 81; i++) if (cells[i].state === 'hidden') hiddenIdx.push(i);
const F = hiddenIdx.length;
console.log('hidden cells:', F);
console.log('clues:', clues.length);

// Enumerate all subsets of F cells of size 10.
const totalMines = 10;
let valid = 0;
let totalChecked = 0;
function recurse(start, picked, depth) {
  if (depth === totalMines) {
    totalChecked++;
    const mineSet = new Set();
    for (let k = 0; k < picked.length; k++) mineSet.add(picked[k]);
    for (const cl of clues) {
      let s = 0;
      for (const n of cl.hidden) if (mineSet.has(n)) s++;
      if (s !== cl.number) return;
    }
    valid++;
    return;
  }
  const remaining = F - start;
  const need = totalMines - depth;
  if (need > remaining) return;
  for (let i = start; i <= F - need; i++) {
    picked[depth] = hiddenIdx[i];
    recurse(i + 1, picked, depth + 1);
  }
}
recurse(0, new Array(totalMines), 0);
console.log('total checked:', totalChecked);
console.log('valid configs:', valid);
