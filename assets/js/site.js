(() => {
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
