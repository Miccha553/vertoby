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
      fullImage.src = `${base}portfolio/images%20cases/${id}.png`;
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

  const contactPopup = (() => {
    const dialog = document.createElement('dialog');
    dialog.className = 'contact-dialog';
    dialog.innerHTML = `
      <div class="contact-dialog-bar">
        <div><p class="eyebrow">СВЯЗЬ С VERTO</p><h2 id="contact-dialog-title">Обсудим вашу задачу</h2></div>
        <button class="dialog-close contact-dialog-close" type="button" aria-label="Закрыть окно">✕</button>
      </div>
      <p class="contact-dialog-lead">Выберите удобный способ связи — ответим и уточним задачу.</p>
      <div class="contact-dialog-options">
        <a class="contact-dialog-option" href="tel:+375333054152"><span class="contact-dialog-option-icon" aria-hidden="true">☎</span><span><strong>Позвонить</strong><small>+375 33 305-41-52</small></span><span aria-hidden="true">↗</span></a>
        <a class="contact-dialog-option" href="https://t.me/Verto_digital" target="_blank" rel="noopener"><span class="contact-dialog-option-icon" aria-hidden="true">↗</span><span><strong>Telegram</strong><small>@Verto_digital</small></span><span aria-hidden="true">↗</span></a>
        <a class="contact-dialog-option" href="viber://chat?number=%2B375333054152"><span class="contact-dialog-option-icon" aria-hidden="true">✦</span><span><strong>Viber</strong><small>Написать по номеру телефона</small></span><span aria-hidden="true">↗</span></a>
      </div>
      <button class="contact-dialog-form-link" type="button">Оставить заявку через форму</button>`;
    document.body.append(dialog);
    const title = dialog.querySelector('#contact-dialog-title');
    const formLink = dialog.querySelector('.contact-dialog-form-link');
    let lastTrigger;
    const close = () => dialog.close();
    formLink.addEventListener('click', () => {
      close();
      document.getElementById('contact')?.scrollIntoView({behavior:'smooth', block:'start'});
      window.setTimeout(() => document.getElementById('contact-name')?.focus({preventScroll:true}), 450);
    });
    dialog.querySelector('.contact-dialog-close').addEventListener('click', close);
    dialog.addEventListener('click', event => { if (event.target === dialog) close(); });
    dialog.addEventListener('close', () => { document.body.classList.remove('dialog-open'); lastTrigger?.focus({preventScroll:true}); });
    return trigger => {
      lastTrigger = trigger;
      title.textContent = trigger.dataset.interest || trigger.dataset.popupTitle || 'Обсудим вашу задачу';
      if (!dialog.open) { dialog.showModal(); document.body.classList.add('dialog-open'); }
    };
  })();
  document.addEventListener('click', event => {
    const link = event.target.closest('a[href*="#contact"], a[data-interest]');
    if (!link || link.closest('.contact-dialog') || link.closest('.contact-form')) return;
    event.preventDefault();
    contactPopup(link);
  });

  document.querySelectorAll('[data-interest]').forEach(link => link.addEventListener('click', () => {
    const task = document.getElementById('contact-task');
    if (task && !task.value.trim()) task.value = link.dataset.interest;
  }));
  const form = document.getElementById('contact-form');
  const serviceInterest = {
    sites: 'Хочу обсудить создание сайта',
    ads: 'Хочу обсудить запуск и ведение рекламы',
    smm: 'Хочу обсудить SMM и контент',
    seo: 'Хочу обсудить SEO-аудит и внедрение правок',
    ai: 'Хочу обсудить внедрение ИИ в бизнес'
  };
  const requestedService = new URLSearchParams(location.search).get('service');
  const taskField = document.getElementById('contact-task');
  if (taskField && requestedService && Object.prototype.hasOwnProperty.call(serviceInterest, requestedService) && !taskField.value.trim()) {
    taskField.value = serviceInterest[requestedService];
  }
  form?.addEventListener('submit', async event => {
    event.preventDefault();
    const status = document.getElementById('form-status');
    const submit = form.querySelector('button[type=submit]');
    const fields = new FormData(form);
    const name = String(fields.get('name') || '').trim();
    let digits = String(fields.get('phone') || '').replace(/\D/g, '');
    if (digits.length === 9) digits = '375' + digits;
    status.className = 'form-status error';
    if (!name) { status.textContent = 'Пожалуйста, укажите ваше имя.'; document.getElementById('contact-name').focus(); return; }
    if (!/^375\d{9}$/.test(digits)) { status.textContent = 'Проверьте номер: +375 и 9 цифр, например +375 29 123-45-67.'; document.getElementById('contact-phone').focus(); return; }
    const phone = `+375 ${digits.slice(3,5)} ${digits.slice(5,8)} ${digits.slice(8,10)} ${digits.slice(10,12)}`;
    const payload = {name,phone,additional:String(fields.get('additional') || '').trim(),niche:'',design:'',budget:'',deadline:'',files:[],lang:'ru',page:location.pathname,website:String(fields.get('website') || ''),tts:Math.round((performance.now()-started)/1000)};
    status.className = 'form-status'; status.textContent = 'Отправляем заявку…'; submit.disabled = true;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);
    try {
      const response = await fetch(`${base}backend.php?action=submit_brief`, {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload),signal:controller.signal});
      const data = await response.json();
      if (!response.ok || !data.ok) throw new Error('Submission unavailable');
      status.className = 'form-status success'; status.textContent = 'Спасибо! Заявка отправлена. Свяжемся с вами, чтобы обсудить детали.';
      form.reset();
      if (typeof window.fbq === 'function') window.fbq('track','Lead',{source:'contact_form'});
    } catch (_) {
      status.className = 'form-status error'; status.textContent = 'Не удалось отправить заявку. Ваш текст сохранён в форме. Напишите нам в Telegram или позвоните: +375 33 305-41-52.';
    } finally { clearTimeout(timeout); submit.disabled = false; }
  });

  // Existing production pixel; local previews never send analytics events.
  if (location.hostname === 'wizardproduction.by' || location.hostname === 'www.wizardproduction.by') {
    const fbq = window.fbq || function(){ fbq.callMethod ? fbq.callMethod.apply(fbq, arguments) : fbq.queue.push(arguments); };
    if (!window.fbq) { window.fbq = fbq; window._fbq = fbq; fbq.queue = []; fbq.loaded = true; fbq.version = '2.0'; const script = document.createElement('script'); script.async = true; script.src = 'https://connect.facebook.net/en_US/fbevents.js'; document.head.appendChild(script); }
    fbq('init','1095729950283973'); fbq('track','PageView');
    document.addEventListener('click', event => { const link = event.target.closest('a'); if (link?.href.startsWith('tel:')) fbq('track','Contact',{method:'phone'}); else if (link?.href.startsWith('https://t.me/')) fbq('track','Contact',{method:'telegram'}); });
  }
})();
