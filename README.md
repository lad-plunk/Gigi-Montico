# Gigi Montico website

This repository contains the bilingual Italian/English static website for artist Pierluigi Monticone (Gigi Montico). It is designed for direct hosting on GitHub Pages and has no build step, package manager, or server-side component.

## Start here

- `index.html` is the root language entry point.
- `it/` and `en/` contain the Italian and English pages.
- `assets/css/site.css` contains the shared visual system and responsive layout.
- `assets/js/site.js` contains shared navigation, reveal, tracking-parameter cleanup, and lightbox behavior.
- `assets/data/archive.js` is the browser-loaded artwork catalog; `assets/data/archive.json` is its machine-readable equivalent.
- `assets/js/catalog.js` renders archive and exhibition cards from the catalog.
- `sitemap.xml`, `robots.txt`, `404.html`, and the Google verification file support deployment and search indexing.
- `mobile-audit-report.json` is retained QA evidence, not runtime site data.

## Repository map

- `en/`: English HTML pages.
- `it/`: Italian HTML pages.
- `assets/archive/`: full artwork images grouped by collection.
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

When changing content or navigation, update both language counterparts and their metadata: title, description, canonical URL, `hreflang`, Open Graph, Twitter card, structured data, navigation state, and language switch.

Approved staged-release exception: `it/11-1000.html` is currently Italian-only pending owner validation. Its EN language control intentionally routes to `en/index.html`; it does not declare a false English `hreflang` equivalent.

## Catalog data flow

`assets/data/archive.js` → `assets/js/catalog.js` → archive/exhibition HTML mount points → `assets/archive/<collection>/<work image>`

The runtime catalog currently identifies 226 works in four collections: `AS`, `CP`, `LS`, and `DA`. Keep `archive.js` and `archive.json` semantically synchronized. An item path must resolve to a real media file, and `total` must equal the number of items.

## Safe change workflow

1. Read this file, `AGENTS.md`, and the README in every folder you will touch.
2. Make the smallest change possible; do not rename media because HTML and catalog paths reference exact filenames.
3. Preserve Italian/English parity where the change is user-facing.
4. For catalog changes, update both data formats and the corresponding media collection.
5. Check local relative links and media references, JSON validity, catalog totals, language alternates, and sitemap coverage.
6. Preview both a narrow mobile viewport and a desktop viewport before publishing visual changes.

## LLM context boundaries

- Facts visible on the website live in the HTML pages and catalog data; do not invent missing biography, title, date, dimension, provenance, or critical claims.
- `assets/data/archive.js` is the runtime source for rendered archive/exhibition cards. The JSON file is easier for analysis but is not loaded by current pages.
- Large image and PDF folders are content stores. Inspect filenames and catalog metadata first; open binary files only when visual or textual verification is needed.
- Do not edit `.git/` or treat its internal backup directories as project content.

## Validation checklist

- All project subfolders contain `README.md`.
- All local `href` and `src` targets exist (ignore URL fragments when checking paths).
- `archive.json` parses and agrees with `archive.js` on catalog content.
- Catalog item count equals `total`, IDs are unique, and every item media path exists.
- Each established bilingual page has its intended counterpart; approved staged-release exceptions are documented above.
- `sitemap.xml` contains all public HTML pages and no removed pages.
