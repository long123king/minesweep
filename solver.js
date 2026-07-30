(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.MinesweeperSolver = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  function solveMinesweeper(input) {
    const { rows, cols, totalMines, cells } = input;
    const priorFacts = Array.isArray(input.priorFacts) ? input.priorFacts : null;
    const N = rows * cols;
    const probabilities = new Float64Array(N);
    const methods = Array(N).fill('unknown');
    const factStates = Array(N).fill(-1); // -1 unknown, 0 safe, 1 mine
    const hidden = new Set();
    const knownMines = new Set();
    const knownSafe = new Set();
    let inconsistent = false;

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
      if (cells[i].state === 'flagged') {
        knownMines.add(i);
        probabilities[i] = 1;
        methods[i] = 'flagged';
        factStates[i] = 1;
        continue;
      }
      if (cells[i].state === 'revealed') {
        probabilities[i] = 0;
        methods[i] = 'revealed';
        factStates[i] = 0;
        continue;
      }
      hidden.add(i);
      const prior = priorFacts && priorFacts[i];
      if (prior === 1) {
        knownMines.add(i);
        methods[i] = 'persisted';
        factStates[i] = 1;
      } else if (prior === 0) {
        knownSafe.add(i);
        methods[i] = 'persisted';
        factStates[i] = 0;
      }
    }

    const constraints = [];
    for (let i = 0; i < N; i++) {
      if (cells[i].state !== 'revealed' || !Number.isInteger(cells[i].number)) continue;
      let need = cells[i].number;
      const vars = [];
      for (const nb of neighbors(i)) {
        if (knownMines.has(nb)) {
          need -= 1;
        } else if (cells[nb].state === 'hidden' && !knownSafe.has(nb)) {
          vars.push(nb);
        }
      }
      if (need < 0 || need > vars.length) inconsistent = true;
      constraints.push({ vars, need, clue: i });
    }

    function effectiveConstraint(con) {
      const live = [];
      let forcedMines = 0;
      for (const v of con.vars) {
        if (knownMines.has(v)) forcedMines++;
        else if (!knownSafe.has(v)) live.push(v);
      }
      const effNeed = con.need - forcedMines;
      if (effNeed < 0 || effNeed > live.length) inconsistent = true;
      return { live, effNeed };
    }

    let changed = true;
    while (changed) {
      changed = false;

      for (const con of constraints) {
        const { live, effNeed } = effectiveConstraint(con);
        if (live.length === 0) continue;
        if (effNeed === 0) {
          for (const v of live) {
            if (!knownSafe.has(v)) {
              knownSafe.add(v);
              changed = true;
            }
          }
        } else if (effNeed === live.length) {
          for (const v of live) {
            if (!knownMines.has(v)) {
              knownMines.add(v);
              changed = true;
            }
          }
        }
      }

      for (let i = 0; i < constraints.length; i++) {
        const aEff = effectiveConstraint(constraints[i]);
        if (aEff.live.length === 0) continue;
        const aSet = new Set(aEff.live);
        for (let j = 0; j < constraints.length; j++) {
          if (i === j) continue;
          const bEff = effectiveConstraint(constraints[j]);
          if (aEff.live.length >= bEff.live.length || bEff.live.length === 0) continue;
          if (!aEff.live.every(v => bEff.live.includes(v))) continue;
          const diff = bEff.live.filter(v => !aSet.has(v));
          const needDiff = bEff.effNeed - aEff.effNeed;
          if (needDiff < 0 || needDiff > diff.length) {
            inconsistent = true;
            continue;
          }
          if (needDiff === 0) {
            for (const v of diff) {
              if (!knownSafe.has(v)) {
                knownSafe.add(v);
                changed = true;
              }
            }
          } else if (needDiff === diff.length) {
            for (const v of diff) {
              if (!knownMines.has(v)) {
                knownMines.add(v);
                changed = true;
              }
            }
          }
        }
      }
    }

    for (const i of hidden) {
      if (knownMines.has(i)) {
        probabilities[i] = 1;
        methods[i] = methods[i] === 'persisted' ? 'persisted' : 'deterministic';
        factStates[i] = 1;
      } else if (knownSafe.has(i)) {
        probabilities[i] = 0;
        methods[i] = methods[i] === 'persisted' ? 'persisted' : 'deterministic';
        factStates[i] = 0;
      }
    }

    const unresolved = [...hidden].filter(i => !knownMines.has(i) && !knownSafe.has(i));
    const remaining = Math.max(0, totalMines - knownMines.size);
    const defaultRate = unresolved.length ? Math.min(1, remaining / unresolved.length) : 0;
    for (const i of unresolved) {
      probabilities[i] = defaultRate;
      methods[i] = 'approximate';
    }

    const unresolvedSet = new Set(unresolved);
    const fToU = new Map();
    const uToF = new Map();
    for (const con of constraints) {
      const { live, effNeed } = effectiveConstraint(con);
      if (live.length === 0) continue;
      if (effNeed < 0 || effNeed > live.length) continue;
      for (const v of live) {
        if (!unresolvedSet.has(v)) continue;
        if (!fToU.has(con.clue)) fToU.set(con.clue, new Set());
        fToU.get(con.clue).add(v);
        if (!uToF.has(v)) uToF.set(v, new Set());
        uToF.get(v).add(con.clue);
      }
    }

    const compIdU = new Map();
    const compVars = [];
    for (const start of unresolved) {
      if (compIdU.has(start) || !uToF.has(start)) continue;
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

    for (const vars of compVars) {
      const idx = new Map(vars.map((v, i) => [v, i]));
      const liveCons = [];
      for (const con of constraints) {
        const { live, effNeed } = effectiveConstraint(con);
        const componentVars = live.filter(v => idx.has(v));
        if (componentVars.length === 0) continue;
        if (componentVars.length !== live.length) continue;
        if (effNeed < 0 || effNeed > componentVars.length) continue;
        liveCons.push({ liveVars: componentVars, effNeed });
      }
      if (!liveCons.length) continue;
      if (vars.length > 22) continue;

      const mineCount = new Float64Array(vars.length);
      let validConfigs = 0;

      function recurse(depth, bits, ones) {
        if (ones > remaining) return;
        if (depth === vars.length) {
          for (const con of liveCons) {
            let s = 0;
            for (const v of con.liveVars) if (bits & (1 << idx.get(v))) s++;
            if (s !== con.effNeed) return;
          }
          validConfigs++;
          for (let i = 0; i < vars.length; i++) if (bits & (1 << i)) mineCount[i]++;
          return;
        }
        recurse(depth + 1, bits, ones);
        recurse(depth + 1, bits | (1 << depth), ones + 1);
      }

      recurse(0, 0, 0);
      if (validConfigs === 0) continue;

      for (let i = 0; i < vars.length; i++) {
        const cellIdx = vars[i];
        probabilities[cellIdx] = mineCount[i] / validConfigs;
        methods[cellIdx] = 'enumerated';
        if (probabilities[cellIdx] === 0) factStates[cellIdx] = 0;
        else if (probabilities[cellIdx] === 1) factStates[cellIdx] = 1;
      }
    }

    return {
      rows,
      cols,
      probabilities: Array.from(probabilities),
      methods,
      factStates,
      exact: unresolved.length === 0,
      inconsistent,
    };
  }

  return { solveMinesweeper };
});
