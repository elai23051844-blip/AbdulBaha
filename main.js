/* Абдул-Баха · День Завета — приглашение
   Без сборки: работает с диска и на Vercel. */
(function () {
  'use strict';

  if (window.__rv) { clearTimeout(window.__rv); }

  var doc = document;
  function $(s, r) { return (r || doc).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || doc).querySelectorAll(s)); }
  var reduceMotion = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

  var toastEl = $('#toast');
  var toastTimer = 0;
  function toast(text) {
    if (!toastEl) { return; }
    toastEl.textContent = text;
    toastEl.classList.add('is-on');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.classList.remove('is-on'); }, 4200);
  }

  /* Звёзды */
  (function stars() {
    var sky = $('#stars');
    if (!sky) { return; }
    var n = window.innerWidth < 700 ? 48 : 96;
    var frag = doc.createDocumentFragment();
    for (var i = 0; i < n; i++) {
      var s = doc.createElement('i');
      var bright = Math.random() < 0.12;
      var size = bright ? 2.4 + Math.random() * 1.2 : 1 + Math.random() * 1.3;
      var dx = ((Math.random() * 2 - 1) * (18 + Math.random() * 28)).toFixed(1) + 'px';
      var dy = ((Math.random() * 2 - 1) * (14 + Math.random() * 36)).toFixed(1) + 'px';
      s.style.left = (Math.random() * 100).toFixed(2) + '%';
      s.style.top = (Math.pow(Math.random(), 1.5) * 82).toFixed(2) + '%';
      s.style.width = s.style.height = size.toFixed(2) + 'px';
      s.style.setProperty('--d', (3 + Math.random() * 5).toFixed(2) + 's');
      s.style.setProperty('--l', (-Math.random() * 8).toFixed(2) + 's');
      s.style.setProperty('--drift', (22 + Math.random() * 40).toFixed(1) + 's');
      s.style.setProperty('--dx', dx);
      s.style.setProperty('--dy', dy);
      if (bright) { s.className = 'b'; }
      frag.appendChild(s);
    }
    sky.appendChild(frag);
  })();

  /* Nav */
  (function nav() {
    var bar = $('.nav');
    if (!bar) { return; }
    var busy = false;
    function update() {
      busy = false;
      bar.classList.toggle('is-scrolled', (window.pageYOffset || doc.documentElement.scrollTop) > 24);
    }
    window.addEventListener('scroll', function () {
      if (!busy) { busy = true; requestAnimationFrame(update); }
    }, { passive: true });
    update();
  })();

  /* Reveal */
  (function reveal() {
    var items = $$('.reveal');
    function showAll() { items.forEach(function (el) { el.classList.add('is-in'); }); }
    if (reduceMotion || !('IntersectionObserver' in window)) { showAll(); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          en.target.classList.add('is-in');
          io.unobserve(en.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    items.forEach(function (el) { io.observe(el); });
  })();

  /* RSVP → Telegram */
  (function rsvp() {
    var buttons = $$('.js-rsvp');
    if (!buttons.length) { return; }

    var meta = $('meta[name="api-base"]');
    var API_BASE = ((meta && meta.getAttribute('content')) || '').replace(/\/+$/, '');
    var API_URL = API_BASE + '/api/rsvp';
    var statusEl = $('#rsvp-status');
    var busy = false;
    var done = false;

    function setStatus(text) {
      if (statusEl) { statusEl.textContent = text || ''; }
    }

    function setBusy(on) {
      busy = on;
      buttons.forEach(function (btn) {
        btn.disabled = on || done;
        if (done) { btn.textContent = 'До встречи'; }
      });
    }

    function send(source) {
      if (busy || done) { return; }
      if (!window.fetch) {
        toast('Откройте страницу в современном браузере');
        return;
      }
      setBusy(true);
      setStatus('Отправляем…');

      fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          message: 'Я приду',
          source: source || 'page',
          event: 'День Завета · 26 ноября · 19:00'
        })
      })
        .then(function (res) {
          return res.json().then(function (data) {
            return { ok: res.ok, data: data };
          }).catch(function () {
            return { ok: res.ok, data: {} };
          });
        })
        .then(function (result) {
          if (result.ok && result.data && result.data.ok !== false) {
            done = true;
            setBusy(false);
            setStatus('Спасибо. Мы будем вас ждать.');
            toast('Принято — до встречи 26 ноября');
            return;
          }
          var err = (result.data && (result.data.error || result.data.description)) || 'Не удалось отправить';
          setBusy(false);
          setStatus(err);
          toast(err);
        })
        .catch(function () {
          setBusy(false);
          setStatus('Нет связи с сервером. Попробуйте ещё раз.');
          toast('Нет связи с сервером');
        });
    }

    buttons.forEach(function (btn) {
      btn.addEventListener('click', function () {
        send(btn.getAttribute('data-source') || 'page');
      });
    });
  })();
})();
