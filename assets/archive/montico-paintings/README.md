# Optimized paintings-photo archive

This folder contains web derivatives of the owner's external, read-only reference-artworks folder. It deliberately does not contain the original photographs.

- `previews/`: lightweight WebP files used in the archive grid.
- `full/`: higher-resolution WebP files loaded only when a visitor opens an image.

Both resolutions preserve the complete frame without cropping. Stable technical IDs (`GM-0001` onward), dimensions, source filenames, checksums, paths, and byte sizes are recorded in `assets/data/paintings-archive.json`; the synchronized browser representation is `assets/data/paintings-archive.js`.

Regenerate with `10_Working/build_paintings_archive.py`, passing the external source folder explicitly. Never edit, rename, compress, or copy the source photographs into this repository.
