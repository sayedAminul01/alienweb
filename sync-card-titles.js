/*
 * Brings every internal post-card heading back in line with the title of the
 * page it points at.
 *
 * The related-post cards and the blog index were generated before the titles
 * were rewritten in 88c5221, so 523 internal links still carry the old wording —
 * a median of 91 characters against destination titles now averaging 49. That
 * matters beyond tidiness: the card heading is the anchor text of an internal
 * link, so every one of them describes its destination using the phrasing the
 * rewrite deliberately moved away from.
 *
 * The destination page's own <title> is the source of truth; nothing here
 * invents text.
 */
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const SKIP = new Set(['.git', 'node_modules', 'assets', 'about-us', 'contact-us',
  'privacy-policy', 'terms', 'category', 'tools', 'blog']);

const decode = s => s
  .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
  .replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/&nbsp;/g, ' ');
const encode = s => s
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const articles = fs.readdirSync(ROOT, { withFileTypes: true })
  .filter(d => d.isDirectory() && !SKIP.has(d.name)
    && fs.existsSync(path.join(ROOT, d.name, 'index.html')))
  .map(d => d.name);

// slug -> the title the page actually carries now
const titleOf = {};
for (const slug of articles) {
  const html = fs.readFileSync(path.join(ROOT, slug, 'index.html'), 'utf8');
  titleOf[slug] = decode((html.match(/<title>([\s\S]*?)<\/title>/) || [])[1] || '').trim();
}

/*
 * Rewrites the <h2> inside every post-card that links to a known article.
 * The href is not always the attribute right after the class — blog.html
 * carries a data-search attribute in between — so allow anything before it.
 * The search attribute itself is left alone: it holds the old wording as well,
 * which only widens what the blog filter can match on.
 */
function syncCards(html) {
  let changed = 0;
  const out = html.replace(
    /(<a class="post-card"[^>]*?href="\/([^"\/]+)\/"[^>]*>[\s\S]*?<h2>)([\s\S]*?)(<\/h2>)/g,
    (whole, open, slug, heading, close) => {
      const want = titleOf[slug];
      if (!want) return whole;
      if (decode(heading).trim() === want) return whole;
      changed++;
      return open + encode(want) + close;
    }
  );
  return { out, changed };
}

let totalCards = 0, filesChanged = 0;

for (const slug of articles) {
  const file = path.join(ROOT, slug, 'index.html');
  const before = fs.readFileSync(file, 'utf8');
  const { out, changed } = syncCards(before);
  if (changed) { fs.writeFileSync(file, out); filesChanged++; totalCards += changed; }
}

// The blog index carries one card per article and drifted the same way.
let blogCards = 0;
const blogFile = path.join(ROOT, 'blog.html');
if (fs.existsSync(blogFile)) {
  const before = fs.readFileSync(blogFile, 'utf8');
  const { out, changed } = syncCards(before);
  if (changed) { fs.writeFileSync(blogFile, out); blogCards = changed; }
}

console.log('article files updated   :', filesChanged);
console.log('related-post cards synced:', totalCards);
console.log('blog.html cards synced   :', blogCards);
