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
  const newRequestId = () => Array.from(crypto.getRandomValues(new Uint8Array(16)), byte => byte.toString(16).padStart(2, '0')).join('');
  const contactAlternatives = `
    <div class="contact-alternatives">
      <p>Или свяжитесь с нами напрямую</p>
      <nav aria-label="Другие способы связи">
        <a href="tel:+375333054152" aria-label="Позвонить по номеру +375 33 305-41-52" title="+375 33 305-41-52"><svg class="contact-channel-icon contact-channel-phone" viewBox="0 0 24 24" aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2.12 4.2 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.12.96.36 1.9.7 2.79a2 2 0 0 1-.45 2.11L8.09 9.89a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.89.34 1.83.58 2.79.7A2 2 0 0 1 22 16.92Z"/></svg><span>Телефон</span></a>
        <a href="viber://chat?number=%2B375333054152"><svg aria-hidden="true" focusable="false" class="contact-channel-icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M11.4 0C9.473.028 5.333.344 3.02 2.467 1.302 4.187.696 6.7.633 9.817.57 12.933.488 18.776 6.12 20.36h.003l-.004 2.416s-.037.977.61 1.177c.777.242 1.234-.5 1.98-1.302.407-.44.972-1.084 1.397-1.58 3.85.326 6.812-.416 7.15-.525.776-.252 5.176-.816 5.892-6.657.74-6.02-.36-9.83-2.34-11.546-.596-.55-3.006-2.3-8.375-2.323 0 0-.395-.025-1.037-.017zm.058 1.693c.545-.004.88.017.88.017 4.542.02 6.717 1.388 7.222 1.846 1.675 1.435 2.53 4.868 1.906 9.897v.002c-.604 4.878-4.174 5.184-4.832 5.395-.28.09-2.882.737-6.153.524 0 0-2.436 2.94-3.197 3.704-.12.12-.26.167-.352.144-.13-.033-.166-.188-.165-.414l.02-4.018c-4.762-1.32-4.485-6.292-4.43-8.895.054-2.604.543-4.738 1.996-6.173 1.96-1.773 5.474-2.018 7.11-2.03zm.38 2.602c-.167 0-.303.135-.304.302 0 .167.133.303.3.305 1.624.01 2.946.537 4.028 1.592 1.073 1.046 1.62 2.468 1.633 4.334.002.167.14.3.307.3.166-.002.3-.138.3-.304-.014-1.984-.618-3.596-1.816-4.764-1.19-1.16-2.692-1.753-4.447-1.765zm-3.96.695c-.19-.032-.4.005-.616.117l-.01.002c-.43.247-.816.562-1.146.932-.002.004-.006.004-.008.008-.267.323-.42.638-.46.948-.008.046-.01.093-.007.14 0 .136.022.27.065.4l.013.01c.135.48.473 1.276 1.205 2.604.42.768.903 1.5 1.446 2.186.27.344.56.673.87.984l.132.132c.31.308.64.6.984.87.686.543 1.418 1.027 2.186 1.447 1.328.733 2.126 1.07 2.604 1.206l.01.014c.13.042.265.064.402.063.046.002.092 0 .138-.008.31-.036.627-.19.948-.46.004 0 .003-.002.008-.005.37-.33.683-.72.93-1.148l.003-.01c.225-.432.15-.842-.18-1.12-.004 0-.698-.58-1.037-.83-.36-.255-.73-.492-1.113-.71-.51-.285-1.032-.106-1.248.174l-.447.564c-.23.283-.657.246-.657.246-3.12-.796-3.955-3.955-3.955-3.955s-.037-.426.248-.656l.563-.448c.277-.215.456-.737.17-1.248-.217-.383-.454-.756-.71-1.115-.25-.34-.826-1.033-.83-1.035-.137-.165-.31-.265-.502-.297zm4.49.88c-.158.002-.29.124-.3.282-.01.167.115.312.282.324 1.16.085 2.017.466 2.645 1.15.63.688.93 1.524.906 2.57-.002.168.13.306.3.31.166.003.305-.13.31-.297.025-1.175-.334-2.193-1.067-2.994-.74-.81-1.777-1.253-3.05-1.346h-.024zm.463 1.63c-.16.002-.29.127-.3.287-.008.167.12.31.288.32.523.028.875.175 1.113.422.24.245.388.62.416 1.164.01.167.15.295.318.287.167-.008.295-.15.287-.317-.03-.644-.215-1.178-.58-1.557-.367-.378-.893-.574-1.52-.607h-.018z"/></svg><span>Viber</span></a>
        <a href="https://t.me/Verto_digital" target="_blank" rel="noopener"><svg aria-hidden="true" focusable="false" class="contact-channel-icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg><span>Telegram</span></a>
      </nav>
    </div>`;
  const setupLeadForm = (form, getInterest) => {
    form.insertAdjacentHTML('beforeend', contactAlternatives);
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
    let acceptedPhone = '';
    let phoneSelection = [5, 5];
    const maskPhone = (atEnd = false) => {
      const raw = phoneField.value;
      const national = nationalPhone(raw);
      if (national === null) {
        // Reject invalid edits, including autofill/drop/input events that bypass beforeinput.
        phoneField.value = acceptedPhone || '+375 ';
        phoneField.setSelectionRange(...phoneSelection);
        phoneField.setCustomValidity(/^[1-9]\d{8}$/.test(nationalPhone(phoneField.value) || '') ? '' : phoneError);
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
      acceptedPhone = phoneField.value;
      phoneSelection = [cursor, cursor];
    };
    phoneField.addEventListener('focus', () => { if (!phoneField.value) { phoneField.value = acceptedPhone = '+375 '; phoneField.setSelectionRange(5, 5); } });
    phoneField.addEventListener('input', () => maskPhone());
    phoneField.addEventListener('blur', () => { if (phoneField.value.trim() === '+375') { phoneField.value = acceptedPhone = ''; phoneField.setCustomValidity(''); } });
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
      phoneSelection = [phoneField.selectionStart, phoneField.selectionEnd];
      if (event.inputType === 'insertText' && event.data && /[^0-9]/.test(event.data)) {
        event.preventDefault(); return;
      }
      if (phoneField.selectionStart < 5 && phoneField.selectionEnd <= 5) {
        if (event.inputType.startsWith('delete')) { event.preventDefault(); return; }
        phoneField.setSelectionRange(5, 5);
      }
      if (event.inputType === 'insertText' && event.data) {
        const next = phoneField.value.slice(0, phoneField.selectionStart) + event.data + phoneField.value.slice(phoneField.selectionEnd);
        if (nationalPhone(next) === null) event.preventDefault();
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
    form.addEventListener('reset', () => { acceptedPhone = ''; phoneSelection = [5, 5]; });
    let opened = performance.now();
    let submitting = false;
    let requestId = newRequestId();
    let previousPayload = '';
    form.addEventListener('input', () => { if (!submitting) requestId = newRequestId(); });
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
      const interest = getInterest();
      const signature = JSON.stringify([name,national,interest]);
      if (previousPayload && previousPayload !== signature) requestId = newRequestId();
      previousPayload = signature;
      const payload = {name,phone:'+375'+national,interest,request_id:requestId,source:form.dataset.source || 'popup',page:location.pathname,consent:fields.get('consent') === 'on',website:String(fields.get('website') || ''),tts:Math.round((performance.now()-opened)/1000)};
      submitting = true; submit.disabled = true;
      status.className = 'form-status'; status.textContent = 'Отправляем заявку…';
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000);
      try {
        const response = await fetch(`${base}lead.php`, {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload),signal:controller.signal});
        const data = await response.json();
        if (!response.ok || !data.ok) throw new Error('Submission unavailable');
        status.className = 'form-status success';
        status.textContent = 'Спасибо! Заявка принята. Скоро свяжемся с вами.';
        form.reset();
        requestId = newRequestId();
        nameField.setCustomValidity(''); phoneField.setCustomValidity('');
        // Analytics must never turn an accepted application into a visible error.
        try { if (data.accepted !== false && typeof window.fbq === 'function') window.fbq('track','Lead'); } catch (_) {}
        try { if (data.accepted !== false && typeof window.ym === 'function') window.ym(114134032,'reachGoal','lead_form'); } catch (_) {}
      } catch (_) {
        status.className = 'form-status error';
        status.textContent = 'Не удалось отправить заявку. Проверьте соединение и попробуйте ещё раз — данные остались в форме. Напишите нам в Telegram @Verto_digital или позвоните: +375 33 305-41-52.';
      } finally { clearTimeout(timeout); submitting = false; submit.disabled = false; }
    });
    return {prepare() {
      opened = performance.now();
      if (!submitting && !nameField.value) { status.textContent = ''; status.className = 'form-status'; }
    }};
  };
  document.querySelectorAll('form[data-lead-form]').forEach(form => setupLeadForm(form, () => form.dataset.interest || 'Заявка с главной страницы'));
  const contactPopup = (() => {
    const dialog = document.createElement('dialog');
    dialog.className = 'contact-dialog';
    dialog.setAttribute('aria-labelledby', 'contact-dialog-title');
    dialog.innerHTML = `
      <div class="contact-dialog-bar">
        <div><p class="eyebrow">СВЯЗЬ С VERTO</p><h2 id="contact-dialog-title">Обсудим вашу задачу</h2></div>
        <button class="dialog-close contact-dialog-close" type="button" aria-label="Закрыть окно">✕</button>
      </div>
      <form class="contact-form lead-form contact-dialog-form" method="post" action="${base}lead.php" data-source="popup">
        <p class="lead-form-intro">Оставьте имя и номер — свяжемся с вами и обсудим детали.</p>
        <label for="popup-name">Ваше имя</label>
        <input id="popup-name" name="name" type="text" autocomplete="name" autocapitalize="words" placeholder="Как к вам обращаться?" minlength="2" maxlength="80" required>
        <label for="popup-phone">Номер телефона</label>
        <input id="popup-phone" name="phone" type="tel" inputmode="numeric" autocomplete="tel" placeholder="+375 XX XXX-XX-XX" aria-describedby="popup-phone-hint" minlength="17" maxlength="17" pattern="[+]375 [1-9][0-9] [0-9]{3}-[0-9]{2}-[0-9]{2}" required>
        <p id="popup-phone-hint" class="contact-field-hint">Белорусский номер: +375 и 9 цифр.</p>
        <div class="honeypot" aria-hidden="true"><label>Сайт<input type="text" name="website" tabindex="-1" autocomplete="off"></label></div>
        <label class="consent"><input type="checkbox" name="consent" required><span>Соглашаюсь с <a href="${base}privacy-policy/" target="_blank" rel="noopener">политикой конфиденциальности</a> и обработкой имени и телефона для ответа на заявку.</span></label>
        <button class="button" type="submit">Отправить заявку</button>
        <p class="form-status" role="status" aria-live="polite"></p>
      </form>`;
    document.body.append(dialog);
    const title = dialog.querySelector('#contact-dialog-title');
    const form = dialog.querySelector('form');
    let lastTrigger;
    let interest = '';
    const state = setupLeadForm(form, () => interest);
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
    return trigger => {
      lastTrigger = trigger;
      interest = trigger.dataset.interest || serviceInterest[requestedService] || trigger.dataset.popupTitle || 'Заявка с сайта';
      title.textContent = trigger.dataset.interest || trigger.dataset.popupTitle || 'Обсудим вашу задачу';
      if (!dialog.open) {
        state.prepare();
        dialog.showModal(); document.body.classList.add('dialog-open');
        dialog.scrollTop = 0;
        form.elements.name.focus({preventScroll:true});
      }
    };
  })();
  document.addEventListener('click', event => {
    const link = event.target.closest('a[href*="#contact"], a[data-interest]');
    if (!link || link.closest('.contact-dialog') || link.closest('.contact-form')) return;
    event.preventDefault(); contactPopup(link);
  });
  // Meta Pixel Lead on messenger buttons (Telegram, Viber), site-wide including the contact dialog.
  document.addEventListener('click', event => {
    const link = event.target.closest('a[href^="https://t.me/"], a[href^="viber:"]');
    if (!link || typeof window.fbq !== 'function') return;
    window.fbq('track','Lead',{content_name:link.href.startsWith('viber:') ? 'viber' : 'telegram'});
  });
})();
