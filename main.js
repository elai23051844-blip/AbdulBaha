/* Абдул-Баха · День Завета — приглашение */
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

  /* Молитва → история жизни */
  var veil = $('#prayer-veil');
  var veilContinue = $('#veil-continue');
  var prayerEl = $('#veil-prayer');
  var PRAYER = 'О Боже, руководи мной, храни меня, сделай меня светильником ярким и лучезарной звездой. Ты Могуществен и Силён.';

  function typePrayer(done) {
    if (!prayerEl) { if (done) done(); return; }
    var p = prayerEl.querySelector('p');
    if (!p) { if (done) done(); return; }
    if (reduceMotion) {
      p.textContent = PRAYER;
      if (done) done();
      return;
    }
    p.textContent = '';
    prayerEl.classList.add('is-typing');
    var i = 0;
    var timer = setInterval(function () {
      i += 1;
      p.textContent = PRAYER.slice(0, i);
      if (i >= PRAYER.length) {
        clearInterval(timer);
        prayerEl.classList.remove('is-typing');
        if (done) done();
      }
    }, 28);
  }

  function openVeil() {
    if (!veil) {
      location.href = 'life.html';
      return;
    }
    veil.hidden = false;
    veil.setAttribute('aria-hidden', 'false');
    doc.body.classList.add('veil-lock');
    requestAnimationFrame(function () {
      veil.classList.add('is-on');
      typePrayer(null);
    });
  }

  function goToLife() {
    if (!veil) {
      location.href = 'life.html';
      return;
    }
    veil.classList.add('is-leaving');
    veil.classList.remove('is-on');
    setTimeout(function () {
      location.href = 'life.html';
    }, reduceMotion ? 0 : 900);
  }

  if (veilContinue) {
    veilContinue.addEventListener('click', goToLife);
  }

  /* RSVP + молитвенный путь */
  (function rsvp() {
    var buttons = $$('.js-rsvp');
    if (!buttons.length) { return; }

    var meta = $('meta[name="api-base"]');
    var API_BASE = ((meta && meta.getAttribute('content')) || '').replace(/\/+$/, '');
    var API_URL = API_BASE + '/api/rsvp';
    var statusEl = $('#rsvp-status');
    var busy = false;

    function setStatus(text) {
      if (statusEl) { statusEl.textContent = text || ''; }
    }

    function notifyThenVeil(source) {
      setStatus('Открываем молитву…');
      openVeil();

      if (!window.fetch) { return; }
      fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          message: 'Я приду',
          source: source || 'page',
          event: 'День Завета · 26 ноября · 19:00'
        })
      }).catch(function () { /* на GitHub Pages API нет — это нормально */ });
    }

    function send(source) {
      if (busy) { return; }
      busy = true;
      buttons.forEach(function (btn) { btn.disabled = true; });
      toast('Я приду…');
      notifyThenVeil(source);
      setTimeout(function () {
        busy = false;
        buttons.forEach(function (btn) { btn.disabled = false; });
      }, 1200);
    }

    buttons.forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        send(btn.getAttribute('data-source') || 'page');
      });
    });
  })();
})();
