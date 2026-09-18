(() => {
  const page = document.querySelector('.preview-page');
  if (!page) return;
  const lang = page.dataset.lang || 'it';
  const text = {
    it: {
      records: 'record nel registro',
      selected: 'Periodo selezionato',
      estimated: '≈ indica una collocazione stimata',
      source: 'Selezione dal registro documentario del progetto.',
      readMore: 'Leggi i punti principali del periodo',
    },
    en: {
      records: 'entries in the register',
      selected: 'Selected period',
      estimated: '≈ indicates an estimated placement',
      source: 'Selection from the project documentary register.',
      readMore: 'Read the main points for this period',
    },
  }[lang];

  const periods = [
    {
      id: 'figure', years: '1960-1980', count: 27,
      it: { title: 'Figura, gesto e materia', body: 'Dalla formazione milanese alle prime personali, Montico sviluppa una pittura in cui figura, colore e gesto costruiscono superfici sempre più dense. Il Gruppo P4 e le partecipazioni fuori Milano mostrano già una rete professionale attiva.', highlights: ['Prima personale alla Galleria Lux di Milano nel 1961.', 'Gruppo P4 a Piacenza e lungo la Val Trebbia nel 1971.', 'Spatola, colore e prime sperimentazioni tra figurazione e astrazione.'] },
      en: { title: 'Figure, gesture and matter', body: 'From his Milan training to the first solo exhibitions, Montico develops a painting in which figure, colour and gesture build increasingly dense surfaces. Gruppo P4 and exhibitions outside Milan already show an active professional network.', highlights: ['First solo exhibition at Galleria Lux in Milan in 1961.', 'Gruppo P4 in Piacenza and along the Trebbia Valley in 1971.', 'Palette knife, colour and early experiments between figuration and abstraction.'] },
    },
    {
      id: 'space', years: '1980-1990', count: 27,
      it: { title: 'Spazio, collage e costruzione', body: 'La composizione diventa ambiente mentale: piani sovrapposti, inserti materici e collage trasformano la superficie in una costruzione aperta. Le antologiche e le reti internazionali ampliano il campo della ricerca.', highlights: ['Antologica alla Galleria 2 Archi di Milano nel 1975.', 'Attività internazionali tra Portogallo, Svizzera e Francia.', 'Tela presentata all’inaugurazione del complesso Gratte-Ciel di Villeurbanne nel 1989.'] },
      en: { title: 'Space, collage and construction', body: 'Composition becomes a mental environment: overlapping planes, material inserts and collage turn the surface into an open construction. Retrospectives and international networks broaden the field of research.', highlights: ['Retrospective at Galleria 2 Archi in Milan in 1975.', 'International activity across Portugal, Switzerland and France.', 'Painting presented at the opening of the Gratte-Ciel complex in Villeurbanne in 1989.'] },
    },
    {
      id: 'surface', years: '1990-2000', count: 8,
      it: { title: 'Superficie, paesaggio e intervento', body: 'Il trasferimento verso il territorio lodigiano non interrompe la carriera. Le mostre a Lione si affiancano a opere su commissione e interventi pittorici in luoghi civici e commerciali.', highlights: ['Mostre alla Galerie David e all’Istituto Culturale Italiano di Lione (Francia).', 'Colonne e parete dipinte al ristorante Patrini di Monte Cremasco, data stimata.', 'Interventi alla Banca Centropadana di Boffalora d’Adda, circa 1995.'] },
      en: { title: 'Surface, landscape and intervention', body: 'The move toward the Lodi area does not interrupt his career. Exhibitions in Lyon are joined by commissioned works and painted interventions in civic and commercial spaces.', highlights: ['Exhibitions at Galerie David and the Italian Cultural Institute in Lyon, France.', 'Painted columns and wall at the Patrini restaurant in Monte Cremasco, estimated date.', 'Interventions at Banca Centropadana in Boffalora d’Adda, around 1995.'] },
    },
    {
      id: 'civic', years: '2000-2013', count: 18,
      it: { title: 'Ecologia, arte civile e comunità', body: 'La pittura entra nei comuni, nelle scuole e nei progetti di educazione ambientale. Arte da raccolta differenziata porta l’artista a lavorare con bambini, insegnanti e amministrazioni locali.', highlights: ['Avvio di Arte da raccolta differenziata dal 2001.', 'Villa Barni a Dovera nel 2003.', 'Rivolta d’Adda, Pandino, Vaiano, Brembio e la lunga antologica di Lodi.'] },
      en: { title: 'Ecology, civic art and community', body: 'Painting enters town halls, schools and environmental education projects. Arte da raccolta differenziata brings the artist into collaboration with children, teachers and local administrations.', highlights: ['Launch of Arte da raccolta differenziata from 2001.', 'Villa Barni in Dovera in 2003.', 'Rivolta d’Adda, Pandino, Vaiano, Brembio and the long retrospective in Lodi.'] },
    },
    {
      id: 'terminal', years: '2010-oggi', count: 15,
      it: { title: 'Ricerca condivisa e Realismo Terminale', body: 'Le attività proseguono attraverso scuole, musei, istituti superiori, collettive e progetti curati da associazioni culturali. La ricerca recente si apre inoltre a sostenibilità, libri, immagini digitali e al confronto con il Realismo Terminale.', highlights: ['Trasmutazioni, Semina Verbi, Syrinx III e Cesaris per le Arti Visive.', 'Montico e la Bohème de Paris e Acquerelli brasiliani.', 'L’arte della sostenibilità, Digital art with AI support e 11 / 1000.'] },
      en: { title: 'Shared research and Terminal Realism', body: 'Activities continue through schools, museums, secondary institutes, group exhibitions and projects curated by cultural associations. Recent research also opens toward sustainability, books, digital images and a dialogue with Terminal Realism.', highlights: ['Trasmutazioni, Semina Verbi, Syrinx III and Cesaris per le Arti Visive.', 'Montico e la Bohème de Paris and Brazilian Watercolours.', 'L’arte della sostenibilità, Digital art with AI support and 11 / 1000.'] },
    },
  ];

  const highlights = {
    it: [
      ['1961', 'Prima personale alla Galleria Lux, Milano.', 'mostra'],
      ['1971', 'Gruppo P4: Palazzo Gotico di Piacenza e itineranza lungo la Val Trebbia.', 'mostra'],
      ['1973-74', 'Esposizioni al Forte Village, Sardegna.', 'mostra'],
      ['1975', 'Antologica alla Galleria 2 Archi, Milano.', 'mostra'],
      ['1976', 'Medaglia d’argento di Ciao Milan.', 'riconoscimento'],
      ['1989', 'Tela permanente al complesso Gratte-Ciel, Villeurbanne (Francia).', 'opera'],
      ['1991-98', 'Mostre a Lione (Francia) e nel territorio lodigiano.', 'mostra'],
      ['≈1993', 'Intervento pittorico al ristorante Patrini, Monte Cremasco.', 'commissione'],
      ['≈1995', 'Intervento alla Banca Centropadana, Boffalora d’Adda.', 'commissione'],
      ['2001-10', 'Arte da raccolta differenziata con comuni e scuole.', 'progetto'],
      ['2011-17', 'Cesaris, Semina Verbi, Syrinx e mostre curate da associazioni.', 'mostra'],
      ['2023', 'Libri su sostenibilità e arte digitale con supporto IA.', 'libro'],
      ['2026', '11 / 1000: libro e progetto di ricerca.', 'libro'],
    ],
    en: [
      ['1961', 'First solo exhibition at Galleria Lux, Milan.', 'exhibition'],
      ['1971', 'Gruppo P4: Palazzo Gotico in Piacenza and touring exhibition through the Trebbia Valley.', 'exhibition'],
      ['1973-74', 'Exhibitions at Forte Village, Sardinia.', 'exhibition'],
      ['1975', 'Retrospective at Galleria 2 Archi, Milan.', 'exhibition'],
      ['1976', 'Ciao Milan silver medal.', 'recognition'],
      ['1989', 'Permanent painting at the Gratte-Ciel complex, Villeurbanne, France.', 'work'],
      ['1991-98', 'Exhibitions in Lyon, France, and the Lodi area.', 'exhibition'],
      ['≈1993', 'Painted intervention at Patrini restaurant, Monte Cremasco.', 'commission'],
      ['≈1995', 'Intervention at Banca Centropadana, Boffalora d’Adda.', 'commission'],
      ['2001-10', 'Arte da raccolta differenziata with municipalities and schools.', 'project'],
      ['2011-17', 'Cesaris, Semina Verbi, Syrinx and association-curated exhibitions.', 'exhibition'],
      ['2023', 'Books on sustainability and AI-supported digital art.', 'book'],
      ['2026', '11 / 1000: book and research project.', 'book'],
    ],
  };

  const periodGrid = page.querySelector('[data-period-grid]');
  const detail = page.querySelector('[data-period-detail]');
  const renderPeriod = (period) => {
    const copy = period[lang];
    const displayYears = lang === 'en' && period.years === '2010-oggi' ? '2010-today' : period.years;
    detail.querySelector('[data-detail-kicker]').textContent = `${text.selected} · ${displayYears}`;
    detail.querySelector('[data-detail-title]').textContent = copy.title;
    detail.querySelector('[data-detail-body]').textContent = copy.body;
    detail.querySelector('[data-detail-list]').innerHTML = copy.highlights.map(item => `<li>${item}</li>`).join('');
    page.querySelectorAll('[data-period-id]').forEach(button => {
      const selected = button.dataset.periodId === period.id;
      button.classList.toggle('is-selected', selected);
      button.setAttribute('aria-selected', selected ? 'true' : 'false');
    });
  };

  periods.forEach((period, index) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'period-button';
    button.dataset.periodId = period.id;
    button.setAttribute('role', 'tab');
    button.setAttribute('aria-selected', index === 0 ? 'true' : 'false');
    button.setAttribute('aria-controls', 'period-detail');
    const displayYears = lang === 'en' && period.years === '2010-oggi' ? '2010-today' : period.years;
    button.innerHTML = `<span class="period-years">${displayYears}</span><span class="period-title">${period[lang].title}</span><span class="period-bar" style="--bar-height:${Math.max(2.3, (period.count / 27) * 8.8)}rem"></span><span class="period-count">${period.count} ${text.records}</span>`;
    button.addEventListener('click', () => renderPeriod(period));
    periodGrid.appendChild(button);
  });
  renderPeriod(periods[0]);

  const milestoneList = page.querySelector('[data-milestones]');
  if (milestoneList) {
    milestoneList.innerHTML = highlights[lang].map(([year, description, type]) => `<article class="milestone"><div class="milestone-year">${year}</div><div><p>${description}</p><small>${type}</small></div></article>`).join('');
  }
  const estimateNote = page.querySelector('[data-estimate-note]');
  if (estimateNote) estimateNote.textContent = text.estimated;
  const sourceNote = page.querySelector('[data-source-note]');
  if (sourceNote) sourceNote.textContent = text.source;
})();
