(() => {
  const triggers = Array.from(document.querySelectorAll('.project-art-button'));
  const lightbox = document.getElementById('project-lightbox');
  if (!triggers.length || !lightbox) return;

  const image = lightbox.querySelector('img');
  const caption = lightbox.querySelector('figcaption');
  const counter = lightbox.querySelector('.project-lightbox-counter');
  const closeButton = lightbox.querySelector('.project-lightbox-close');
  const previousButton = lightbox.querySelector('.project-lightbox-prev');
  const nextButton = lightbox.querySelector('.project-lightbox-next');
  const controls = [closeButton, previousButton, nextButton];
  let currentIndex = 0;
  let returnFocus = null;

  function update(index) {
    currentIndex = (index + triggers.length) % triggers.length;
    const sourceImage = triggers[currentIndex].querySelector('img');
    image.src = sourceImage.src;
    image.alt = sourceImage.alt;
    caption.textContent = triggers[currentIndex].closest('figure').querySelector('figcaption').textContent;
    counter.textContent = (currentIndex + 1) + ' / ' + triggers.length;
  }

  function open(index, trigger) {
    returnFocus = trigger;
    update(index);
    lightbox.hidden = false;
    document.body.classList.add('project-lightbox-open');
    closeButton.focus();
  }

  function close() {
    lightbox.hidden = true;
    image.removeAttribute('src');
    document.body.classList.remove('project-lightbox-open');
    if (returnFocus) returnFocus.focus();
  }

  triggers.forEach((trigger, index) => {
    trigger.addEventListener('click', () => open(index, trigger));
  });

  closeButton.addEventListener('click', close);
  previousButton.addEventListener('click', () => update(currentIndex - 1));
  nextButton.addEventListener('click', () => update(currentIndex + 1));
  lightbox.addEventListener('click', (event) => {
    if (event.target === lightbox) close();
  });

  document.addEventListener('keydown', (event) => {
    if (lightbox.hidden) return;
    if (event.key === 'Escape') {
      event.preventDefault();
      close();
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault();
      update(currentIndex - 1);
    } else if (event.key === 'ArrowRight') {
      event.preventDefault();
      update(currentIndex + 1);
    } else if (event.key === 'Tab') {
      const first = controls[0];
      const last = controls[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
  });
})();
