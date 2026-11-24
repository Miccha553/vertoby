(function () {
  // Конец акции: 30 ноября 2026, 23:59:59 по Минску (UTC+3, без перехода на летнее время).
  var DEADLINE = Date.parse('2026-11-30T23:59:59+03:00');
  // Всего мест в акции и сколько осталось. Меняйте SPOTS_LEFT вручную по реальному числу принятых заявок.
  var SPOTS_TOTAL = 15;
  var SPOTS_LEFT = 11;

  var root = document.documentElement;
  var q = function (s) { return document.querySelector(s); };
  var pad = function (n) { return n < 10 ? '0' + n : String(n); };

  var spots = Math.max(0, Math.min(SPOTS_TOTAL, SPOTS_LEFT));
  var spotsEl = q('[data-promo-spots]');
  if (spotsEl) spotsEl.textContent = spots;
  document.querySelectorAll('[data-promo-spots-inline]').forEach(function (el) { el.textContent = spots; });
  var bar = q('[data-promo-spots-bar]');
  if (bar) bar.style.width = (spots / SPOTS_TOTAL * 100) + '%';

  function end() { root.classList.add('promo-ended'); }
  if (spots === 0) end();

  var d = q('[data-promo-days]'), h = q('[data-promo-hours]'), m = q('[data-promo-minutes]'), s = q('[data-promo-seconds]');
  function tick() {
    var left = DEADLINE - Date.now();
    if (left <= 0) {
      end();
      return false;
    }
    var sec = Math.floor(left / 1000);
    if (d) d.textContent = Math.floor(sec / 86400);
    if (h) h.textContent = pad(Math.floor(sec % 86400 / 3600));
    if (m) m.textContent = pad(Math.floor(sec % 3600 / 60));
    if (s) s.textContent = pad(sec % 60);
    return true;
  }
  if (!root.classList.contains('promo-ended') && tick()) {
    var timer = setInterval(function () { if (!tick()) clearInterval(timer); }, 1000);
  }
})();
