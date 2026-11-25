(() => {
  'use strict';

  const deck = document.querySelector('[data-deck]');
  const sheets = Array.from(deck.querySelectorAll('.listy-sheet'));
  const controls = document.querySelector('[data-sheet-controls]');
  const back = controls.querySelector('[data-sheet-back]');
  const announcement = controls.querySelector('[data-sheet-announcement]');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let active = -1;
  let animation = null;
  let leaving = null;
  let touch = null;

  const indexFor = hash => sheets.findIndex(sheet => `#${sheet.id}` === hash);
  const finishMotion = () => {
    if (leaving) {
      leaving.hidden = true;
      delete leaving.dataset.leaving;
      leaving = null;
    }
    animation?.cancel();
    animation = null;
  };

  const show = (index, moveFocus = true) => {
    const incoming = sheets[index];
    if (!incoming) return;
    const focusTitle = () => incoming.querySelector('.listy-title').focus({preventScroll: true});
    if (index === active) {
      if (moveFocus) focusTitle();
      return;
    }

    finishMotion();
    const outgoing = sheets[active];
    const forward = index > active;
    const animate = !!outgoing && !reducedMotion.matches && typeof incoming.animate === 'function';
    active = index;
    incoming.hidden = false;
    incoming.inert = false;
    deck.dataset.sheet = String(index + 1);
    back.disabled = index === 0;
    announcement.textContent = `Лист ${index + 1} из ${sheets.length}`;
    if (moveFocus) focusTitle();

    if (!outgoing) {
      for (const sheet of sheets) {
        sheet.hidden = sheet !== incoming;
        sheet.inert = sheet !== incoming;
      }
      return;
    }

    outgoing.inert = true;
    outgoing.hidden = !animate || !forward;
    if (deck.getBoundingClientRect().top < 0) window.scrollTo(0, 0);
    if (!animate) return;

    const flat = {transform: 'none', opacity: 1};
    const lifted = {transform: 'translate(27%, -12%) rotate(14deg)', opacity: 0};
    if (forward) {
      leaving = outgoing;
      leaving.dataset.leaving = '';
    }
    const transition = (forward ? outgoing : incoming).animate(forward ? [flat, lifted] : [lifted, flat], {
      duration: forward ? 400 : 330,
      easing: 'cubic-bezier(.21,.7,.27,1)',
      fill: 'both',
    });
    animation = transition;
    transition.onfinish = () => { if (animation === transition) finishMotion(); };
  };

  const go = index => {
    if (!sheets[index]) return;
    const url = new URL(location.href);
    url.hash = sheets[index].id;
    if (url.href !== location.href) history.pushState(null, '', url);
    show(index);
  };
  const restore = () => {
    const index = indexFor(location.hash);
    if (index >= 0) show(index, index !== active);
    else if (!location.hash) show(0, active !== 0);
  };

  show(Math.max(0, indexFor(location.hash)), false);
  deck.dataset.ready = '';
  controls.hidden = false;

  window.addEventListener('popstate', restore);
  window.addEventListener('hashchange', restore);
  reducedMotion.addEventListener('change', finishMotion);
  back.addEventListener('click', () => go(active - 1));
  document.querySelectorAll('[data-sheet-link]').forEach(link => link.addEventListener('click', event => {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    go(indexFor(link.hash));
  }));

  document.addEventListener('keydown', event => {
    if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey
      || event.target.closest('input, textarea, select, [contenteditable]:not([contenteditable="false"])')) return;
    const index = active + (event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0);
    if (!sheets[index] || index === active) return;
    event.preventDefault();
    go(index);
  });

  deck.addEventListener('pointerdown', event => {
    if (!event.isPrimary || event.pointerType !== 'touch' || event.target.closest('a:not(.listy-turn), button, form')) return;
    touch = {id: event.pointerId, x: event.clientX, y: event.clientY};
  });
  window.addEventListener('pointerup', event => {
    if (touch?.id !== event.pointerId) return;
    const dx = event.clientX - touch.x;
    const dy = event.clientY - touch.y;
    touch = null;
    if (Math.abs(dx) >= 48 && Math.abs(dx) > Math.abs(dy) * 1.45) go(active + (dx < 0 ? 1 : -1));
  });
  window.addEventListener('pointercancel', event => {
    if (touch?.id === event.pointerId) touch = null;
  });
})();
