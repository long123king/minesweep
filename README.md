# Minesweeper

A classic Minesweeper game implemented in a single HTML5 file — no build step, no dependencies, no server. Open `index.html` in any modern browser to play.

## How to play

- **Left-click** — reveal a cell
- **Right-click** (or long-press on touch) — place / remove a flag
- **Click on a revealed number** — chord reveal (reveals neighbors if your flag count matches)
- **`R`** or click the smiley face — reset the current board

## Difficulty

| Level | Board | Mines |
|---|---|---|
| Beginner | 9 × 9 | 10 |
| Intermediate | 16 × 16 | 40 |
| Expert | 16 × 30 | 99 |

The first click is always safe — mines are placed after your first reveal, never on the clicked cell or its immediate neighbors.

## Run

```sh
open index.html       # macOS
xdg-open index.html   # Linux
start index.html      # Windows
```

Or just double-click `index.html` in your file manager.