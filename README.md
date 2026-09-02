# Gigi Montico website

This repository contains the bilingual Italian/English static website for artist Pierluigi Monticone (Gigi Montico). It is published by GitHub Pages at `https://artemontico.it/` and has no build step, package manager, or server-side component.

## Start here

- `index.html` redirects the apex domain to the Italian homepage, which is the default language; the English homepage remains directly available under `en/`.
- `CNAME` binds the GitHub Pages deployment to `artemontico.it`.
- `it/` and `en/` contain the Italian and English pages.
- `assets/css/site.css` contains the shared visual system and responsive layout.
- `assets/js/site.js` contains shared navigation, reveal, tracking-parameter cleanup, consent-gated Google Analytics, privacy controls, and lightbox behavior.
- `assets/data/archive.js` is the browser-loaded artwork catalog; `assets/data/archive.json` is its machine-readable equivalent.
- `assets/js/catalog.js` renders archive and exhibition cards from the catalog.
- `assets/data/paintings-archive.js` and `.json` describe the separate 326-photo archive; `assets/js/paintings-archive.js` renders its optimized preview/detail pairs.
- `10_Working/build_paintings_archive.py` reproducibly rebuilds those web derivatives from an explicitly supplied external, read-only source folder.
- `sitemap.xml`, `robots.txt`, `404.html`, and the Google verification file support custom-domain deployment and search indexing. The sitemap lists indexable content pages only, not the root or legacy HTML redirect helpers.
- `favicon.svg`, `favicon.ico`, `favicon-32x32.png`, and `apple-touch-icon.png` provide the shared burgundy-and-cream GM browser and mobile identity used by every public page.
- `mobile-audit-report.json` is retained QA evidence, not runtime site data.

## Repository map

- `en/`: English HTML pages.
- `it/`: Italian HTML pages.
- `assets/archive/`: exhibition media grouped by collection plus optimized preview/detail pairs for the paintings-photo archive.
- `assets/books/`: downloadable PDF publications.
- `assets/css/`: shared stylesheet.
- `assets/data/`: artwork catalog in JS and JSON forms.
- `assets/images/`: curated page, gallery, and house-tour images.
- `assets/js/`: shared browser behavior and catalog renderer.
- `assets/reviews/`: review and press images.

Every project folder has its own `README.md` with local ownership and maintenance notes. Git internals under `.git/` are intentionally excluded.

## Bilingual page pairs

- `en/index.html` ↔ `it/index.html`
- `en/biography.html` ↔ `it/biografia.html`
- `en/books.html` ↔ `it/libri.html`
- `en/gallery.html` ↔ `it/galleria.html`
- `en/exhibitions.html` ↔ `it/esposizioni.html`
- `en/exhibition-terminal-realism.html` ↔ `it/esposizione-realismo.html`
- `en/exhibition-sustainable-art.html` ↔ `it/esposizione-sostenibile.html`
- `en/exhibition-ai-digital.html` ↔ `it/esposizione-ai.html`
- `en/archive.html` ↔ `it/archivio.html`
- `en/reviews.html` ↔ `it/recensioni.html`
- `en/sustainability.html` ↔ `it/sostenibilita.html`
- `en/montico-house.html` ↔ `it/casa-montico.html`
- `en/11-1000.html` ↔ `it/11-1000.html`
- `en/privacy.html` ↔ `it/privacy.html`

When changing content or navigation, update both language counterparts and their metadata: title, description, canonical URL, `hreflang`, Open Graph, Twitter card, structured data, navigation state, and language switch.

The `11 / 1000` project is published in both languages. Both localized project pages link to the same authoritative completed Italian RC10 PDF until a finalized English book edition is explicitly approved.

## Privacy-conscious analytics

Google Analytics 4 uses measurement ID `G-R345WTHYJX` through the shared `site.js`. The implementation uses basic consent mode: the Google tag is not requested before an explicit acceptance. Rejecting analytics leaves the tag unloaded; visitors can reopen the equal-choice controls from every page footer. Advertising storage, Google Signals, and advertising personalization remain disabled. The localized privacy pages document the controller, purposes, cookies, retention target, and withdrawal route.

## Catalog data flows

Exhibitions: `assets/data/archive.js` → `assets/js/catalog.js` → exhibition HTML mount points → `assets/archive/<collection>/<work image>`

The runtime catalog currently identifies 226 works in four collections: `AS`, `CP`, `LS`, and `DA`. Keep `archive.js` and `archive.json` semantically synchronized. An item path must resolve to a real media file, and `total` must equal the number of items.

Photo archive: `assets/data/paintings-archive.js` → `assets/js/paintings-archive.js` → paired archive pages → `assets/archive/montico-paintings/{previews,full}/<image>`

The photo archive declares 326 source photographs. Grid previews are lightweight WebP files; 1800-pixel detail derivatives load only when opened. The originals remain outside the repository and must be treated as read-only. Keep the JS/JSON manifests synchronized and regenerate both resolutions together.

## Safe change workflow

1. Read this file, `AGENTS.md`, and the README in every folder you will touch.
2. Make the smallest change possible; do not rename media because HTML and catalog paths reference exact filenames.
3. Preserve Italian/English parity where the change is user-facing.
4. For catalog changes, update both data formats and the corresponding media collection.
5. Check local relative links and media references, JSON validity, catalog totals, language alternates, and sitemap coverage.
6. Preview both a narrow mobile viewport and a desktop viewport before publishing visual changes.

## LLM context boundaries

- Facts visible on the website live in the HTML pages and catalog data; do not invent missing biography, title, date, dimension, provenance, or critical claims.
- `assets/data/archive.js` remains the runtime source for exhibition cards. The archive pages use the separate `paintings-archive.js` manifest so exhibition grouping and metadata are not altered.
- Large image and PDF folders are content stores. Inspect filenames and catalog metadata first; open binary files only when visual or textual verification is needed.
- Do not edit `.git/` or treat its internal backup directories as project content.

## Validation checklist

- All project subfolders contain `README.md`.
- All local `href` and `src` targets exist (ignore URL fragments when checking paths).
- `archive.json` parses and agrees with `archive.js` on catalog content.
- Catalog item count equals `total`, IDs are unique, and every item media path exists.
- `paintings-archive.json` agrees with its JS mirror, declares 326 unique IDs and source hashes, and every preview/full path and byte size matches the generated file.
- Each established bilingual page has its intended counterpart.
- `sitemap.xml` contains all public HTML pages and no removed pages.
