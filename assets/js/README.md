# Shared browser scripts

- `site.js` removes known tracking parameters, creates the responsive navigation toggle, reveals sections, and provides an accessible image lightbox. It also binds images added after catalog rendering.
- `catalog.js` reads `window.ARCHIVE_CATALOG`, filters and groups works, renders localized archive or exhibition cards, and emits `catalog:rendered`.
- `paintings-archive.js` renders the dedicated 326-photo archive from `window.PAINTINGS_ARCHIVE`, using lightweight previews and higher-resolution lightbox sources.
- `11-1000.js` provides the dedicated project gallery lightbox, including focus return, focus containment, Escape close, and previous/next keyboard navigation.

Exhibition catalog pages must load scripts in this order: `site.js`, `../data/archive.js`, `catalog.js`. The paired archive pages instead load `site.js`, `../data/paintings-archive.js`, and `paintings-archive.js`. Keep localized labels semantically paired and encode generated media paths.
