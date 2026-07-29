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

    const constraints = baseConstraints.map(c => ({
      vars: c.vars.filter(v => !knownMines.has(v) && !knownSafe.has(v)).slice(),
      need: c.need,
      clue: c.clue,
    })).filter(c => c.vars.length > 0);

    let changed = true;
    while (changed) {
      changed = false;
      for (const con of constraints) {
        if (con.need < 0 || con.need > con.vars.length) continue;
        if (con.need === 0) {
          for (const v of con.vars) if (!knownSafe.has(v)) { knownSafe.add(v); changed = true; }
          con.vars = [];
        } else if (con.need === con.vars.length) {
          for (const v of con.vars) if (!knownMines.has(v)) { knownMines.add(v); changed = true; }
          con.vars = [];
        }
      }
      for (const con of constraints) con.vars = con.vars.filter(v => !knownMines.has(v) && !knownSafe.has(v));
      // Subset difference: if a ⊂ b, then b needs (need_b - need_a) extra mines
      // among (b \ a) and (a) is exactly need_a. Identify the extra cells.
      for (let i = 0; i < constraints.length; i++) {
        for (let j = 0; j < constraints.length; j++) {
          if (i === j) continue;
          const a = constraints[i], b = constraints[j];
          if (a.vars.length === 0) continue;
          const aSet = new Set(a.vars);
          if (a.vars.every(v => b.vars.includes(v)) && a.vars.length < b.vars.length) {
            const diff = b.vars.filter(v => !aSet.has(v));
            const needDiff = b.need - a.need;
            if (needDiff === 0) {
              for (const v of diff) if (!knownSafe.has(v)) { knownSafe.add(v); changed = true; }
              b.vars = a.vars.slice();
              b.need = a.need;
            } else if (needDiff === diff.length) {
              for (const v of diff) if (!knownMines.has(v)) { knownMines.add(v); changed = true; }
              b.vars = a.vars.slice();
              b.need = a.need;
            } else if (needDiff >= 0 && needDiff < diff.length) {
              // Recurse on the new subconstraint.
              b.vars = diff.slice();
              b.need = needDiff;
            }
          }
        }
      }
      for (const con of constraints) con.vars = con.vars.filter(v => !knownMines.has(v) && !knownSafe.has(v));
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

    // Build component graph over unresolved frontier cells.
    const fToU = new Map();
    const uToF = new Map();
    for (const con of constraints) {
      if (con.need < 0 || con.need > con.vars.length) continue;
      for (const v of con.vars) {
        if (!fToU.has(con.clue)) fToU.set(con.clue, new Set());
        fToU.get(con.clue).add(v);
        if (!uToF.has(v)) uToF.set(v, new Set());
        uToF.get(v).add(con.clue);
      }
    }
    const compIdU = new Map();
    const compVars = [];
    for (const start of unresolved) {
      if (compIdU.has(start)) continue;
      if (!uToF.has(start)) continue;
      const cid = compVars.length;
      const uset = [];
      const stack = [start];
      compIdU.set(start, cid);
      uset.push(start);
      while (stack.length) {
        const cur = stack.pop();
        for (const f of uToF.get(cur) || []) {
          for (const v of fToU.get(f) || []) {
            if (!compIdU.has(v)) {
              compIdU.set(v, cid);
              uset.push(v);
              stack.push(v);
            }
          }
        }
      }
      compVars.push(uset);
    }
    const compConstraints = compVars.map(vs => {
      const involvedCons = new Set();
      for (const v of vs) for (const f of uToF.get(v) || []) involvedCons.add(f);
      return constraints.filter(c => involvedCons.has(c.clue));
    });

    for (let ci = 0; ci < compVars.length; ci++) {
      const vars = compVars[ci];
      const cons = compConstraints[ci];
      if (!cons.length) continue;
      const idx = new Map(vars.map((v, i) => [v, i]));
      const ordered = cons.slice().sort((a, b) => {
        const da = a.need, db = b.need;
        if (da !== db) return da - db;
        return a.vars.length - b.vars.length;
      });
      const total = vars.length;
      const mineCount = new Float64Array(total);
      let validConfigs = 0;
      const mineBudget = Math.min(remaining, total);
      const cellConfigCount = new Float64Array(total);
      function recurse(depth, partial) {
        if (depth === total) {
          validConfigs++;
          for (let i = 0; i < total; i++) if (partial & (1 << i)) mineCount[i]++;
          return;
        }
        const remainingCells = total - depth;
        const maxAssign = Math.min(mineBudget - partial, remainingCells);
        for (let take = 0; take <= maxAssign; take++) {
          // pick `take` mines into the next `remainingCells` slots
          // Equivalent to assigning the next `take` of the remaining variables.
          // For simplicity we use per-variable backtracking instead.
          recurseVariable(depth, partial, take);
          return;
        }
      }
      // Simple per-variable backtracking (avoids combinatorial generation).
      function recurseVariable(depth, partial) {
        if (depth === total) {
          // Check constraints satisfied.
          for (const con of cons) {
            let s = 0;
            for (const v of con.vars) {
              if (partial & (1 << idx.get(v))) s++;
            }
            if (s !== con.need) return;
          }
          validConfigs++;
          for (let i = 0; i < total; i++) if (partial & (1 << i)) mineCount[i]++;
          return;
        }
        const ones = popcount32(partial);
        if (ones > remaining) return;
        // Try this variable as a safe cell.
        recurseVariable(depth + 1, partial);
        // Try as a mine.
        if (ones < remaining) {
          recurseVariable(depth + 1, partial | (1 << depth));
        }
      }
      recurseVariable(0, 0);
      if (validConfigs > 0) {
        for (let i = 0; i < total; i++) {
          const cellIdx = vars[i];
          probabilities[cellIdx] = mineCount[i] / validConfigs;
          methods[cellIdx] = 'enumerated';
        }
      }
    }

    return { rows, cols, probabilities: Array.from(probabilities), methods, exact: unresolved.length === 0 };
  }

  function popcount32(x) {
    x = x - ((x >> 1) & 0x55555555);
    x = (x & 0x33333333) + ((x >> 2) & 0x33333333);
    return (((x + (x >> 4)) & 0x0f0f0f0f) * 0x01010101) >> 24;
  }

  return { solveMinesweeper };
});
