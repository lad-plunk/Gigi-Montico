(() => {
  document.documentElement.classList.add('js');

  function setupMobileNav() {
    const header = document.querySelector('.site-header');
    const nav = header?.querySelector('nav');
    if (!header || !nav || header.querySelector('.mobile-nav-toggle')) return;

    if (!nav.id) nav.id = 'site-nav';

    const isIt = (document.documentElement.lang || '').toLowerCase().startsWith('it');
    const menuText = 'Menu';
    const closeText = isIt ? 'Chiudi' : 'Close';
    const openLabel = isIt ? 'Apri menu di navigazione' : 'Open navigation menu';
    const closeLabel = isIt ? 'Chiudi menu di navigazione' : 'Close navigation menu';

    const toggle = document.createElement('button');
    toggle.type = 'button';
    toggle.className = 'mobile-nav-toggle';
    toggle.textContent = menuText;
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-controls', nav.id);
    toggle.setAttribute('aria-label', openLabel);

    function setOpen(open) {
      header.classList.toggle('nav-open', open);
      toggle.textContent = open ? closeText : menuText;
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      toggle.setAttribute('aria-label', open ? closeLabel : openLabel);
    }

    toggle.addEventListener('click', () => {
      setOpen(!header.classList.contains('nav-open'));
    });

    nav.addEventListener('click', (event) => {
      if (window.matchMedia('(max-width: 920px)').matches && event.target.closest('a')) {
        setOpen(false);
      }
    });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && header.classList.contains('nav-open')) {
        setOpen(false);
      }
    });

    window.addEventListener('resize', () => {
      if (!window.matchMedia('(max-width: 920px)').matches) {
        setOpen(false);
      }
    });

    const brand = header.querySelector('.brand');
    if (brand) {
      brand.insertAdjacentElement('afterend', toggle);
    } else {
      header.insertBefore(toggle, nav);
    }
  }

  setupMobileNav();

  const sections = document.querySelectorAll('.reveal');
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.14 });

  sections.forEach((section, idx) => {
    section.style.transitionDelay = `${Math.min(idx * 70, 320)}ms`;
    observer.observe(section);
  });

  const lightbox = document.createElement('div');
  lightbox.className = 'lightbox';
  lightbox.innerHTML = '<button type="button" aria-label="Close">x</button><img alt="Zoomed artwork">';
  document.body.appendChild(lightbox);

  const closeBtn = lightbox.querySelector('button');
  const lightboxImg = lightbox.querySelector('img');

  function closeLightbox() {
    lightbox.classList.remove('open');
    lightboxImg.removeAttribute('src');
  }

  function bindZoomables() {
    document.querySelectorAll('img.zoomable, .gallery img, .archive-media img').forEach((img) => {
      if (img.dataset.zoomBound === '1') return;
      img.dataset.zoomBound = '1';
      img.classList.add('zoomable');
      img.addEventListener('click', () => {
        lightboxImg.src = img.src;
        lightboxImg.alt = img.alt || 'Artwork image';
        lightbox.classList.add('open');
      });
    });
  }

  bindZoomables();
  window.addEventListener('catalog:rendered', bindZoomables);

  closeBtn.addEventListener('click', closeLightbox);
  lightbox.addEventListener('click', (e) => {
    if (e.target === lightbox) closeLightbox();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeLightbox();
  });
})();
