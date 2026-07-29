# Minesweeper Solver Redesign Implementation Plan

> **For Hermes:** Implement task-by-task with strict TDD and browser verification.

**Goal:** Replace the current cutoff-based probability solver with a real-player solver that preserves all deterministic deductions, reduces constraints before search, and globally weights component solutions exactly.

**Architecture:** Extract a pure solver into `solver.js`, loaded before the existing inline UI script. The solver normalizes clue equations, runs direct and subset deductions to a fixed point, enumerates only unresolved connected components with constraint-pruned backtracking, and combines component mine-count distributions plus unconstrained cells with dynamic programming/binomial weighting. The UI retains the existing board, hover panel, heat map, recalculation hooks, and copy format while consuming the new solver result and provenance metadata.

**Tech Stack:** Vanilla JavaScript, Node's built-in `node:test`, single-page HTML, browser verification.

---

### Task 1: Establish pure solver API and deterministic player rules

**Files:**
- Create: `solver.js`
- Create: `test/solver.test.js`
- Modify: `index.html`

**Steps:**
1. Add failing tests for single-unknown mine, satisfied-clue safe cells, all-required mine cells, and chained propagation.
2. Run `node --test test/solver.test.js`; verify failures because the API is absent.
3. Implement `solveMinesweeper({rows, cols, totalMines, cells})` with normalized constraints and fixed-point direct deductions.
4. Run tests; verify pass.
5. Commit.

### Task 2: Add subset-difference reasoning

**Files:**
- Modify: `solver.js`
- Modify: `test/solver.test.js`

**Steps:**
1. Add failing tests for `{a,b}=1; {a,b,c}=1 → c safe` and `{a,b}=1; {a,b,c}=2 → c mine`.
2. Run tests and verify expected failures.
3. Implement equation deduplication and subset subtraction inside the fixed-point loop.
4. Run tests; verify pass.
5. Commit.

### Task 3: Add constraint-pruned component enumeration

**Files:**
- Modify: `solver.js`
- Modify: `test/solver.test.js`

**Steps:**
1. Add failing tests for an unresolved component with known exact probabilities and for a component larger than 22 cells containing an obvious forced cell.
2. Verify failure.
3. Build unresolved bipartite components after propagation; enumerate with most-constrained-variable ordering and early constraint pruning.
4. Record component solution counts by mine count and per-cell mine counts by mine count.
5. Run tests; verify pass.
6. Commit.

### Task 4: Add exact global component weighting

**Files:**
- Modify: `solver.js`
- Modify: `test/solver.test.js`

**Steps:**
1. Add the copied Beginner layout as a regression fixture with the independent 1,311-placement expected probabilities.
2. Add a separated-components + unconstrained-cells fixture.
3. Verify current tests fail.
4. Implement convolution DP across component mine-count distributions and binomial weighting for far cells.
5. Verify Beginner probabilities match the oracle cell-by-cell.
6. Commit.

### Task 5: Add bounded fallback without losing constraints

**Files:**
- Modify: `solver.js`
- Modify: `test/solver.test.js`

**Steps:**
1. Add a test that forces the enumeration budget to expire while retaining deterministic 0%/100% deductions.
2. Verify failure.
3. Add explicit `exact`, `deterministic`, and `approximate` provenance; never classify a constrained unresolved cell as an unconstrained far cell.
4. Run tests; verify pass.
5. Commit.

### Task 6: Integrate solver with UI and debugging output

**Files:**
- Modify: `index.html`
- Modify: `test/solver.test.js`

**Steps:**
1. Load `solver.js` before the UI script.
2. Replace the old `computeProbabilities()` internals with an adapter to the pure solver.
3. Map provenance into hover calculation records without changing board layout.
4. Extend Copy Layout cells with `probabilityMethod` while retaining `probability` and format compatibility.
5. Verify the copied Intermediate layout gives 100% at `(1,6)`, `(2,7)`, `(4,10)`, `(6,2)`, and `(9,4)`.
6. Commit.

### Task 7: Full verification

**Files:**
- Test: `test/solver.test.js`
- Verify: `index.html`, `solver.js`

**Steps:**
1. Run `node --test test/solver.test.js`.
2. Load the live page in a real browser and check for JavaScript errors.
3. Verify click/flag/difficulty changes recalculate probabilities.
4. Verify hover calculations agree with displayed percentages.
5. Verify board geometry remains unchanged before/after hover and Copy Layout.
6. Re-run both pasted-layout regressions.
7. Commit final integration if needed.
