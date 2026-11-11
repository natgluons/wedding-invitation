#!/usr/bin/env node
/**
 * Builds personalised invitation links for a guest list.
 *
 *   node tools/generate-links.js --base https://yourname.github.io/wedding-invitation/
 *   node tools/generate-links.js --in guests.csv --out guest-links.csv --html guest-links.html
 *
 * Input CSV: two columns, `name` and `seats` (1-6). A header row is optional.
 * Output:   a CSV for mail merge plus an HTML page with copy buttons.
 */

const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const MAX_SEATS = 6;

function readArgs(argv) {
  const args = {in: 'guests.csv', out: 'guest-links.csv', html: 'guest-links.html', base: ''};
  for (let i = 0; i < argv.length; i++) {
    const key = argv[i];
    const value = argv[i + 1];
    if (!key.startsWith('--')) continue;
    const name = key.slice(2);
    if (value === undefined || value.startsWith('--')) {
      if (name === 'help') args.help = true;
      continue;
    }
    if (name in args) {
      args[name] = value;
      i++;
    }
  }
  return args;
}

function readSiteUrlFromConfig() {
  try {
    const source = fs.readFileSync(path.join(ROOT, 'config.js'), 'utf8');
    const match = source.match(/siteUrl\s*:\s*['"]([^'"]*)['"]/);
    return match ? match[1].trim() : '';
  } catch {
    return '';
  }
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = '';
  let quoted = false;
  const input = text.replace(/^\uFEFF/, '');

  for (let i = 0; i < input.length; i++) {
    const char = input[i];
    if (quoted) {
      if (char === '"') {
        if (input[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          quoted = false;
        }
      } else {
        field += char;
      }
    } else if (char === '"') {
      quoted = true;
    } else if (char === ',') {
      row.push(field);
      field = '';
    } else if (char === '\n') {
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
    } else if (char !== '\r') {
      field += char;
    }
  }
  if (field !== '' || row.length) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((cells) => cells.some((cell) => cell.trim() !== ''));
}

function clampSeats(value) {
  const seats = Number.parseInt(String(value).trim(), 10);
  if (!Number.isFinite(seats)) return 2;
  return Math.min(MAX_SEATS, Math.max(1, seats));
}

function normaliseBase(base) {
  const trimmed = base.trim();
  if (!trimmed) return '';
  if (trimmed.endsWith('/')) return `${trimmed}index.html`;
  return trimmed;
}

function buildLink(base, name, seats) {
  const url = new URL(base);
  url.searchParams.set('name', name);
  url.searchParams.set('guests', String(seats));
  return url.toString();
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function csvCell(value) {
  const text = String(value);
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function renderHtml(rows, base) {
  const generated = new Date().toLocaleString('en-GB', {dateStyle: 'medium', timeStyle: 'short'});
  const body = rows.map((row) => `
      <tr>
        <td>${escapeHtml(row.name)}</td>
        <td class="num">${row.seats}</td>
        <td class="link"><a href="${escapeHtml(row.link)}" target="_blank" rel="noopener noreferrer">${escapeHtml(row.link)}</a></td>
        <td><button type="button" data-copy="${escapeHtml(row.link)}">Copy</button></td>
      </tr>`).join('');

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Guest invitation links</title>
<style>
  :root { color-scheme: light; }
  body { margin: 0; padding: 28px 20px 60px; background: #f7f1e6; color: #3c2a26;
         font: 15px/1.5 Georgia, "Times New Roman", serif; }
  h1 { margin: 0 0 6px; font-size: 25px; color: #792a32; }
  p.meta { margin: 0 0 24px; font-size: 13px; color: #6b524a; }
  table { width: 100%; border-collapse: collapse; background: #fffdf8; box-shadow: 0 8px 24px #51281a10; }
  th, td { padding: 10px 12px; border-bottom: 1px solid #e6d7c3; text-align: left; vertical-align: top; }
  th { font-size: 11px; letter-spacing: .1em; text-transform: uppercase; color: #a8844f; }
  td.num { text-align: center; }
  td.link { font: 12px/1.5 ui-monospace, Consolas, monospace; word-break: break-all; }
  td.link a { color: #792a32; }
  button { padding: 6px 12px; border: 1px solid #b99472; border-radius: 999px;
           background: transparent; color: #792a32; font: inherit; font-size: 12px; cursor: pointer; }
  button:hover { background: #f3e6d5; }
  button.done { border-color: #9bb98a; background: #f2f7ec; color: #3f5c33; }
  @media (max-width: 720px) {
    td.link { display: none; }
    th:nth-child(3) { display: none; }
    table { font-size: 14px; }
  }
</style>
</head>
<body>
  <h1>Guest invitation links</h1>
  <p class="meta">${rows.length} guests · generated ${escapeHtml(generated)} · base <span>${escapeHtml(base)}</span></p>
  <table>
    <thead><tr><th>Guest</th><th>Seats</th><th>Link</th><th></th></tr></thead>
    <tbody>${body}
    </tbody>
  </table>
  <script>
    document.querySelectorAll('button[data-copy]').forEach((button) => {
      button.addEventListener('click', async () => {
        const text = button.dataset.copy;
        try {
          await navigator.clipboard.writeText(text);
        } catch {
          const area = document.createElement('textarea');
          area.value = text;
          document.body.appendChild(area);
          area.select();
          document.execCommand('copy');
          area.remove();
        }
        const label = button.textContent;
        button.textContent = 'Copied';
        button.classList.add('done');
        setTimeout(() => { button.textContent = label; button.classList.remove('done'); }, 1400);
      });
    });
  </script>
</body>
</html>
`;
}

function main() {
  const args = readArgs(process.argv.slice(2));
  if (args.help) {
    console.log(`Usage: node tools/generate-links.js [options]

  --base <url>   Public invitation URL (defaults to siteUrl in config.js)
  --in <file>    Guest list CSV (default guests.csv)
  --out <file>   Output CSV (default guest-links.csv)
  --html <file>  Output HTML preview (default guest-links.html)

Guest CSV columns: name, seats (1-${MAX_SEATS}). Example in guests.example.csv.`);
    return;
  }

  const base = normaliseBase(args.base || readSiteUrlFromConfig());
  if (!base) {
    console.error('No base URL. Pass --base https://your-site.example/ or set siteUrl in config.js.');
    process.exitCode = 1;
    return;
  }
  try {
    new URL(base);
  } catch {
    console.error(`Base URL is not valid: ${base}`);
    process.exitCode = 1;
    return;
  }

  const inputPath = path.resolve(ROOT, args.in);
  if (!fs.existsSync(inputPath)) {
    console.error(`Guest list not found: ${inputPath}`);
    console.error('Copy guests.example.csv to guests.csv and fill it in.');
    process.exitCode = 1;
    return;
  }

  const table = parseCsv(fs.readFileSync(inputPath, 'utf8'));
  if (!table.length) {
    console.error('Guest list is empty.');
    process.exitCode = 1;
    return;
  }

  const first = table[0].map((cell) => cell.trim().toLowerCase());
  const hasHeader = first.includes('name');
  const nameIndex = hasHeader ? first.indexOf('name') : 0;
  const seatsIndex = hasHeader ? Math.max(0, first.indexOf('seats')) : 1;
  const dataRows = hasHeader ? table.slice(1) : table;

  const seen = new Set();
  const rows = [];
  let skipped = 0;

  for (const cells of dataRows) {
    const name = (cells[nameIndex] || '').replace(/\s+/g, ' ').trim();
    if (!name) {
      skipped++;
      continue;
    }
    const key = name.toLowerCase();
    if (seen.has(key)) {
      console.warn(`Skipping duplicate name: ${name}`);
      skipped++;
      continue;
    }
    seen.add(key);

    const rawSeats = (cells[seatsIndex] || '').trim();
    const seats = clampSeats(rawSeats || 2);
    if (rawSeats && Number.parseInt(rawSeats, 10) > MAX_SEATS) {
      console.warn(`${name}: ${rawSeats} seats exceeds the form maximum, using ${MAX_SEATS}.`);
    }
    rows.push({name, seats, link: buildLink(base, name, seats)});
  }

  if (!rows.length) {
    console.error('No usable guest names found.');
    process.exitCode = 1;
    return;
  }

  const outPath = path.resolve(ROOT, args.out);
  const csv = ['name,seats,link', ...rows.map((row) =>
    [row.name, row.seats, row.link].map(csvCell).join(',')
  )].join('\r\n');
  fs.writeFileSync(outPath, `\uFEFF${csv}\r\n`, 'utf8');

  const htmlPath = path.resolve(ROOT, args.html);
  fs.writeFileSync(htmlPath, renderHtml(rows, base), 'utf8');

  console.log(`Base URL : ${base}`);
  console.log(`Guests   : ${rows.length}${skipped ? ` (${skipped} skipped)` : ''}`);
  console.log(`CSV      : ${outPath}`);
  console.log(`Preview  : ${htmlPath}`);
}

main();
