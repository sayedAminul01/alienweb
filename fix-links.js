/*
 * Unwraps shortened outbound links and replaces generic anchor text.
 *
 * Two problems in the restored articles:
 *
 *  - 34 outbound links went through rb.gy / shorturl.at. They still resolve,
 *    but they hide the destination from readers and from Google, and they put
 *    a third party in the path of a link that does not need one. 32 resolved
 *    to a real URL and are swapped in place; 2 are dead and are unwrapped to
 *    plain text rather than left pointing at a 404.
 *
 *  - 54 links use "Click here" as their anchor text, which tells Google nothing
 *    about the destination and gives screen reader users a list of identical
 *    link labels. Where the destination is known, the anchor becomes the name
 *    of the thing being linked to.
 *
 * Anchor names are derived from the destination URL, never invented: a Chrome
 * Web Store path carries the extension's slug, which is the extension's own
 * name. Anything that cannot be named confidently keeps its existing text.
 */
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const SKIP = new Set(['.git', 'node_modules', 'assets', 'about-us', 'contact-us',
  'privacy-policy', 'terms', 'category', 'tools', 'blog']);

// url -> resolved destination, from /tmp/resolved.tsv
const RESOLVED = new Map(
  fs.readFileSync(process.argv[2], 'utf8').trim().split('\n')
    .map(l => l.split('\t')).filter(p => p.length === 2)
);

// Shorteners that no longer resolve — unwrap rather than relink.
const DEAD = new Set(['https://rb.gy/o2fknq', 'https://shorturl.at/szAYZ']);

const SMALL = new Set(['a', 'an', 'and', 'the', 'for', 'of', 'to', 'in', 'on', 'with', 'your']);

/* Turn a destination URL into a human name, or null if it cannot be named. */
function nameFor(url) {
  let u;
  try { u = new URL(url); } catch { return null; }

  // chromewebstore.google.com/detail/<slug>/<id>
  const cws = u.pathname.match(/^\/detail\/([^/]+)\//);
  if (/chromewebstore\.google\.com|chrome\.google\.com/.test(u.hostname) && cws) {
    return titleCase(cws[1].replace(/-/g, ' '));
  }
  // linkedin.com/learning/<slug>/...
  const li = u.pathname.match(/^\/learning\/([^/]+)/);
  if (/linkedin\.com/.test(u.hostname) && li) {
    return titleCase(li[1].replace(/-/g, ' '));
  }
  return null;
}

function titleCase(s) {
  const words = s.trim().split(/\s+/);
  return words.map((w, i) => {
    if (i > 0 && SMALL.has(w.toLowerCase())) return w.toLowerCase();
    if (/^(ai|api|pdf|url|hd|id|ui|ux|seo)$/i.test(w)) return w.toUpperCase();
    return w.charAt(0).toUpperCase() + w.slice(1);
  }).join(' ');
}

const articles = fs.readdirSync(ROOT, { withFileTypes: true })
  .filter(d => d.isDirectory() && !SKIP.has(d.name)
    && fs.existsSync(path.join(ROOT, d.name, 'index.html')))
  .map(d => d.name);

let swapped = 0, renamed = 0, unwrapped = 0, filesChanged = 0;
const stillGeneric = [];

for (const slug of articles) {
  const file = path.join(ROOT, slug, 'index.html');
  const before = fs.readFileSync(file, 'utf8');
  let html = before;

  html = html.replace(/<a\s([^>]*?)href="([^"]+)"([^>]*)>([\s\S]*?)<\/a>/g,
    (tag, pre, href, post, inner) => {
      const plain = inner.replace(/<[^>]+>/g, '').trim();
      const generic = /^(click here|link)$/i.test(plain);

      if (DEAD.has(href)) { unwrapped++; return inner; }

      const dest = RESOLVED.get(href);
      if (!dest) {
        if (generic) stillGeneric.push(`${slug}: ${href}`);
        return tag;
      }
      swapped++;

      let newInner = inner;
      const name = generic ? nameFor(dest) : null;
      if (name) {
        // Keep any wrapper markup (e.g. <strong>) around the replaced text.
        newInner = inner.includes('<')
          ? inner.replace(/>([^<>]+)</, `>${name}<`)
          : name;
        renamed++;
      } else if (generic) {
        stillGeneric.push(`${slug}: ${dest}`);
      }
      return `<a ${pre}href="${dest}"${post}>${newInner}</a>`;
    });

  if (html !== before) { fs.writeFileSync(file, html); filesChanged++; }
}

console.log('files changed          :', filesChanged);
console.log('shortened links swapped:', swapped);
console.log('anchors renamed        :', renamed);
console.log('dead links unwrapped   :', unwrapped);
if (stillGeneric.length) {
  console.log('');
  console.log('still generic (destination could not be named):', stillGeneric.length);
  stillGeneric.slice(0, 12).forEach(s => console.log('  ' + s));
}
