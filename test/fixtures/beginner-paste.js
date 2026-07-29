// Regression fixture for the previously incorrect Beginner layout.
const cells = Array.from({ length: 81 }, (_, i) => {
  const r = Math.floor(i / 9) + 1, c = i % 9 + 1;
  return { row: r, col: c, state: 'hidden', number: null };
});

const set = (r, c, state, number) => { cells[(r - 1) * 9 + c - 1] = { row: r, col: c, state, number }; };

// Reveal the same cells as the user's copied Beginner layout.
set(1, 1, 'hidden');
set(1, 2, 'hidden');
set(1, 3, 'hidden');
set(1, 4, 'hidden');
set(1, 5, 'revealed', 1);
set(1, 6, 'revealed', 0);
set(1, 7, 'revealed', 1);
set(1, 8, 'hidden');
set(1, 9, 'hidden');

set(2, 1, 'hidden');
set(2, 2, 'hidden');
set(2, 3, 'hidden');
set(2, 4, 'hidden');
set(2, 5, 'revealed', 2);
set(2, 6, 'revealed', 0);
set(2, 7, 'revealed', 1);
set(2, 8, 'revealed', 1);
set(2, 9, 'revealed', 1);

set(3, 1, 'hidden');
set(3, 2, 'hidden');
set(3, 3, 'hidden');
set(3, 4, 'hidden');
set(3, 5, 'revealed', 1);
set(3, 6, 'revealed', 0);
set(3, 7, 'revealed', 0);
set(3, 8, 'revealed', 0);
set(3, 9, 'revealed', 0);

set(4, 1, 'hidden');
set(4, 2, 'hidden');
set(4, 3, 'revealed', 3);
set(4, 4, 'revealed', 2);
set(4, 5, 'revealed', 1);
set(4, 6, 'revealed', 0);
set(4, 7, 'revealed', 0);
set(4, 8, 'revealed', 0);
set(4, 9, 'revealed', 0);

set(5, 1, 'hidden');
set(5, 2, 'hidden');
set(5, 3, 'revealed', 1);
set(5, 4, 'revealed', 0);
set(5, 5, 'revealed', 0);
set(5, 6, 'revealed', 0);
set(5, 7, 'revealed', 0);
set(5, 8, 'revealed', 0);
set(5, 9, 'revealed', 0);

set(6, 1, 'hidden');
set(6, 2, 'hidden');
set(6, 3, 'revealed', 1);
set(6, 4, 'revealed', 1);
set(6, 5, 'revealed', 1);
set(6, 6, 'revealed', 1);
set(6, 7, 'revealed', 0);
set(6, 8, 'revealed', 0);
set(6, 9, 'revealed', 0);

set(7, 1, 'hidden');
set(7, 2, 'hidden');
set(7, 3, 'hidden');
set(7, 4, 'hidden');
set(7, 5, 'hidden');
set(7, 6, 'revealed', 1);
set(7, 7, 'revealed', 0);
set(7, 8, 'revealed', 0);
set(7, 9, 'revealed', 0);

set(8, 1, 'hidden');
set(8, 2, 'hidden');
set(8, 3, 'hidden');
set(8, 4, 'hidden');
set(8, 5, 'hidden');
set(8, 6, 'revealed', 2);
set(8, 7, 'revealed', 1);
set(8, 8, 'revealed', 1);
set(8, 9, 'revealed', 0);

set(9, 1, 'hidden');
set(9, 2, 'hidden');
set(9, 3, 'hidden');
set(9, 4, 'hidden');
set(9, 5, 'hidden');
set(9, 6, 'hidden');
set(9, 7, 'hidden');
set(9, 8, 'revealed', 1);
set(9, 9, 'revealed', 0);

module.exports = { rows: 9, cols: 9, totalMines: 10, cells };
