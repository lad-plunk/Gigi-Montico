(function () {
  const root = document.querySelector('[data-catalog-mode]');
  if (!root) return;

  const mode = root.dataset.catalogMode;
  const lang = root.dataset.lang || 'it';
  const mount = document.getElementById('catalog-root');
  if (!mount) return;

  const labels = {
    it: {
      id: 'Codice opera',
      title: 'Titolo',
      dimensions: 'Dimensioni',
      source: 'Fonte',
      noTitle: 'Titolo non disponibile',
      noPreview: 'Anteprima non disponibile',
      open: 'Apri immagine',
      count: 'opere',
      ex1: 'Mostra virtuale: Realismo Terminale e paesaggio critico',
      ex2: 'Mostra virtuale: Arte sostenibile e materia di recupero',
      ex3: 'Mostra virtuale: Arte digitale con supporto IA',
      ex3Sub: 'Una selezione di opere digitali nate dal dialogo tra pittura e strumenti di IA.'
    },
    en: {
      id: 'Work code',
      title: 'Title',
      dimensions: 'Dimensions',
      source: 'Source',
      noTitle: 'Title not available',
      noPreview: 'Preview not available',
      open: 'Open image',
      count: 'works',
      ex1: 'Virtual exhibition: Terminal Realism and critical landscape',
      ex2: 'Virtual exhibition: Sustainable art and recovered matter',
      ex3: 'Virtual exhibition: Digital art with AI support',
      ex3Sub: 'A selection of digital works shaped by the dialogue between painting and AI tools.'
    }
  };

  const t = labels[lang] || labels.it;
  const bookOrder = ['LS', 'DA', 'AS', 'CP'];
  const normalize = (v) => (v || '').toLowerCase();
  const safePath = (p) => encodeURI('../' + p.replace(/\\/g, '/'));
  const mediaVersion = () => {
    const stamp = (window.ARCHIVE_CATALOG && window.ARCHIVE_CATALOG.generatedAt) || '';
    return stamp ? ('?v=' + encodeURIComponent(stamp)) : '';
  };

  function card(item) {
    const title = item.title || t.noTitle;
    const sourceName = lang === 'it' ? (item.bookTitleIt || item.bookCode) : (item.bookTitleEn || item.bookCode);
    return `
      <article class="archive-card">
        <div class="archive-media">
          <img loading="lazy" src="${safePath(item.path)}${mediaVersion()}" alt="${title}" onerror="this.style.display='none';this.parentElement.innerHTML='<div class=&quot;no-preview&quot;>${t.noPreview}</div>';">
        </div>
        <div class="archive-meta">
          <p><strong>${t.id}:</strong> ${item.id}</p>
          <p><strong>${t.title}:</strong> ${title}</p>
          ${item.dimensionsCm ? `<p><strong>${t.dimensions}:</strong> ${item.dimensionsCm}</p>` : ''}
          <p><strong>${t.source}:</strong> ${sourceName} (${item.bookCode})</p>
          <p><a href="${safePath(item.path)}${mediaVersion()}" target="_blank" rel="noopener">${t.open}</a></p>
        </div>
      </article>
    `;
  }

  function byKeyword(items, words) {
    return items.filter((item) => {
      const v = normalize(item.title);
      return words.some((w) => v.includes(w));
    });
  }

  function renderGroupedArchive(items) {
    const grouped = new Map();
    bookOrder.forEach((k) => grouped.set(k, []));
    items.forEach((item) => {
      if (!grouped.has(item.bookCode)) grouped.set(item.bookCode, []);
      grouped.get(item.bookCode).push(item);
    });

    let html = '';
    for (const code of grouped.keys()) {
      const group = grouped.get(code);
      const first = group[0] || null;
      const name = first
        ? (lang === 'it' ? first.bookTitleIt : first.bookTitleEn)
        : code;
      let cards = '';
      try {
        cards = group.map(card).join('');
      } catch (_) {
        cards = `<p class="lead">${lang === 'it' ? 'Errore nella visualizzazione delle opere.' : 'Rendering error for works.'}</p>`;
      }
      html += `
        <section class="section is-visible">
          <h3>${name}</h3>
          <p class="lead">${group.length} ${t.count}</p>
          <div class="archive-grid">${cards}</div>
        </section>
      `;
    }
    mount.innerHTML = html;
  }

  function renderSingleExhibition(title, subtitle, items) {
    mount.innerHTML = `
      <section class="section is-visible">
        <h3>${title}</h3>
        ${subtitle ? `<p class="lead">${subtitle}</p>` : ''}
        <div class="archive-grid">${items.map(card).join('')}</div>
      </section>
    `;
  }

  Promise.resolve(window.ARCHIVE_CATALOG || null)
    .then((data) => {
      if (!data) throw new Error('Catalog missing');
      const all = (data.items || []).filter((x) => x.hasPreview && x.extension !== '.heic');

      const realismo = byKeyword(all, ['fabbriche', 'centrale', 'discarica', 'mosche', 'mosul', 'paure', 'deserto', 'viaggio', 'santorini']);
      const sostenibile = all.filter((x) => x.bookCode === 'LS');
      const ai = all
        .filter((x) => x.bookCode === 'DA')
        .sort((a, b) => (a.title || '').localeCompare(b.title || ''));

      if (mode === 'archive') {
        renderGroupedArchive(all);
      } else if (mode === 'exhibition-realismo') {
        renderSingleExhibition(t.ex1, '', realismo);
      } else if (mode === 'exhibition-sostenibile') {
        renderSingleExhibition(t.ex2, '', sostenibile);
      } else if (mode === 'exhibition-ai') {
        renderSingleExhibition(t.ex3, t.ex3Sub, ai);
      } else if (mode === 'exhibitions') {
        mount.innerHTML = `
          <section class="section is-visible"><h3>${t.ex1}</h3><div class="archive-grid">${realismo.map(card).join('')}</div></section>
          <section class="section is-visible"><h3>${t.ex2}</h3><div class="archive-grid">${sostenibile.map(card).join('')}</div></section>
          <section class="section is-visible"><h3>${t.ex3}</h3><p class="lead">${t.ex3Sub}</p><div class="archive-grid">${ai.map(card).join('')}</div></section>
        `;
      } else {
        renderGroupedArchive(all);
      }

      window.dispatchEvent(new Event('catalog:rendered'));
    })
    .catch(() => {
      mount.innerHTML = '<p>Catalog loading error.</p>';
    });
})();
