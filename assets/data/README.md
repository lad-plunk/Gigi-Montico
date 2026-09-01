# Artwork catalog data

This folder contains two synchronized representations of the same artwork catalog:

- `archive.js`: runtime data loaded by browser pages; assigns `window.ARCHIVE_CATALOG`.
- `archive.json`: machine-readable mirror for validation, analysis, and external tooling.

The catalog currently declares 226 previewable works across `AS`, `CP`, `LS`, and `DA`, with HEIC files excluded. Each item records a stable ID, collection, titles, optional dimensions, filename, relative media path, extension, pixel dimensions, preview flag, and retained source-relative provenance.

Keep both files semantically identical. After a change, validate JSON parsing, `total === items.length`, unique IDs, known collection codes, and existence of every `path` under the repository root. Update `generatedAt` only when the catalog is genuinely regenerated.

The photo-only archive uses a separate synchronized pair so exhibition groupings remain unchanged:

- `paintings-archive.js`: browser runtime data; assigns `window.PAINTINGS_ARCHIVE`.
- `paintings-archive.json`: machine-readable provenance and derivative manifest for 326 source photographs.

Validate its declared total, unique IDs and source checksums, paired preview/full paths, dimensions, and byte sizes after regeneration.
