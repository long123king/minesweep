const test = require('node:test');
const assert = require('node:assert/strict');
const { solveMinesweeper } = require('../solver.js');

function board(rows, cols, totalMines, revealed, flagged = []) {
  const cells = Array.from({ length: rows * cols }, (_, i) => ({
    row: Math.floor(i / cols) + 1,
    col: i % cols + 1,
    state: 'hidden',
    number: null,
  }));
  for (const [r, c, number] of revealed) {
    Object.assign(cells[(r - 1) * cols + c - 1], { state: 'revealed', number });
  }
  for (const [r, c] of flagged) {
    Object.assign(cells[(r - 1) * cols + c - 1], { state: 'flagged' });
  }
  return { rows, cols, totalMines, cells };
}

function p(result, r, c) {
  return result.probabilities[(r - 1) * result.cols + c - 1];
}

test('single hidden neighbor of 1 is a forced mine', () => {
  const input = board(2, 3, 1, [
    [1, 1, 0], [1, 2, 1], [2, 1, 0], [2, 2, 1], [2, 3, 1],
  ]);
  const result = solveMinesweeper(input);
  assert.equal(p(result, 1, 3), 1);
  assert.equal(result.methods[2], 'deterministic');
});

test('satisfied clue makes every other hidden neighbor safe', () => {
  const input = board(2, 3, 1, [[2, 2, 1]], [[1, 1]]);
  const result = solveMinesweeper(input);
  assert.equal(p(result, 1, 2), 0);
  assert.equal(p(result, 1, 3), 0);
  assert.equal(p(result, 2, 1), 0);
  assert.equal(p(result, 2, 3), 0);
});

test('when clue needs every hidden neighbor, all are mines', () => {
  const input = board(2, 3, 3, [
    [1, 1, 3], [1, 2, 3], [1, 3, 3],
  ]);
  const result = solveMinesweeper(input);
  assert.equal(p(result, 2, 1), 1);
  assert.equal(p(result, 2, 2), 1);
  assert.equal(p(result, 2, 3), 1);
});

test('deductions propagate until fixed point', () => {
  // Top clue forces (1,1) mine. Bottom clue then has its mine satisfied,
  // making (3,1) safe.
  const input = board(3, 2, 1, [
    [1, 2, 1], [2, 1, 1], [2, 2, 1], [3, 2, 1],
  ]);
  const result = solveMinesweeper(input);
  assert.equal(p(result, 1, 1), 1);
  assert.equal(p(result, 3, 1), 0);
});
