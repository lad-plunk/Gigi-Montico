# Il pianeta metafisico: source and design notes

This experiment is separate from Il pianeta vivo and the earlier planet laboratory. It reuses their six source paintings, the imagined wood interior, music, lunar relief, navigation and sound controls. The ground uses reflected image repeats with softened folds and small continuous warps. The artwork remains visible at approximately the same scale as in Il pianeta vivo.

## Grand Canyon terrain

`assets/images/grand-canyon-terrain.png` is a lossless 256 by 256 crop assembled from the following Mapzen Terrain Tiles in Terrarium encoding, accessed 1 November 2026. The crop is centred near 36.105 N, 112.105 W in the Grand Canyon and covers roughly 8 km at source scale. The terrain in the experiment is spatially compressed and blended into an invented, deeper walkable valley. Its elevations are adapted, so the result is not a geographic reconstruction or a scale-accurate model.

- https://s3.amazonaws.com/elevation-tiles-prod/terrarium/12/771/1606.png
- https://s3.amazonaws.com/elevation-tiles-prod/terrarium/12/771/1607.png
- https://s3.amazonaws.com/elevation-tiles-prod/terrarium/12/772/1606.png
- https://s3.amazonaws.com/elevation-tiles-prod/terrarium/12/772/1607.png

Each pixel retains the Terrarium encoding: elevation in metres is `red * 256 + green + blue / 256 - 32768`. United States 3DEP and global GMTED2010 and SRTM terrain data courtesy of the U.S. Geological Survey. Terrain Tiles was accessed from the [Registry of Open Data on AWS](https://registry.opendata.aws/terrain-tiles/); see the [provider's attribution terms](https://github.com/tilezen/joerd/blob/master/docs/attribution.md).

## Materials and motion

The wooden forms use a small crop from `assets/images/casa-montico/casa-montico-001.jpg`, a photograph already used by the wood interior. The spheres, assemblages and rotating supported rings are imagined geometry, not scans or reconstructions of specific works. Sculpture geometry and the ground are aligned to the rendered terrain; the lake water extends under the bank so depth testing determines the visible edge. The terrain does not provide a physics simulation or collision model.

Supported rings rotate, small particles drift along helical paths, water moves gently and the fragments can be separated or recomposed. Motion honours the operating system's reduced-motion preference. The existing ambient recordings and their credits remain available from the viewer help panel.
