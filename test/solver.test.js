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

test('subset difference identifies an extra safe cell', () => {
  // (2,1): {a,b}=1; (2,2): {a,b,c}=1, therefore c is safe.
  const input = board(2, 3, 1, [[2, 1, 1], [2, 2, 1], [2, 3, 0]]);
  const result = solveMinesweeper(input);
  assert.equal(p(result, 1, 3), 0);
  assert.equal(result.methods[2], 'deterministic');
});

test('subset difference identifies an extra mine', () => {
  // (2,1): {a,b}=1; (2,2): {a,b,c}=2, therefore c is a mine.
  const input = board(2, 3, 2, [[2, 1, 1], [2, 2, 2], [2, 3, 1]]);
  const result = solveMinesweeper(input);
  assert.equal(p(result, 1, 3), 1);
  assert.equal(result.methods[2], 'deterministic');
});

test('deductions propagate until fixed point', () => {
  // 2x3 board. Hidden cells: (1,3) and (2,1). Revealed cells form clues:
  //   (1,1)=1: hidden neighbors are (1,2)[revealed] and (2,1). need=1, vars=1 -> (2,1) is a mine.
  //   (2,2)=1: hidden neighbors are (1,3). need=1 - 1 flag (=2,1) = 0, vars=1 -> (1,3) is safe.
  const input = board(2, 3, 1, [
    [1, 1, 1], [1, 2, 1],
    [2, 2, 1],
  ]);
  const result = solveMinesweeper(input);
  assert.equal(p(result, 2, 1), 1);
  assert.equal(p(result, 1, 3), 0);
});
