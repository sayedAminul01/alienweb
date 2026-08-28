/*
 * Applies the rewritten <title> tags in seo-titles.json to the restored articles.
 *
 * Only the <title> element is touched. og:title and twitter:title keep the
 * longer originals on purpose — the ~60 character limit is a search-results
 * constraint, while social cards show roughly 88 and read better with the fuller
 * wording. Schema headline is left alone for the same reason, except where it
 * breaks Google's 110 character limit for Article, which is reported at the end.
 *
 * Line endings are preserved: the replacement never spans a newline, so a plain
 * string swap leaves CRLF files CRLF.
 */
const fs = require('fs');
const path = require('path');

const MAP = JSON.parse(fs.readFileSync(path.join(__dirname, 'seo-titles.json'), 'utf8')).titles;
const LIMIT = 60;
const HEADLINE_LIMIT = 110;

// Titles are written as plain text; the file needs them entity-escaped.
function escapeForHtml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
// ...and compared against the file's existing, already-escaped title.
function decodeEntities(s) {
  return s.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, ' ');
}

const problems = [];
const tooLong = [];
const headlineOver = [];
let changed = 0, missing = 0, alreadyOk = 0;

for (const [slug, next] of Object.entries(MAP)) {
  const file = path.join(__dirname, slug, 'index.html');
  if (!fs.existsSync(file)) { problems.push(`missing article: ${slug}`); missing++; continue; }

  if (next.length > LIMIT) tooLong.push(`${next.length}  ${slug}  ${next}`);

  const html = fs.readFileSync(file, 'utf8');
  const m = html.match(/<title>([\s\S]*?)<\/title>/i);
  if (!m) { problems.push(`no <title>: ${slug}`); continue; }

  if (decodeEntities(m[1]).trim() === next) { alreadyOk++; continue; }

  const replaced = html.replace(m[0], `<title>${escapeForHtml(next)}</title>`);
  if (replaced === html) { problems.push(`replace failed: ${slug}`); continue; }

  // Google drops Article markup whose headline exceeds 110 characters, so any
  // headline over the limit is replaced with the new short title. Headlines
  // already within the limit keep their original wording.
  let out = replaced;
  const h = out.match(/"headline"\s*:\s*"((?:[^"\\]|\\.)*)"/);
  if (h && h[1].length > HEADLINE_LIMIT) {
    headlineOver.push(`${h[1].length} -> ${next.length}  ${slug}`);
    out = out.replace(h[0], `"headline": ${JSON.stringify(next)}`);
  }

  fs.writeFileSync(file, out);
  changed++;
}

console.log('titles rewritten     :', changed);
console.log('already correct      :', alreadyOk);
console.log('articles not found   :', missing);
console.log('still over ' + LIMIT + ' chars :', tooLong.length);
tooLong.forEach(t => console.log('   ' + t));
if (headlineOver.length) {
  console.log('');
  console.log(`schema headlines shortened to fit the ${HEADLINE_LIMIT} char Article limit: ${headlineOver.length}`);
  headlineOver.slice(0, 8).forEach(t => console.log('   ' + t));
}
if (problems.length) {
  console.log('');
  console.log('PROBLEMS:');
  problems.forEach(p => console.log('   ' + p));
  process.exitCode = 1;
}
