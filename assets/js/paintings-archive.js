(function () {
  const mount = document.getElementById('paintings-archive-root');
  const data = window.PAINTINGS_ARCHIVE;
  if (!mount || !data) return;
  const progress = document.getElementById('paintings-archive-progress');

  const lang = (document.documentElement.lang || 'it').toLowerCase();
  const isItalian = lang.startsWith('it');
  const label = isItalian ? 'Apri fotografia opera' : 'Open artwork photograph';
  const safePath = (path) => encodeURI('../' + path.replace(/\\/g, '/'));

  const items = data.items || [];
  const batchSize = 48;
  let rendered = 0;

  function buildItem(item, index) {
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
    return figure;
  }

  function renderNextBatch() {
    const end = Math.min(rendered + batchSize, items.length);
    const fragment = document.createDocumentFragment();
    for (let index = rendered; index < end; index += 1) {
      fragment.appendChild(buildItem(items[index], index));
    }
    mount.appendChild(fragment);
    rendered = end;

    if (progress) {
      const text = isItalian
        ? `${rendered} di ${data.total} fotografie visualizzate`
        : `${rendered} of ${data.total} photographs displayed`;
      progress.querySelector('span').textContent = text;
      progress.hidden = rendered >= items.length;
    }
    window.dispatchEvent(new Event('catalog:rendered'));
  }

  if (progress) {
    const loadButton = progress.querySelector('button');
    loadButton.addEventListener('click', renderNextBatch);

    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver((entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        renderNextBatch();
        if (rendered >= items.length) observer.disconnect();
      }, { rootMargin: '700px 0px' });
      observer.observe(progress);
    }
  }

  renderNextBatch();
})();
