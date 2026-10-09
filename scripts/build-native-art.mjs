import { mkdir, writeFile } from 'node:fs/promises';
await mkdir('assets/guardian', { recursive: true });
for (const [name, accent] of [['fluid', '#244EBC'], ['grid', '#0F6562'], ['ledger', '#72503B']]) {
  let shapes = '';
  if (name !== 'ledger') {
    for (let x = 0; x <= 600; x += 30) shapes += `<path d="M${x} 0V360" opacity=".08"/>`;
    for (let y = 0; y <= 360; y += 30) shapes += `<path d="M0 ${y}H600" opacity=".08"/>`;
  }
  if (name === 'grid') {
    for (let row = 0; row < 16; row++) for (let col = 0; col < 22; col++) {
      shapes += `<circle cx="${102 + col * 19}" cy="${(112 + row * 8 + Math.sin(col * .23 + row * .2) * 24).toFixed(2)}" r="1.4" fill="${accent}" stroke="none"/>`;
    }
  } else if (name === 'ledger') {
    for (let i = 0; i < 19; i++) shapes += `<ellipse cx="300" cy="180" rx="${70 + i * 5}" ry="${120 - i * 2.3}" transform="rotate(${i * 2} 300 180)" opacity=".5"/>`;
  } else {
    for (let i = 0; i < 24; i++) {
      const points = Array.from({ length: 121 }, (_, j) => {
        const angle = j / 120 * Math.PI * 2;
        const radius = 128 + Math.sin(angle * 3 + i * .025) * 30 + i * 1.1;
        return `${(300 + Math.cos(angle) * radius).toFixed(2)},${(180 + Math.sin(angle) * radius * .75).toFixed(2)}`;
      }).join(' ');
      shapes += `<polyline points="${points}" opacity=".45"/>`;
    }
    for (let i = 0; i < 60; i++) {
      const angle = i * 2.399, radius = 215 + i % 5 * 5;
      shapes += `<circle cx="${(300 + Math.cos(angle) * radius).toFixed(2)}" cy="${(180 + Math.sin(angle) * radius * .65).toFixed(2)}" r="1" fill="${accent}" stroke="none" opacity=".4"/>`;
    }
  }
  await writeFile(`assets/guardian/${name}.svg`, `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="360" viewBox="0 0 600 360"><g fill="none" stroke="${accent}" stroke-width=".9">${shapes}</g></svg>`);
}
