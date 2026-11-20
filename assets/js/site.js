(function () {
  var d = document;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Header : fond au défilement (toujours opaque sur pages sans hero sombre) */
  var header = d.getElementById('header');
  function onScroll() {
    var scrolled = window.scrollY > 24;
    header.classList.toggle('bg-nuit-950/90', scrolled);
    header.classList.toggle('backdrop-blur-md', scrolled);
    header.classList.toggle('border-white/10', scrolled);
    header.classList.toggle('border-transparent', !scrolled);
  }
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  /* Menu mobile */
  var btn = d.getElementById('menu-btn');
  var menu = d.getElementById('menu-mobile');
  function setMenu(open) {
    menu.classList.toggle('hidden', !open);
    btn.setAttribute('aria-expanded', String(open));
    btn.setAttribute('aria-label', open ? 'Fermer le menu' : 'Ouvrir le menu');
    d.getElementById('ico-open').classList.toggle('hidden', open);
    d.getElementById('ico-close').classList.toggle('hidden', !open);
    header.classList.toggle('bg-nuit-950', open);
  }
  btn.addEventListener('click', function () { setMenu(btn.getAttribute('aria-expanded') !== 'true'); });
  menu.querySelectorAll('a').forEach(function (a) { a.addEventListener('click', function () { setMenu(false); }); });
  d.addEventListener('keydown', function (e) { if (e.key === 'Escape') setMenu(false); });

  /* Hero : révélation en cascade (transitions.dev — texts reveal) */
  var heroCopy = d.getElementById('hero-copy');
  if (heroCopy) requestAnimationFrame(function () { requestAnimationFrame(function () { heroCopy.classList.add('is-shown'); }); });

  /* Révélation au défilement */
  var items = d.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && !reduce) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    items.forEach(function (el) { io.observe(el); });
  } else {
    items.forEach(function (el) { el.classList.add('is-in'); });
  }

  /* Accordéon FAQ (transitions.dev — accordion) */
  d.querySelectorAll('.t-acc').forEach(function (acc) {
    var head = acc.querySelector('.t-acc-head');
    head.addEventListener('click', function () {
      var open = acc.getAttribute('data-open') === 'true';
      acc.setAttribute('data-open', String(!open));
      head.setAttribute('aria-expanded', String(!open));
    });
  });

  /* Barre CTA mobile : visible après le hero, masquée sur le formulaire */
  var bar = d.getElementById('mobile-cta');
  var hero = d.querySelector('[data-hero]');
  var form = d.getElementById('formulaire');
  if (bar && 'IntersectionObserver' in window) {
    var heroOut = !hero, formIn = false;
    function syncBar() { bar.classList.toggle('translate-y-full', !(heroOut && !formIn)); }
    if (hero) new IntersectionObserver(function (e) { heroOut = !e[0].isIntersecting; syncBar(); }).observe(hero);
    if (form) new IntersectionObserver(function (e) { formIn = e[0].isIntersecting; syncBar(); }, { threshold: 0.05 }).observe(form);
    syncBar();
  }

  /* Bandeau défilant : bouton pause (WCAG 2.2.2) */
  var mt = d.getElementById('marquee-toggle');
  if (mt) {
    var mq = mt.closest('section').querySelector('.marquee');
    mt.addEventListener('click', function () {
      var paused = mq.classList.toggle('is-paused');
      mt.setAttribute('aria-pressed', String(paused));
      mt.textContent = paused ? 'Reprendre le défilement' : 'Mettre le défilement en pause';
    });
  }

  /* Tally : redirection vers /merci une fois le formulaire envoyé */
  window.addEventListener('message', function (e) {
    if (e.origin !== 'https://tally.so') return;
    var data = e.data;
    try { if (typeof data === 'string') data = JSON.parse(data); } catch (_) { return; }
    if (data && data.event === 'Tally.FormSubmitted') window.location.href = '/merci';
  });

  /* Bandeau de consentement aux cookies (Google Consent Mode v2, mode avancé).
     Le consentement est refusé par défaut (script du <head>) ; le choix est mémorisé 6 mois. */
  var banner = d.getElementById('consent-banner');
  if (banner) {
    var KEY = 'ep_consent';
    var SIX_MONTHS = 15778800000;
    var root = d.documentElement;
    function setConsent(value) {
      var state = value === 'granted' ? 'granted' : 'denied';
      gtag('consent', 'update', {
        ad_storage: state,
        ad_user_data: state,
        ad_personalization: state,
        analytics_storage: state
      });
    }
    function readChoice() {
      try {
        var c = JSON.parse(localStorage.getItem(KEY) || 'null');
        if (c && (c.v === 'granted' || c.v === 'denied') && Date.now() - c.t < SIX_MONTHS) return c.v;
        localStorage.removeItem(KEY);
      } catch (e) {}
      return null;
    }
    function saveChoice(v) {
      try { localStorage.setItem(KEY, JSON.stringify({ v: v, t: Date.now() })); } catch (e) {}
    }
    function reserveSpace() {
      root.style.setProperty('--consent-h', banner.offsetHeight + 'px');
    }
    function openBanner() {
      banner.hidden = false;
      root.setAttribute('data-consent-visible', '');
      reserveSpace();
    }
    function closeBanner() {
      banner.hidden = true;
      root.removeAttribute('data-consent-visible');
      root.style.removeProperty('--consent-h');
    }
    function choose(v) {
      setConsent(v);
      saveChoice(v);
      closeBanner();
    }
    d.getElementById('consent-accept').addEventListener('click', function () { choose('granted'); });
    d.getElementById('consent-refuse').addEventListener('click', function () { choose('denied'); });
    d.querySelectorAll('[data-consent-open]').forEach(function (b) { b.addEventListener('click', openBanner); });
    window.addEventListener('resize', function () { if (!banner.hidden) reserveSpace(); });
    if (readChoice() === null) openBanner();
  }

  var y = d.getElementById('annee');
  if (y) y.textContent = new Date().getFullYear();
})();
