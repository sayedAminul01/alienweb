/*
 * Gives every orphaned article inbound internal links.
 *
 * 14 articles had no link from any other article — only from blog.html. Seven of
 * them are the institute's own course pages, which is a business problem as much
 * as a crawling one: those are the pages that sell the courses.
 *
 * For each orphan this picks the two most topically similar articles that do not
 * already link to it, and appends a card to their existing "Related reading"
 * block. Similarity is word overlap between slugs, which is crude but reliable
 * here because the slugs are descriptive; anything with no overlap at all is
 * skipped rather than linked arbitrarily, since an unrelated link helps nobody.
 */
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const SKIP = new Set(['.git', 'node_modules', 'assets', 'about-us', 'contact-us',
  'privacy-policy', 'terms', 'category', 'tools', 'blog']);
const STOP = new Set(['the', 'a', 'an', 'and', 'or', 'of', 'in', 'to', 'for', 'with',
  'on', 'is', 'are', 'how', 'what', 'your', 'you', 'best', 'guide', 'complete',
  'https', 'alienweb', 'com', '2024', '2025', '2026']);

const decode = s => s.replace(/&amp;/g, '&').replace(/&#39;/g, "'").replace(/&quot;/g, '"');
const encode = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const articles = fs.readdirSync(ROOT, { withFileTypes: true })
  .filter(d => d.isDirectory() && !SKIP.has(d.name)
    && fs.existsSync(path.join(ROOT, d.name, 'index.html')))
  .map(d => d.name);

const page = {};
for (const slug of articles) {
  const html = fs.readFileSync(path.join(ROOT, slug, 'index.html'), 'utf8');
  page[slug] = {
    html,
    title: decode((html.match(/<title>([\s\S]*?)<\/title>/) || [])[1] || '').trim(),
    date: (html.match(/<p class="post-meta"><span>([^<]+)<\/span>/) || [])[1] || '',
    words: new Set(slug.split('-').filter(w => w.length > 2 && !STOP.has(w))),
  };
}

/* Who links to whom, counting only links in the article body. */
const inbound = {};
articles.forEach(a => (inbound[a] = new Set()));
for (const from of articles) {
  const main = page[from].html.slice(page[from].html.indexOf('<main'),
    page[from].html.indexOf('</main>'));
  [...main.matchAll(/href="\/([^"\/#?]+)\/"/g)].forEach(m => {
    if (inbound[m[1]] && m[1] !== from) inbound[m[1]].add(from);
  });
}

const orphans = articles.filter(a => inbound[a].size === 0);

function card(slug) {
  return `            <a class="post-card" href="/${slug}/">\n` +
         `              <div class="card-text">\n` +
         `                <p class="post-meta"><span>${page[slug].date}</span></p>\n` +
         `                <h2>${encode(page[slug].title)}</h2>\n` +
         `                <span class="read-more">Read →</span>\n` +
         `              </div>\n` +
         `            </a>\n`;
}

const pending = {};   // host slug -> [orphan slugs to add]
let unplaced = [];

for (const orphan of orphans) {
  const scored = articles
    .filter(a => a !== orphan && !inbound[orphan].has(a))
    .map(a => {
      let overlap = 0;
      page[a].words.forEach(w => { if (page[orphan].words.has(w)) overlap++; });
      return { a, overlap };
    })
    .filter(x => x.overlap > 0)
    .sort((x, y) => y.overlap - x.overlap);

  const hosts = scored.slice(0, 2).map(x => x.a);
  if (!hosts.length) { unplaced.push(orphan); continue; }
  hosts.forEach(h => { (pending[h] = pending[h] || []).push(orphan); });
}

let added = 0, filesChanged = 0;
for (const [host, list] of Object.entries(pending)) {
  let html = page[host].html;
  // Append inside the existing related-reading card grid, just before it closes.
  // These files are CRLF, so the newline in the anchor has to be optional.
  const m = /[ \t]*<\/div>\r?\n[ \t]*<\/section>/g;
  let close = -1, hit;
  while ((hit = m.exec(html)) !== null) close = hit.index;
  if (close === -1) { unplaced.push(...list); continue; }
  const eol = html.includes('\r\n') ? '\r\n' : '\n';
  const insert = list.map(s => card(s).replace(/\n/g, eol)).join('');
  html = html.slice(0, close) + insert + html.slice(close);
  fs.writeFileSync(path.join(ROOT, host, 'index.html'), html);
  page[host].html = html;
  added += list.length;
  filesChanged++;
}

console.log('orphans found      :', orphans.length);
console.log('links added        :', added);
console.log('host files changed :', filesChanged);
if (unplaced.length) {
  console.log('could not place    :', unplaced.length);
  unplaced.forEach(u => console.log('  ' + u));
}
