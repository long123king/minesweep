// Replay the user's exact state into the live page via the debug hook.
const userJson = `{"format":"minesweeper-debug-layout-v1","difficulty":"beginner","rows":9,"cols":9,"totalMines":10,"flagsPlaced":0,"gameOver":false,"won":false,"cells":[
{"row":1,"col":1,"state":"revealed","number":0,"probability":0},
{"row":1,"col":2,"state":"revealed","number":1,"probability":0},
{"row":1,"col":3,"state":"hidden","number":null,"probability":1},
{"row":1,"col":4,"state":"hidden","number":null,"probability":0},
{"row":1,"col":5,"state":"hidden","number":null,"probability":0},
{"row":1,"col":6,"state":"hidden","number":null,"probability":1},
{"row":1,"col":7,"state":"revealed","number":2,"probability":0},
{"row":1,"col":8,"state":"revealed","number":0,"probability":0},
{"row":1,"col":9,"state":"revealed","number":0,"probability":0},
{"row":2,"col":1,"state":"revealed","number":0,"probability":0},
{"row":2,"col":2,"state":"revealed","number":1,"probability":0},
{"row":2,"col":3,"state":"hidden","number":null,"probability":1},
{"row":2,"col":4,"state":"hidden","number":null,"probability":1},
{"row":2,"col":5,"state":"hidden","number":null,"probability":1},
{"row":2,"col":6,"state":"hidden","number":null,"probability":1},
{"row":2,"col":7,"state":"revealed","number":3,"probability":0},
{"row":2,"col":8,"state":"revealed","number":1,"probability":0},
{"row":2,"col":9,"state":"revealed","number":0,"probability":0},
{"row":3,"col":1,"state":"revealed","number":0,"probability":0},
{"row":3,"col":2,"state":"revealed","number":1,"probability":0},
{"row":3,"col":3,"state":"revealed","number":1,"probability":0},
{"row":3,"col":4,"state":"revealed","number":1,"probability":0},
{"row":3,"col":5,"state":"revealed","number":1,"probability":0},
{"row":3,"col":6,"state":"revealed","number":2,"probability":0},
{"row":3,"col":7,"state":"hidden","number":null,"probability":1},
{"row":3,"col":8,"state":"revealed","number":1,"probability":0},
{"row":3,"col":9,"state":"revealed","number":0,"probability":0},
{"row":4,"col":1,"state":"revealed","number":0,"probability":0},
{"row":4,"col":2,"state":"revealed","number":0,"probability":0},
{"row":4,"col":3,"state":"revealed","number":0,"probability":0},
{"row":4,"col":4,"state":"revealed","number":0,"probability":0},
{"row":4,"col":5,"state":"revealed","number":0,"probability":0},
{"row":4,"col":6,"state":"revealed","number":1,"probability":0},
{"row":4,"col":7,"state":"revealed","number":1,"probability":0},
{"row":4,"col":8,"state":"revealed","number":1,"probability":0},
{"row":4,"col":9,"state":"revealed","number":0,"probability":0},
{"row":5,"col":1,"state":"revealed","number":0,"probability":0},
{"row":5,"col":2,"state":"revealed","number":0,"probability":0},
{"row":5,"col":3,"state":"revealed","number":0,"probability":0},
{"row":5,"col":4,"state":"revealed","number":0,"probability":0},
{"row":5,"col":5,"state":"revealed","number":0,"probability":0},
{"row":5,"col":6,"state":"revealed","number":0,"probability":0},
{"row":5,"col":7,"state":"revealed","number":0,"probability":0},
{"row":5,"col":8,"state":"revealed","number":0,"probability":0},
{"row":5,"col":9,"state":"revealed","number":0,"probability":0},
{"row":6,"col":1,"state":"revealed","number":1,"probability":0},
{"row":6,"col":2,"state":"revealed","number":1,"probability":0},
{"row":6,"col":3,"state":"revealed","number":1,"probability":0},
{"row":6,"col":4,"state":"revealed","number":1,"probability":0},
{"row":6,"col":5,"state":"revealed","number":1,"probability":0},
{"row":6,"col":6,"state":"revealed","number":1,"probability":0},
{"row":6,"col":7,"state":"revealed","number":1,"probability":0},
{"row":6,"col":8,"state":"revealed","number":1,"probability":0},
{"row":6,"col":9,"state":"revealed","number":0,"probability":0},
{"row":7,"col":1,"state":"hidden","number":null,"probability":1},
{"row":7,"col":2,"state":"hidden","number":null,"probability":1},
{"row":7,"col":3,"state":"hidden","number":null,"probability":0},
{"row":7,"col":4,"state":"hidden","number":null,"probability":0},
{"row":7,"col":5,"state":"hidden","number":null,"probability":1},
{"row":7,"col":6,"state":"hidden","number":null,"probability":0},
{"row":7,"col":7,"state":"hidden","number":null,"probability":1},
{"row":7,"col":8,"state":"revealed","number":1,"probability":0},
{"row":7,"col":9,"state":"revealed","number":0,"probability":0},
{"row":8,"col":1,"state":"hidden","number":null,"probability":0},
{"row":8,"col":2,"state":"hidden","number":null,"probability":0},
{"row":8,"col":3,"state":"hidden","number":null,"probability":0},
{"row":8,"col":4,"state":"hidden","number":null,"probability":0},
{"row":8,"col":5,"state":"hidden","number":null,"probability":0},
{"row":8,"col":6,"state":"hidden","number":null,"probability":0},
{"row":8,"col":7,"state":"hidden","number":null,"probability":1},
{"row":8,"col":8,"state":"revealed","number":3,"probability":0},
{"row":8,"col":9,"state":"revealed","number":2,"probability":0},
{"row":9,"col":1,"state":"hidden","number":null,"probability":0},
{"row":9,"col":2,"state":"hidden","number":null,"probability":0},
{"row":9,"col":3,"state":"hidden","number":null,"probability":0},
{"row":9,"col":4,"state":"hidden","number":null,"probability":0},
{"row":9,"col":5,"state":"hidden","number":null,"probability":0},
{"row":9,"col":6,"state":"hidden","number":null,"probability":0},
{"row":9,"col":7,"state":"hidden","number":null,"probability":1},
{"row":9,"col":8,"state":"hidden","number":null,"probability":1},
{"row":9,"col":9,"state":"hidden","number":null,"probability":1}
]}`;

async function main() {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', err => errors.push(err.message));
  page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });

  await page.goto('http://127.0.0.1:8765/index.html?v=row7-replay-debug');
  const setup = await page.evaluate(j => window.__loadLayout(j), userJson);
  console.log('Setup:', setup);

  // Hover each cell from row 1 to row 9.
  for (let row = 1; row <= 9; row++) {
    for (let col = 1; col <= 9; col++) {
      const idx = (row - 1) * 9 + (col - 1);
      const t0 = Date.now();
      const r = await page.evaluate(i => {
        const cell = document.querySelectorAll('.cell')[i];
        const rect = cell.getBoundingClientRect();
        cell.dispatchEvent(new PointerEvent('pointermove', { bubbles: true, pointerType: 'mouse', clientX: rect.left + 5, clientY: rect.top + 5 }));
        return {
          state: cell.classList.contains('revealed') ? 'revealed' : 'hidden',
          active: document.getElementById('board').classList.contains('analysis-active'),
          panel: document.getElementById('analysis').textContent.replace(/\s+/g, ' ').trim().slice(0, 80)
        };
      }, idx);
      const dt = Date.now() - t0;
      console.log(`r${row}c${col}: state=${r.state} active=${r.active} dt=${dt}ms panel="${r.panel}"`);
      if (dt > 100 || !r.active || r.panel.includes('Hover a cell')) {
        console.log('  >>> SUSPECT');
      }
    }
  }
  console.log('\nErrors:', errors);
  await browser.close();
}

main().catch(e => { console.error(e); process.exit(1); });
