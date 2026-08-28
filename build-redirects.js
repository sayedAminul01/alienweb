/*
 * Generates redirect stubs for URLs that existed on the old WordPress site and
 * now 404. Those paths still carry inbound links and Search Console history, so
 * the equity currently lands on an error page.
 *
 * GitHub Pages cannot issue a server-side 301, so each stub uses the pattern
 * Google documents as equivalent to a permanent redirect: an instant meta
 * refresh plus a canonical pointing at the destination. (This is the same
 * markup jekyll-redirect-from emits.) Deliberately NOT noindex — the canonical
 * is what consolidates the signal, and a noindex here would work against the
 * destination instead of for it.
 *
 * Only paths with an unambiguous modern equivalent belong here. A legacy URL
 * with nowhere sensible to land should keep returning 404 — that is a correct
 * answer, and /tag/ and /feed/ archives fall in that group.
 */
const fs = require('fs');
const path = require('path');

const SITE = 'https://alienweb.in';

const REDIRECTS = {
  // Confirmed present in Search Console's "Not found (404)" report.
  'about-us':             '/about.html',
  'contact-us':           '/contact.html',
  'category/tech-updates': '/blog.html',

  // Standard WordPress slugs whose modern counterpart is unambiguous.
  'privacy-policy':       '/privacy-policy.html',
  'terms':                '/terms.html',
  'blog':                 '/blog.html',
};

function stub(from, to) {
  const target = SITE + to;
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta http-equiv="refresh" content="0; url=${target}">
<link rel="canonical" href="${target}">
<title>Redirecting to ${to}</title>
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>
  body{font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;
       max-width:34rem;margin:16vh auto;padding:0 1.5rem;line-height:1.6;color:#1F1E1C;background:#FBFAF7}
  @media (prefers-color-scheme:dark){body{color:#EDEBE4;background:#17181A}}
  a{color:#1F8181}
  @media (prefers-color-scheme:dark){a{color:#3FC1C0}}
</style>
</head>
<body>
  <p>This page has moved. Redirecting to <a href="${target}">${to}</a>&hellip;</p>
  <script>location.replace(${JSON.stringify(target)});</script>
</body>
</html>
`;
}

let n = 0;
for (const [from, to] of Object.entries(REDIRECTS)) {
  const dir = path.join(__dirname, from);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'index.html'), stub(from, to), 'utf8');
  console.log(`  /${from}/`.padEnd(26), '->', to);
  n++;
}
console.log(`\n${n} redirect stubs written`);
