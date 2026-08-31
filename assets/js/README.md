# Shared browser scripts

- `site.js` removes known tracking parameters, creates the responsive navigation toggle, reveals sections, and provides an accessible image lightbox. It also binds images added after catalog rendering.
- `catalog.js` reads `window.ARCHIVE_CATALOG`, filters and groups works, renders localized archive or exhibition cards, and emits `catalog:rendered`.
- `11-1000.js` provides the dedicated project gallery lightbox, including focus return, focus containment, Escape close, and previous/next keyboard navigation.

Catalog pages must load scripts in this order: `site.js`, `../data/archive.js`, `catalog.js`. Keep localized labels in `catalog.js` semantically paired, encode generated media paths, and preserve the `data-catalog-mode`, `data-lang`, and `catalog-root` contracts used by HTML pages.
