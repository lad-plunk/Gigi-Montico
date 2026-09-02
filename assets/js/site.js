(() => {
  const ANALYTICS_MEASUREMENT_ID = 'G-R345WTHYJX';
  const CONSENT_STORAGE_KEY = 'gm_analytics_consent_v1';
  const isItalianPage = (document.documentElement.lang || '').toLowerCase().startsWith('it');

  function readConsent() {
    try {
      const value = window.localStorage.getItem(CONSENT_STORAGE_KEY);
      return value === 'accepted' || value === 'rejected' ? value : null;
    } catch (_) {
      return null;
    }
  }

  function writeConsent(value) {
    try {
      window.localStorage.setItem(CONSENT_STORAGE_KEY, value);
    } catch (_) {
      // If storage is unavailable, the visitor will be asked again next time.
    }
  }

  function deleteAnalyticsCookies() {
    const cookieNames = document.cookie
      .split(';')
      .map((item) => item.split('=')[0].trim())
      .filter((name) => name === '_ga' || name.startsWith('_ga_'));

    cookieNames.forEach((name) => {
      document.cookie = `${name}=; Max-Age=0; path=/; SameSite=Lax`;
      document.cookie = `${name}=; Max-Age=0; path=/; domain=.artemontico.it; SameSite=Lax`;
    });
  }

  function ensureGtag() {
    window.dataLayer = window.dataLayer || [];
    window.gtag = window.gtag || function gtag() {
      window.dataLayer.push(arguments);
    };
  }

  function loadAnalytics() {
    if (document.querySelector(`script[data-ga-id="${ANALYTICS_MEASUREMENT_ID}"]`)) return;

    ensureGtag();
    window.gtag('consent', 'default', {
      ad_storage: 'denied',
      ad_user_data: 'denied',
      ad_personalization: 'denied',
      analytics_storage: 'denied'
    });
    window.gtag('consent', 'update', {
      ad_storage: 'denied',
      ad_user_data: 'denied',
      ad_personalization: 'denied',
      analytics_storage: 'granted'
    });
    window.gtag('js', new Date());
    window.gtag('config', ANALYTICS_MEASUREMENT_ID, {
      allow_google_signals: false,
      allow_ad_personalization_signals: false,
      cookie_expires: 34128000,
      cookie_update: false,
      content_group: isItalianPage ? 'Italian' : 'English'
    });

    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(ANALYTICS_MEASUREMENT_ID)}`;
    script.dataset.gaId = ANALYTICS_MEASUREMENT_ID;
    document.head.appendChild(script);
  }

  function revokeAnalytics() {
    ensureGtag();
    window.gtag('consent', 'update', {
      ad_storage: 'denied',
      ad_user_data: 'denied',
      ad_personalization: 'denied',
      analytics_storage: 'denied'
    });
    deleteAnalyticsCookies();
  }

  function setupConsentControls() {
    const labels = isItalianPage
      ? {
          title: 'Statistiche facoltative',
          text: 'Con il tuo consenso usiamo Google Analytics per capire quali pagine e lingue sono più consultate. Nessun dato viene inviato prima della scelta.',
          accept: 'Accetta',
          reject: 'Rifiuta',
          privacy: 'Privacy e cookie',
          manage: 'Gestisci preferenze'
        }
      : {
          title: 'Optional analytics',
          text: 'With your consent, we use Google Analytics to understand which pages and languages are visited most. No data is sent before you choose.',
          accept: 'Accept',
          reject: 'Reject',
          privacy: 'Privacy and cookies',
          manage: 'Manage preferences'
        };

    const privacyHref = 'privacy.html';
    const footer = document.querySelector('.site-footer');
    if (footer && !footer.querySelector('.privacy-controls')) {
      const controls = document.createElement('div');
      controls.className = 'privacy-controls';
      controls.innerHTML = `<a href="${privacyHref}">${labels.privacy}</a><button type="button">${labels.manage}</button>`;
      footer.appendChild(controls);
    }

    const banner = document.createElement('aside');
    banner.className = 'consent-banner';
    banner.setAttribute('role', 'dialog');
    banner.setAttribute('aria-modal', 'false');
    banner.setAttribute('aria-labelledby', 'consent-title');
    banner.hidden = true;
    banner.innerHTML = `
      <div class="consent-copy">
        <strong id="consent-title">${labels.title}</strong>
        <p>${labels.text} <a href="${privacyHref}">${labels.privacy}</a>.</p>
      </div>
      <div class="consent-actions">
        <button type="button" data-consent="rejected">${labels.reject}</button>
        <button type="button" data-consent="accepted">${labels.accept}</button>
      </div>`;
    document.body.appendChild(banner);

    function showBanner() {
      banner.hidden = false;
      banner.querySelector('[data-consent="rejected"]').focus();
    }

    function hideBanner() {
      banner.hidden = true;
    }

    banner.addEventListener('click', (event) => {
      const button = event.target.closest('[data-consent]');
      if (!button) return;

      const choice = button.dataset.consent;
      writeConsent(choice);
      if (choice === 'accepted') {
        loadAnalytics();
      } else {
        const analyticsWasLoaded = Boolean(
          document.querySelector(`script[data-ga-id="${ANALYTICS_MEASUREMENT_ID}"]`)
        );
        revokeAnalytics();
        if (analyticsWasLoaded) {
          window.location.reload();
          return;
        }
      }
      hideBanner();
    });

    footer?.querySelector('.privacy-controls button')?.addEventListener('click', showBanner);

    const savedConsent = readConsent();
    if (savedConsent === 'accepted') {
      loadAnalytics();
    } else if (!savedConsent) {
      showBanner();
    }
  }

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

  setupConsentControls();

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
  const isItalian = isItalianPage;
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
