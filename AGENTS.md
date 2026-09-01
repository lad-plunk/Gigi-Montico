# Project guidance for coding agents

## Mission and scope

Maintain a polished bilingual static portfolio and archive for Gigi Montico. The repository root is the complete deployment unit. Do not reorganize existing files or rename media unless the task explicitly requires it and every reference is updated.

## Architecture

- Pure HTML/CSS/JavaScript; there is no compilation or dependency-install step.
- `it/` and `en/` are parallel language trees sharing all files under `assets/`.
- `assets/js/site.js` owns global interaction behavior.
- `assets/js/catalog.js` owns data-driven archive and exhibition rendering.
- Pages load `assets/data/archive.js`, which assigns `window.ARCHIVE_CATALOG`.
- `assets/data/archive.json` is the machine-readable catalog mirror.
- GitHub Pages publishes from the repository root at `https://artemontico.it/`; preserve relative links inside HTML and keep `CNAME`, canonical URLs, social metadata, `robots.txt`, and `sitemap.xml` aligned with the custom domain.

## Change rules

1. Read the nearest folder README before editing.
2. Treat Italian and English user-facing pages as a pair. Preserve meaning rather than literal word-for-word translation.
3. Keep page metadata, navigation, language links, footer, and shared asset references consistent across the pair.
4. Do not guess artwork metadata. Use the catalog or explicit user-provided evidence and state uncertainty when data is absent.
5. Do not modify generated catalog timestamps, totals, paths, or IDs without reconciling both catalog formats and the media files.
6. Preserve accessibility: meaningful image `alt` text, keyboard behavior, semantic headings, and visible focus/navigation states.
7. Keep binary assets unchanged unless the task specifically authorizes image or PDF work.
8. Never edit `.git/` internals.

## High-risk relationships

- Renaming an archive image breaks catalog cards and lightbox links.
- Changing a public page path requires updates to navigation, language alternates, canonical URLs, Open Graph URLs, `sitemap.xml`, and inbound internal links.
- Changing a shared selector can affect all 25 localized HTML pages.
- Catalog/exhibition pages require script order: `site.js`, then `archive.js`, then `catalog.js`.

## Minimum validation

- Parse `assets/data/archive.json`.
- Confirm catalog totals, unique IDs, and media-path existence.
- Scan local HTML `href` and `src` attributes for missing files.
- Confirm bilingual page-pair coverage.
- Preserve the approved Italian-only staging exception for `it/11-1000.html` until the owner authorizes its English equivalent.
- If presentation changed, preview at mobile and desktop widths.
- Review `git diff` and avoid unrelated changes.

Report changed files and any validation that could not be completed.
