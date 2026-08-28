/*
 * Demotes stray <h1> elements to <h2> in the restored articles.
 *
 * 18 articles carry more than one <h1> — the first is the real page heading and
 * the rest are body headings that were authored as <h1> in the old WordPress
 * editor. Google has said plainly that multiple <h1>s are not a ranking penalty,
 * so the reason to fix this is the document outline: screen reader users
 * navigate by heading level, and a page with eight top-level headings has no
 * usable structure.
 *
 * Only headings after the first are touched, and their attributes are kept.
 */
const fs = require('fs');
const path = require('path');

const SKIP = new Set(['.git', 'node_modules', 'assets', 'tools', 'blog',
  'about-us', 'contact-us', 'privacy-policy', 'terms', 'category']);

const articles = fs.readdirSync(__dirname, { withFileTypes: true })
  .filter(d => d.isDirectory() && !SKIP.has(d.name)
    && fs.existsSync(path.join(__dirname, d.name, 'index.html')))
  .map(d => d.name);

let filesChanged = 0, demoted = 0;

for (const slug of articles) {
  const file = path.join(__dirname, slug, 'index.html');
  const html = fs.readFileSync(file, 'utf8');

  const opens = [...html.matchAll(/<h1(\s[^>]*)?>/gi)];
  if (opens.length < 2) continue;

  // Walk backwards so earlier match offsets stay valid as we splice.
  let out = html;
  let n = 0;
  for (let i = opens.length - 1; i >= 1; i--) {
    const open = opens[i];
    const closeAt = out.toLowerCase().indexOf('</h1>', open.index);
    if (closeAt === -1) continue;
    out = out.slice(0, closeAt) + '</h2>' + out.slice(closeAt + 5);
    out = out.slice(0, open.index)
        + '<h2' + (open[1] || '') + '>'
        + out.slice(open.index + open[0].length);
    n++;
  }

  if (out !== html) {
    fs.writeFileSync(file, out);
    filesChanged++;
    demoted += n;
    console.log(`  ${String(n).padStart(2)} demoted  ${slug}`);
  }
}

console.log('');
console.log('files changed :', filesChanged);
console.log('h1 -> h2      :', demoted);
