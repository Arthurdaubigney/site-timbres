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

  var y = d.getElementById('annee');
  if (y) y.textContent = new Date().getFullYear();
})();
