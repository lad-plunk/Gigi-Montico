# Shared browser scripts

- `site.js` removes known tracking parameters, creates the responsive navigation toggle, reveals sections, and provides an accessible image lightbox. It also binds images added after catalog rendering.
- The same file owns the bilingual Google Analytics consent controls. It does not request the Google tag until the visitor accepts, keeps all advertising consent states denied, stores only the local consent choice before acceptance, and adds privacy/preference controls to every standard footer.
- `catalog.js` reads `window.ARCHIVE_CATALOG`, filters and groups works, renders localized archive or exhibition cards, and emits `catalog:rendered`.
- `paintings-archive.js` progressively renders the dedicated 326-photo archive from `window.PAINTINGS_ARCHIVE` in 48-image batches, using lightweight previews and higher-resolution lightbox sources.
- `11-1000.js` provides the dedicated project gallery lightbox, including focus return, focus containment, Escape close, and previous/next keyboard navigation.

Exhibition catalog pages must load scripts in this order: `site.js`, `../data/archive.js`, `catalog.js`. The paired archive pages instead load `site.js`, `../data/paintings-archive.js`, and `paintings-archive.js`. Keep localized labels semantically paired and encode generated media paths.
