(() => {
  function stripTrackingParams() {
    if (!window.history || typeof window.history.replaceState !== 'function') return;

    const url = new URL(window.location.href);
    const trackedKeys = new Set([
      'fbclid',
      'gclid',
      'dclid',
      'gbraid',
      'wbraid',
      'mc_cid',
      'mc_eid',
      'igshid',
      'mibextid',
      '__tn__'
    ]);
    const trackedPrefixes = ['utm_', '__cft__'];
    let changed = false;

    Array.from(url.searchParams.keys()).forEach((key) => {
      const shouldDelete = trackedKeys.has(key)
        || trackedPrefixes.some((prefix) => key.startsWith(prefix));
      if (!shouldDelete) return;
      url.searchParams.delete(key);
      changed = true;
    });

    if (!changed) return;

    const cleanSearch = url.searchParams.toString();
    const cleanUrl = `${url.pathname}${cleanSearch ? `?${cleanSearch}` : ''}${url.hash}`;
    window.history.replaceState(window.history.state, document.title, cleanUrl);
  }

  stripTrackingParams();

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
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.01 });

    sections.forEach((section, idx) => {
      section.style.transitionDelay = `${Math.min(idx * 70, 320)}ms`;
      observer.observe(section);
    });
  } else {
    sections.forEach((section) => section.classList.add('is-visible'));
  }

  const lightbox = document.createElement('div');
  lightbox.className = 'lightbox';
  const isItalian = (document.documentElement.lang || '').toLowerCase().startsWith('it');
  lightbox.setAttribute('role', 'dialog');
  lightbox.setAttribute('aria-modal', 'true');
  lightbox.setAttribute('aria-label', isItalian ? 'Immagine ingrandita' : 'Enlarged image');
  lightbox.innerHTML = `<button type="button" aria-label="${isItalian ? 'Chiudi' : 'Close'}">×</button><img alt="">`;
  document.body.appendChild(lightbox);

  const closeBtn = lightbox.querySelector('button');
  const lightboxImg = lightbox.querySelector('img');
  let returnFocus = null;

  function closeLightbox() {
    lightbox.classList.remove('open');
    lightboxImg.removeAttribute('src');
    document.body.classList.remove('lightbox-open');
    if (returnFocus) returnFocus.focus();
    returnFocus = null;
  }

  function openLightbox(img, trigger) {
    returnFocus = trigger;
    lightboxImg.src = img.dataset.full || img.src;
    lightboxImg.alt = img.alt || (isItalian ? 'Opera ingrandita' : 'Enlarged artwork');
    lightbox.classList.add('open');
    document.body.classList.add('lightbox-open');
    closeBtn.focus();
  }

  function bindZoomables() {
    document.querySelectorAll('img.zoomable, .gallery img, .archive-media img, .paintings-archive img').forEach((img) => {
      const trigger = img.closest('.paintings-archive-button') || img;
      if (trigger.dataset.zoomBound === '1') return;
      trigger.dataset.zoomBound = '1';
      img.classList.add('zoomable');
      if (trigger === img) {
        trigger.tabIndex = 0;
        trigger.setAttribute('role', 'button');
        trigger.addEventListener('keydown', (event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            openLightbox(img, trigger);
          }
        });
      }
      trigger.addEventListener('click', () => openLightbox(img, trigger));
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
