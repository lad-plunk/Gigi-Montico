# Il pianeta vivo: sources and design

This separate experiment leaves the earlier planet and nine-idea laboratory unchanged. It uses the lunar elevation derivative described in [pianeta-fonti.md](pianeta-fonti.md), with invented terrain, a shallow animated lake and a canyon. The approximately 900 m great-circle circuit takes roughly two minutes at the default 7.5 m/s speed.

Six source images are used in full: `front-page-image.jpg`, `hi-paure-inventate.jpg`, photographic-archive image `GM-0203`, `hi-fabbriche.jpg`, `hi-deserto-rosso.jpg` and `hi-viaggio-diametro.jpg`. The browser creates a compact texture atlas in memory, retaining each entire image and restoring its aspect ratio in the ground mapping. No source images are modified. The artwork button shows the source for the current area and the next one.

The forest, flowers, buildings, vehicles, rocks, boat and water are new procedural interpretations, not scans or faithful reconstructions. A lightweight wind effect, birds, moving vehicles, water ripples and drifting particles add movement. Daylight contact shadows are approximations. The interior of the wood reuses the laboratory's imagined tunnel and its existing sculpture-photograph texture; it is loaded only when requested.

Six existing Kevin MacLeod recordings from `assets/audio/` crossfade as the visitor changes landscapes, with credits shown inside the viewer. If a mobile browser blocks a new audio element, the previous track continues and a later visitor gesture can retry the transition. No new music or third-party dependencies are required.
