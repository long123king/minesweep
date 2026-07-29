(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.MinesweeperSolver = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  function solveMinesweeper(input) {
    const { rows, cols, totalMines, cells } = input;
    const N = rows * cols;
    const probabilities = new Float64Array(N);
    const methods = Array(N).fill('unknown');
    const hidden = new Set();
    const knownMines = new Set();
    const knownSafe = new Set();

    const neighbors = idx => {
      const r = Math.floor(idx / cols), c = idx % cols;
      const out = [];
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          if (!dr && !dc) continue;
          const rr = r + dr, cc = c + dc;
          if (rr >= 0 && rr < rows && cc >= 0 && cc < cols) out.push(rr * cols + cc);
        }
      }
      return out;
    };

    for (let i = 0; i < N; i++) {
      if (cells[i].state === 'hidden') hidden.add(i);
      else if (cells[i].state === 'flagged') knownMines.add(i);
      else { probabilities[i] = 0; methods[i] = 'revealed'; }
    }

    const baseConstraints = [];
    for (let i = 0; i < N; i++) {
      if (cells[i].state !== 'revealed' || !Number.isInteger(cells[i].number)) continue;
      const ns = neighbors(i);
      const flags = ns.filter(x => cells[x].state === 'flagged').length;
      const vars = ns.filter(x => cells[x].state === 'hidden');
      if (vars.length) baseConstraints.push({ vars, need: cells[i].number - flags, clue: i });
    }

    let changed = true;
    while (changed) {
      changed = false;
      for (const con of baseConstraints) {
        let need = con.need;
        const vars = [];
        for (const v of con.vars) {
          if (knownMines.has(v)) need--;
          else if (!knownSafe.has(v)) vars.push(v);
        }
        if (need < 0 || need > vars.length) continue;
        if (need === 0) {
          for (const v of vars) if (!knownSafe.has(v)) { knownSafe.add(v); changed = true; }
        } else if (need === vars.length) {
          for (const v of vars) if (!knownMines.has(v)) { knownMines.add(v); changed = true; }
        }
      }
    }

    for (const i of knownMines) {
      if (hidden.has(i)) { probabilities[i] = 1; methods[i] = 'deterministic'; }
    }
    for (const i of knownSafe) {
      if (hidden.has(i)) { probabilities[i] = 0; methods[i] = 'deterministic'; }
    }

    const unresolved = [...hidden].filter(i => !knownMines.has(i) && !knownSafe.has(i));
    const remaining = Math.max(0, totalMines - knownMines.size);
    const rate = unresolved.length ? Math.min(1, remaining / unresolved.length) : 0;
    for (const i of unresolved) { probabilities[i] = rate; methods[i] = 'approximate'; }

    return { rows, cols, probabilities: Array.from(probabilities), methods, exact: unresolved.length === 0 };
  }

  return { solveMinesweeper };
});
