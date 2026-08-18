# AlienWeb.in

A free, fast, privacy-friendly toolbox of 20+ browser-based tools — word counters,
text/dev utilities, and everyday calculators — with a live search, dark mode, and
a Perplexity-inspired design. Pure static HTML/CSS/JS, no build step, no backend.
Every tool runs client-side; nothing you type is ever sent to a server.

## Project structure

```
/
├── index.html                 Homepage: hero search, tool grid, features
├── about.html / contact.html / privacy-policy.html / terms.html / 404.html
├── robots.txt / sitemap.xml / ads.txt / CNAME / manifest.json / .nojekyll
├── assets/
│   ├── css/style.css          Design system (light + dark theme via CSS vars)
│   ├── js/main.js             Theme toggle, mobile nav, search filter, copy-to-clipboard
│   └── img/favicon.svg
└── tools/
    ├── word-counter.html, case-converter.html, lorem-ipsum-generator.html,
    │   text-to-slug.html, text-diff-checker.html, markdown-previewer.html
    ├── json-formatter.html, base64-converter.html, url-encoder.html,
    │   timestamp-converter.html, password-generator.html, qr-code-generator.html,
    │   color-converter.html, random-number-generator.html
    └── bmi-calculator.html, age-calculator.html, percentage-calculator.html,
        unit-converter.html, loan-emi-calculator.html, discount-calculator.html
```

## Local preview

No build tools needed. Either open `index.html` directly in a browser, or run a
tiny local server (recommended, so absolute `/` paths resolve correctly):

```bash
npx serve .
# or
python -m http.server 8000
```

Then visit `http://localhost:8000`.

## Deploying to GitHub Pages (custom domain: alienweb.in)

1. **Create the GitHub repo** (under your account `sayedaminul`):
   ```bash
   git init
   git add .
   git commit -m "Initial site"
   git branch -M main
   git remote add origin https://github.com/sayedaminul/alienweb.git
   git push -u origin main
   ```

2. **Enable GitHub Pages**: repo → Settings → Pages → Source: "Deploy from a branch"
   → Branch: `main`, folder `/ (root)` → Save.

3. **Custom domain**: still on the Pages settings page, under "Custom domain" enter
   `alienweb.in` and save (this repo already ships a `CNAME` file with that value,
   so GitHub should pick it up automatically — the settings field just needs to match).

4. **Point your domain's DNS at GitHub Pages.** In your domain registrar's DNS panel,
   set these records for the apex domain (`alienweb.in`):

   | Type | Host | Value |
   |------|------|-------|
   | A | @ | 185.199.108.153 |
   | A | @ | 185.199.109.153 |
   | A | @ | 185.199.110.153 |
   | A | @ | 185.199.111.153 |
   | AAAA | @ | 2606:50c0:8000::153 |
   | AAAA | @ | 2606:50c0:8001::153 |
   | AAAA | @ | 2606:50c0:8002::153 |
   | AAAA | @ | 2606:50c0:8003::153 |

   Optional, if you also want `www.alienweb.in` to work:

   | Type | Host | Value |
   |------|------|-------|
   | CNAME | www | sayedaminul.github.io |

   DNS propagation can take anywhere from a few minutes to ~24 hours.

5. Back in the Pages settings, once DNS resolves, check **"Enforce HTTPS"**.
   GitHub issues a free TLS certificate for the custom domain automatically.

## Re-applying for Google AdSense

Because the site was previously removed from your VPS, AdSense will treat this as
a fresh review. Once the domain is live on GitHub Pages with valid HTTPS:

1. Sign in to [AdSense](https://www.google.com/adsense/) with the account tied to
   publisher ID `pub-3056427584192481` (already wired into every page's `<head>`
   and into `ads.txt` at the site root).
2. Add `alienweb.in` as a site and submit it for review.
3. AdSense typically wants **real, substantial content and working navigation**
   before approval — this site already has 20 functional tools, About, Contact,
   Privacy Policy, and Terms pages, which covers their usual checklist.
4. Real ad units are already wired in: 3 slots per page (a display ad, an
   in-article native ad, and a matched-content/related ad at the bottom). If
   you create additional or replacement units in the AdSense dashboard, update
   the `data-ad-slot` values across `index.html` and the files in `tools/`.
5. Review is often slower for finance-adjacent calculators (loan EMI, discount) —
   don't be surprised if it takes longer than a typical content site.

## Adding a new tool

Copy `tools/word-counter.html` as a starting point — it has the full header/footer/
meta boilerplate other tool pages follow. Then:

1. Update `<title>`, meta description, canonical URL, and JSON-LD blocks.
2. Replace the `.tool-panel` contents and inline `<script>` with your tool's logic.
3. Add a card for it to the matching category grid in `index.html`.
4. Add its URL to `sitemap.xml`.
5. Link it from 2–3 related tools' "Related tools" sections.

## Notes on the AdSense/ads.txt IDs

- `ads.txt` uses Google's standard certification authority ID
  `f08c47fec0942fa0` alongside your publisher ID — this is the same for every
  AdSense publisher and does not need to change.
- The contact email on `contact.html` is a placeholder
  (`contact@alienweb.in`) forwarding-note to `sayedaminul0@gmail.com`. Update it
  once you have a real mailbox on the domain, or just point the `mailto:` link
  straight at whatever inbox you want to use.
