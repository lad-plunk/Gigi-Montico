(function () {
  const mount = document.getElementById('paintings-archive-root');
  const data = window.PAINTINGS_ARCHIVE;
  if (!mount || !data) return;

  const lang = (document.documentElement.lang || 'it').toLowerCase();
  const isItalian = lang.startsWith('it');
  const label = isItalian ? 'Apri fotografia opera' : 'Open artwork photograph';
  const safePath = (path) => encodeURI('../' + path.replace(/\\/g, '/'));

  const fragment = document.createDocumentFragment();
  (data.items || []).forEach((item, index) => {
    const figure = document.createElement('figure');
    figure.className = 'paintings-archive-item';

    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'paintings-archive-button';
    button.setAttribute('aria-label', `${label} ${index + 1} ${isItalian ? 'di' : 'of'} ${data.total}`);

    const image = document.createElement('img');
    image.src = safePath(item.previewPath);
    image.dataset.full = safePath(item.fullPath);
    image.alt = `${isItalian ? 'Opera di Gigi Montico, fotografia d’archivio' : 'Artwork by Gigi Montico, archive photograph'} ${index + 1}`;
    image.width = item.previewWidth;
    image.height = item.previewHeight;
    image.loading = index < 8 ? 'eager' : 'lazy';
    if (index < 2) image.fetchPriority = 'high';
    image.decoding = 'async';

    button.appendChild(image);
    figure.appendChild(button);
    fragment.appendChild(figure);
  });

  mount.replaceChildren(fragment);
  window.dispatchEvent(new Event('catalog:rendered'));
})();
