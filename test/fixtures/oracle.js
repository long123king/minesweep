// Verifier for the Beginner paste: enumerate all valid mine placements
// over the hidden cells and report exact per-cell mine probability.
function probForLayout(input) {
  const { rows, cols, totalMines, cells } = input;
  const N = rows * cols;
  const hiddenIdx = [];
  for (let i = 0; i < N; i++) if (cells[i].state === 'hidden') hiddenIdx.push(i);
  const F = hiddenIdx.length;
  const clues = [];
  for (let i = 0; i < N; i++) {
    if (cells[i].state !== 'revealed') continue;
    const nb = [];
    for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
      if (!dr && !dc) continue;
      const rr = Math.floor(i / cols) + dr, cc = (i % cols) + dc;
      if (rr < 0 || rr >= rows || cc < 0 || cc >= cols) continue;
      const ni = rr * cols + cc;
      if (cells[ni].state === 'hidden') nb.push(ni);
    }
    clues.push({ nb, need: cells[i].number });
  }
  const mineCount = new Float64Array(N);
  let valid = 0;
  for (let bits = 0; bits < (1 << F); bits++) {
    if (popcount(bits) !== totalMines) continue;
    const set = new Set();
    for (let b = 0; b < F; b++) if (bits & (1 << b)) set.add(hiddenIdx[b]);
    let ok = true;
    for (const cl of clues) {
      let s = 0;
      for (const n of cl.nb) if (set.has(n)) s++;
      if (s !== cl.need) { ok = false; break; }
    }
    if (!ok) continue;
    valid++;
    for (const i of set) mineCount[i]++;
  }
  if (!valid) throw new Error('No valid mine placements');
  const probs = new Array(N).fill(0);
  for (let i = 0; i < N; i++) probs[i] = mineCount[i] / valid;
  return { probs, valid };
}

function popcount(x) { let s = 0; while (x) { s += x & 1; x >>= 1; } return s; }

module.exports = { probForLayout };
