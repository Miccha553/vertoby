(() => {
  'use strict';
  const root = document.documentElement;
  const base = root.dataset.base || './';
  const started = performance.now();
  const menu = document.querySelector('.menu-button');
  const navigation = document.getElementById('navigation');
  const servicesHost = document.querySelector('.nav-services');
  const servicesToggle = document.querySelector('.nav-services-toggle');
  const servicesMenu = document.getElementById('services-menu');
  const desktopServices = window.matchMedia('(min-width: 761px)');
  let servicesCloseTimer;
  const setMenu = open => {
    if (!menu || !navigation) return;
    menu.setAttribute('aria-expanded', String(open));
    menu.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');
    navigation.classList.toggle('is-open', open);
  };
  const setServices = open => {
    if (!servicesToggle || !servicesMenu) return;
    if (servicesCloseTimer) { window.clearTimeout(servicesCloseTimer); servicesCloseTimer = undefined; }
    servicesToggle.setAttribute('aria-expanded', String(open));
    servicesMenu.classList.toggle('is-open', open);
  };
  const keepServicesOpen = () => {
    if (!desktopServices.matches) return;
    setServices(true);
  };
  const scheduleServicesClose = () => {
    if (!desktopServices.matches || !servicesHost) return;
    if (servicesCloseTimer) window.clearTimeout(servicesCloseTimer);
    servicesCloseTimer = window.setTimeout(() => {
      servicesCloseTimer = undefined;
      if (!servicesHost.matches(':hover') && !servicesHost.matches(':focus-within')) setServices(false);
    }, 420);
  };
  menu?.addEventListener('click', () => setMenu(menu.getAttribute('aria-expanded') !== 'true'));
  servicesToggle?.addEventListener('click', () => setServices(servicesToggle.getAttribute('aria-expanded') !== 'true'));
  servicesHost?.addEventListener('pointerenter', keepServicesOpen);
  servicesHost?.addEventListener('pointerleave', scheduleServicesClose);
  servicesMenu?.addEventListener('pointerenter', keepServicesOpen);
  servicesHost?.addEventListener('focusin', keepServicesOpen);
  servicesHost?.addEventListener('focusout', event => {
    if (!servicesHost.contains(event.relatedTarget)) scheduleServicesClose();
  });
  navigation?.addEventListener('click', event => { if (event.target.closest('a')) { setServices(false); setMenu(false); } });
  document.addEventListener('keydown', event => {
    if (event.key !== 'Escape') return;
    if (servicesToggle?.getAttribute('aria-expanded') === 'true') { setServices(false); servicesToggle.focus(); return; }
    if (menu?.getAttribute('aria-expanded') === 'true') { setMenu(false); menu.focus(); }
  });
  document.addEventListener('click', event => { if (!event.target.closest('.header')) { setServices(false); setMenu(false); } });
  window.matchMedia('(min-width: 761px)').addEventListener('change', () => { setServices(false); setMenu(false); });
  document.getElementById('year')?.replaceChildren(String(new Date().getFullYear()));

  const focusServiceFromHash = () => {
    if (location.hash !== '#service-ai') return;
    const service = document.getElementById('service-ai');
    if (!service) return;
    service.open = true;
    window.requestAnimationFrame(() => service.scrollIntoView({behavior:'smooth', block:'start'}));
  };
  focusServiceFromHash();
  window.addEventListener('hashchange', focusServiceFromHash);

  const caseFilters = document.querySelectorAll('[data-case-filter]');
  const regionalCases = document.querySelectorAll('[data-case-region]');
  if (caseFilters.length && regionalCases.length) {
    const setCaseRegion = region => {
      caseFilters.forEach(filter => {
        const active = filter.dataset.caseFilter === region;
        filter.classList.toggle('is-active', active);
        filter.setAttribute('aria-pressed', String(active));
      });
      regionalCases.forEach(card => { card.hidden = card.dataset.caseRegion !== region; });
    };
    caseFilters.forEach(filter => filter.addEventListener('click', () => setCaseRegion(filter.dataset.caseFilter)));
    setCaseRegion(document.querySelector('[data-case-filter].is-active')?.dataset.caseFilter || 'belarus');
  }

  const projectNames = {1:'MADMEN',2:'Lux Cleaning',3:'Ivan Shavel',4:'Кухоника',5:'Eliza Hair Studio',6:'СТО на Старовиленской',7:'Колорадо',8:'Парк номер 1',9:"Maison L’Éphémère",10:"Nordisk Kaffe Roasteri",11:"Scuderia Corvo",12:"Val d’Hérens Lodges",13:"Vanguard Barber",14:"Æther Home Intelligence",15:"Ironwood & Keg",16:"LaSalle & Company Advisors",17:"Monolith NYC",18:"Sundown Foam & Resin",19:"MD Wear",20:"New Way"};
  const dialog = document.getElementById('project-dialog');
  const fullImage = document.getElementById('project-full-image');
  let lastProjectButton;
  document.querySelectorAll('[data-project]').forEach(button => {
    button.addEventListener('click', () => {
      const id = button.dataset.project;
      if (!projectNames[id] || !dialog || !fullImage) return;
      lastProjectButton = button;
      fullImage.src = `${base}portfolio/images%20cases/${id}.webp`;
      fullImage.alt = `Полный дизайн сайта ${projectNames[id]}`;
      document.getElementById('project-dialog-title').textContent = projectNames[id];
      dialog.showModal();
      dialog.scrollTop = 0;
      document.body.classList.add('dialog-open');
    });
  });
  document.querySelector('.dialog-close')?.addEventListener('click', () => dialog.close());
  dialog?.addEventListener('click', event => { if (event.target === dialog) { const r = dialog.getBoundingClientRect(); if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) dialog.close(); } });
  dialog?.addEventListener('close', () => { document.body.classList.remove('dialog-open'); lastProjectButton?.focus({preventScroll:true}); });

  const serviceInterest = {
    sites: 'Хочу обсудить создание сайта',
    ads: 'Хочу обсудить запуск и ведение рекламы',
    smm: 'Хочу обсудить SMM и контент',
    seo: 'Хочу обсудить SEO-аудит и внедрение правок',
    ai: 'Хочу обсудить внедрение ИИ в бизнес'
  };
  const requestedService = new URLSearchParams(location.search).get('service');
  const normalizeName = value => value.normalize('NFC').replace(/[’‘ʼ]/gu, "'").replace(/[‐‑]/gu, '-').replace(/\s+/gu, ' ').replace(/ *([-']) */gu, '$1');
  const validName = value => Array.from(value).length >= 2 && Array.from(value).length <= 80 && /^\p{L}[\p{L}\p{M}]*(?:[ '-]\p{L}[\p{L}\p{M}]*)*$/u.test(value);
  const nameError = 'Укажите имя от 2 до 80 символов: только буквы, пробел, дефис или апостроф.';
  const phoneError = 'Укажите белорусский номер целиком: +375 XX XXX-XX-XX.';
  const phonePrefixLength = digits => digits.startsWith('00375') ? 5 : digits.startsWith('375') ? 3 : digits.startsWith('80') ? 2 : 0;
  const nationalPhone = value => {
    const raw = value.trim();
    if (!/^\+?[\d\s()-]*$/.test(raw)) return null;
    const digits = value.replace(/\D/g, '');
    let national;
    if (digits.startsWith('00375') && !raw.startsWith('+')) national = digits.slice(5);
    else if (digits.startsWith('375')) national = digits.slice(3);
    else if (digits.startsWith('80') && !raw.startsWith('+')) national = digits.slice(2);
    else if (raw.startsWith('+')) return null;
    else national = digits;
    return national.length <= 9 ? national : null;
  };
  const formatPhone = digits => '+375 ' + digits.slice(0, 2) + (digits.length > 2 ? ' ' + digits.slice(2, 5) : '') + (digits.length > 5 ? '-' + digits.slice(5, 7) : '') + (digits.length > 7 ? '-' + digits.slice(7, 9) : '');
  const contactPopup = (() => {
    const dialog = document.createElement('dialog');
    dialog.className = 'contact-dialog';
    dialog.setAttribute('aria-labelledby', 'contact-dialog-title');
    dialog.innerHTML = `
      <div class="contact-dialog-bar">
        <div><p class="eyebrow">СВЯЗЬ С VERTO</p><h2 id="contact-dialog-title">Обсудим вашу задачу</h2></div>
        <button class="dialog-close contact-dialog-close" type="button" aria-label="Закрыть окно">✕</button>
      </div>
      <div class="contact-dialog-choice">
        <p class="contact-dialog-lead">Выберите удобный способ связи — ответим и уточним задачу.</p>
        <div class="contact-dialog-options">
          <a class="contact-dialog-option" href="tel:+375333054152"><span class="contact-dialog-option-icon" aria-hidden="true">☎</span><span><strong>Позвонить</strong><small>+375 33 305-41-52</small></span><span aria-hidden="true">↗</span></a>
          <a class="contact-dialog-option" href="https://t.me/Verto_digital" target="_blank" rel="noopener"><span class="contact-dialog-option-icon" aria-hidden="true">↗</span><span><strong>Telegram</strong><small>@Verto_digital</small></span><span aria-hidden="true">↗</span></a>
          <a class="contact-dialog-option" href="viber://chat?number=%2B375333054152"><span class="contact-dialog-option-icon" aria-hidden="true">✦</span><span><strong>Viber</strong><small>Написать по номеру телефона</small></span><span aria-hidden="true">↗</span></a>
        </div>
        <button class="contact-dialog-form-link" type="button">Оставить заявку через форму</button>
      </div>
      <form class="contact-form contact-dialog-form" hidden>
        <button class="contact-dialog-back" type="button">← Другие способы связи</button>
        <label for="popup-name">Ваше имя</label>
        <input id="popup-name" name="name" type="text" autocomplete="name" autocapitalize="words" placeholder="Как к вам обращаться?" minlength="2" maxlength="80" required>
        <label for="popup-phone">Номер телефона</label>
        <input id="popup-phone" name="phone" type="tel" inputmode="tel" autocomplete="tel" placeholder="+375 XX XXX-XX-XX" aria-describedby="popup-phone-hint" maxlength="30" required>
        <p id="popup-phone-hint" class="contact-field-hint">Белорусский номер: +375 и 9 цифр.</p>
        <div class="honeypot" aria-hidden="true"><label>Сайт<input type="text" name="website" tabindex="-1" autocomplete="off"></label></div>
        <label class="consent"><input type="checkbox" name="consent" required><span>Соглашаюсь с <a href="${base}privacy-policy/" target="_blank" rel="noopener">политикой конфиденциальности</a> и обработкой имени и телефона для ответа на заявку.</span></label>
        <button class="button" type="submit">Отправить заявку</button>
        <p class="form-status" role="status" aria-live="polite"></p>
      </form>`;
    document.body.append(dialog);
    const title = dialog.querySelector('#contact-dialog-title');
    const choice = dialog.querySelector('.contact-dialog-choice');
    const form = dialog.querySelector('form');
    const status = form.querySelector('.form-status');
    const submit = form.querySelector('[type="submit"]');
    const nameField = form.elements.name;
    const phoneField = form.elements.phone;
    const cleanName = () => {
      const before = nameField.value.slice(0, nameField.selectionStart);
      const clean = value => normalizeName(value).replace(/[^\p{L}\p{M} '-]/gu, '');
      const cursor = clean(before).length;
      nameField.value = clean(nameField.value);
      nameField.setSelectionRange(cursor, cursor);
      nameField.setCustomValidity(nameField.value && !validName(nameField.value.trim()) ? nameError : '');
    };
    nameField.addEventListener('input', event => { if (!event.isComposing) cleanName(); });
    nameField.addEventListener('compositionend', cleanName);
    nameField.addEventListener('blur', () => {
      nameField.value = normalizeName(nameField.value).trim();
      nameField.setCustomValidity(nameField.value && !validName(nameField.value) ? nameError : '');
    });
    nameField.addEventListener('paste', event => {
      const text = normalizeName(event.clipboardData?.getData('text') || '');
      if (/[^\p{L}\p{M} '-]/u.test(text)) {
        event.preventDefault(); nameField.setCustomValidity(nameError); nameField.reportValidity();
      }
    });
    const maskPhone = (atEnd = false) => {
      const raw = phoneField.value;
      const national = nationalPhone(raw);
      if (national === null) {
        phoneField.setCustomValidity(phoneError);
        return;
      }
      const rawDigitsBeforeCursor = raw.slice(0, phoneField.selectionStart).replace(/\D/g, '').length;
      const allDigits = raw.replace(/\D/g, '');
      const prefix = phonePrefixLength(allDigits);
      const count = Math.max(0, rawDigitsBeforeCursor - prefix);
      phoneField.value = formatPhone(national);
      let cursor = 5;
      for (let found = 0; cursor < phoneField.value.length && found < count; cursor++) {
        if (/\d/.test(phoneField.value[cursor])) found++;
      }
      if (atEnd) cursor = phoneField.value.length;
      phoneField.setSelectionRange(cursor, cursor);
      phoneField.setCustomValidity(/^[1-9]\d{8}$/.test(national) ? '' : phoneError);
    };
    phoneField.addEventListener('focus', () => { if (!phoneField.value) { phoneField.value = '+375 '; phoneField.setSelectionRange(5, 5); } });
    phoneField.addEventListener('input', () => maskPhone());
    phoneField.addEventListener('blur', () => { if (phoneField.value.trim() === '+375') { phoneField.value = ''; phoneField.setCustomValidity(''); } });
    phoneField.addEventListener('paste', event => {
      event.preventDefault();
      const raw = (event.clipboardData?.getData('text') || '').trim();
      const national = nationalPhone(raw);
      const allDigits = raw.replace(/\D/g, '');
      if (national === null || allDigits.length > phonePrefixLength(allDigits) + 9) {
        phoneField.setCustomValidity(phoneError); phoneField.reportValidity(); return;
      }
      phoneField.value = formatPhone(national);
      maskPhone(true);
    });
    phoneField.addEventListener('beforeinput', event => {
      if (phoneField.selectionStart < 5 && phoneField.selectionEnd <= 5) {
        if (event.inputType.startsWith('delete')) { event.preventDefault(); return; }
        phoneField.setSelectionRange(5, 5);
      }
    });
    phoneField.addEventListener('keydown', event => {
      const start = phoneField.selectionStart;
      if (phoneField.selectionEnd !== start || !['Backspace', 'Delete'].includes(event.key)) return;
      if (event.key === 'Backspace' && start <= 5) { event.preventDefault(); return; }
      let digit = event.key === 'Backspace' ? start - 1 : start;
      const direction = event.key === 'Backspace' ? -1 : 1;
      while (digit >= 5 && digit < phoneField.value.length && !/\d/.test(phoneField.value[digit])) digit += direction;
      if (digit < 5 || digit >= phoneField.value.length) return;
      event.preventDefault();
      phoneField.setRangeText('', digit, digit + 1, 'start');
      maskPhone();
    });
    let lastTrigger;
    let interest = '';
    let opened = performance.now();
    let submitting = false;
    const showForm = show => {
      choice.hidden = show;
      form.hidden = !show;
      dialog.scrollTop = 0;
      if (show) form.elements.name.focus({preventScroll:true});
      else dialog.querySelector('.contact-dialog-form-link').focus({preventScroll:true});
    };
    dialog.querySelector('.contact-dialog-form-link').addEventListener('click', () => showForm(true));
    dialog.querySelector('.contact-dialog-back').addEventListener('click', () => showForm(false));
    dialog.querySelector('.contact-dialog-close').addEventListener('click', () => dialog.close());
    dialog.addEventListener('click', event => {
      if (event.target !== dialog) return;
      const rect = dialog.getBoundingClientRect();
      if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close();
    });
    dialog.addEventListener('close', () => {
      document.body.classList.remove('dialog-open');
      lastTrigger?.focus({preventScroll:true});
    });
    form.addEventListener('submit', async event => {
      event.preventDefault();
      if (submitting) return;
      nameField.value = normalizeName(nameField.value).trim();
      nameField.setCustomValidity(validName(nameField.value) ? '' : nameError);
      const national = nationalPhone(phoneField.value);
      phoneField.setCustomValidity(national !== null && /^[1-9]\d{8}$/.test(national) ? '' : phoneError);
      if (!form.reportValidity()) return;
      const fields = new FormData(form);
      const name = String(fields.get('name') || '').trim();
      const payload = {name,phone:'+375'+national,interest,page:location.pathname,consent:fields.get('consent') === 'on',website:String(fields.get('website') || ''),tts:Math.round((performance.now()-opened)/1000)};
      submitting = true; submit.disabled = true;
      status.className = 'form-status'; status.textContent = 'Отправляем заявку…';
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000);
      try {
        const response = await fetch(`${base}lead.php`, {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload),signal:controller.signal});
        const data = await response.json();
        if (!response.ok || !data.ok) throw new Error('Submission unavailable');
        status.className = 'form-status success';
        status.textContent = 'Спасибо! Заявка отправлена. Скоро свяжемся с вами.';
        form.reset();
        nameField.setCustomValidity(''); phoneField.setCustomValidity('');
        if (typeof window.fbq === 'function') window.fbq('track','Lead');
        if (typeof window.ym === 'function') window.ym(114134032,'reachGoal','lead_form');
      } catch (_) {
        status.className = 'form-status error';
        status.textContent = 'Не удалось отправить заявку. Данные сохранены в форме. Напишите нам в Telegram @Verto_digital или позвоните: +375 33 305-41-52.';
      } finally { clearTimeout(timeout); submitting = false; submit.disabled = false; }
    });
    return trigger => {
      lastTrigger = trigger;
      interest = trigger.dataset.interest || serviceInterest[requestedService] || trigger.dataset.popupTitle || 'Заявка с сайта';
      title.textContent = trigger.dataset.interest || trigger.dataset.popupTitle || 'Обсудим вашу задачу';
      if (!dialog.open) {
        opened = performance.now();
        choice.hidden = false; form.hidden = true;
        // Keep the delivery result when a request finishes after the dialog closes.
        if (!submitting && !form.elements.name.value) { status.textContent = ''; status.className = 'form-status'; }
        dialog.showModal(); document.body.classList.add('dialog-open');
      }
    };
  })();
  document.addEventListener('click', event => {
    const link = event.target.closest('a[href*="#contact"], a[data-interest]');
    if (!link || link.closest('.contact-dialog') || link.closest('.contact-form')) return;
    event.preventDefault(); contactPopup(link);
  });
})();
