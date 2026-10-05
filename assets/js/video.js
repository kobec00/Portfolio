/* ═══════════════════════════════════════════════════════════
   VIDEOGRAFIE — films, lightbox, hero-video en animaties.
   Films beheer je in de FILMS-lijst hieronder: voeg een object toe
   en de kaart, de tellers en de lightbox volgen automatisch.
   ═══════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  const FILMS = [
    // ── TROUWFILMS ──
    { id: '1aSgwH5nDEA', cat: 'wedding', title: 'Febe & Seppe', desc: 'De trouw van mijn zus. Mijn meest recente werk — warm en persoonlijk in beeld gebracht.', year: '2024', format: 'Trouwfilm', runtime: 'Sfeervideo', tags: ['Sfeer', 'Recentste werk'], size: 'wide' },
    { id: '4OBGTtQVUYo', cat: 'wedding', title: 'Ines & Sander', desc: 'Ceremonie en feest samengebracht tot één rustig, filmisch geheel.', year: '2021', format: 'Trouwfilm', runtime: 'Sfeervideo', tags: ['Sfeer', 'Ceremonie'], size: 'half' },
    { id: 'Q8kLe0-2gnc', cat: 'wedding', title: 'Caroline & Bram', desc: 'Mijn allereerste trouwfilm. Waar het allemaal begon.', year: '2019', format: 'Trouwfilm', runtime: 'Sfeervideo', tags: ['Eerste werk'], size: 'half' },
    // ── REISBEELDEN & PROJECTEN ──
    { id: 'LOpTFsjrGvw', cat: 'other', title: 'Lannoo — Kinderboek', desc: 'Stop-motion advertentie voor uitgeverij Lannoo. Frame voor frame opgebouwd.', year: '2021', format: 'Commercieel', runtime: 'Stop-motion', tags: ['Stop-motion', 'Commercieel'], size: 'feature' },
    { id: 's_slyU9heV4', cat: 'other', title: 'Louis Cornelis · 1936–2023', desc: 'Een mini-reportage over mijn grootvader. Een persoonlijk portret en het verhaal van een leven.', year: '2020', format: 'Reportage', runtime: 'Portret', tags: ['Reportage', 'Persoonlijk'], size: 'feature-r' },
    { id: 'PwpixmMHLhE', cat: 'other', title: 'The Smoky Mountains', desc: 'Sfeerbeelden uit Tennessee, gefilmd tijdens mijn uitwisseling. Natuur in 4K.', year: '2019', format: 'Reisfilm', runtime: '4K', tags: ['Reis', '4K', 'Natuur'], size: 'half' },
    { id: 'Aky2uWTmonw', cat: 'other', title: 'Schotland', desc: 'Een van mijn eerste reisvideo’s. Ruige landschappen en sfeerbeelden uit de Schotse Highlands.', year: '2018', format: 'Reisfilm', runtime: 'Sfeervideo', tags: ['Reis', 'Natuur', 'Vroeg werk'], size: 'half' },
    { id: 'WDYyBPZgw1M', cat: 'other', title: 'New York City', desc: 'Het ritme en de energie van de stad tijdens mijn WEP-uitwisseling.', year: '2018', format: 'Reisfilm', runtime: 'Stadsfilm', tags: ['Reis', 'Stad'], size: 'half' },
    { id: 'ZKUQl-iN1tE', cat: 'other', title: 'Euromillions Volley League', desc: 'Teaservideo met sportieve energie en een dynamische montage.', year: '2021', format: 'Teaser', runtime: 'Sport', tags: ['Teaser', 'Sport', 'Montage'], size: 'half' }
  ];

  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
  const root = document.documentElement;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const hasGSAP = !!(window.gsap && window.ScrollTrigger);
  if (hasGSAP) gsap.registerPlugin(ScrollTrigger);

  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const pad = n => String(n).padStart(2, '0');

  $$('[data-year]').forEach(el => { el.textContent = new Date().getFullYear(); });

  /* ───────── YouTube-thumbnail met nette fallback ───────── */
  function thumb(img, id) {
    const fallback = () => {
      if (img.dataset.fb) return;
      img.dataset.fb = '1';
      img.src = `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
    };
    // Geen HD-versie? Dan stuurt YouTube een grijs plaatje van 120×90.
    img.addEventListener('load', () => { if (img.naturalWidth <= 120) fallback(); });
    img.addEventListener('error', fallback);
    // Al geladen (≤120px) of al mislukt (naturalWidth 0) vóór de listeners er waren
    if (img.complete && img.naturalWidth <= 120) fallback();
  }
  $$('img[data-yt-fallback]').forEach(img => thumb(img, img.dataset.ytFallback));

  /* ───────── Films renderen ───────── */
  function renderFilm(f) {
    const el = document.createElement('article');
    el.className = `film film--${f.size}`;
    el.setAttribute('data-reveal', '');
    el.innerHTML = `
      <button class="film-frame" type="button" data-id="${esc(f.id)}" data-title="${esc(f.title)}"
        data-meta="${esc(`${f.year} · ${f.format} · ${f.runtime}`)}" data-cursor="Play" aria-label="Speel ${esc(f.title)} af">
        <img class="film-thumb" loading="lazy" decoding="async" alt="" src="https://i.ytimg.com/vi/${esc(f.id)}/maxresdefault.jpg">
        <span class="film-corner">${esc(f.year)} · ${esc(f.format)}</span>
        <span class="film-play" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg></span>
      </button>
      <div class="film-info">
        <div>
          <h3 class="film-title">${esc(f.title)}</h3>
          <p class="film-desc">${esc(f.desc)}</p>
          <ul class="tags">${f.tags.map(t => `<li>${esc(t)}</li>`).join('')}</ul>
        </div>
        <p class="film-meta"><b>${esc(f.year)}</b><span>${esc(f.format)}</span><br><span>${esc(f.runtime)}</span></p>
      </div>`;
    thumb($('.film-thumb', el), f.id);
    return el;
  }
  const grids = { wedding: $('#gridWedding'), other: $('#gridOther') };
  FILMS.forEach(f => { if (grids[f.cat]) grids[f.cat].appendChild(renderFilm(f)); });

  // Tellers volgen de lijst automatisch
  $$('[data-film-count]').forEach(el => { el.textContent = FILMS.length; el.dataset.count = FILMS.length; });
  $$('[data-count-for]').forEach(el => {
    const n = FILMS.filter(f => f.cat === el.dataset.countFor).length;
    el.textContent = `${pad(n)} ${n === 1 ? 'film' : 'films'}`;
  });

  /* ───────── Lightbox ───────── */
  const lb = $('#lightbox');
  const lbFrame = $('#lbFrame');
  let lastFocus = null;
  function openLB(btn) {
    lastFocus = btn;
    lbFrame.src = `https://www.youtube-nocookie.com/embed/${btn.dataset.id}?autoplay=1&rel=0&modestbranding=1`;
    lbFrame.title = `Video: ${btn.dataset.title}`;
    $('#lbTitle').textContent = btn.dataset.title;
    $('#lbMeta').textContent = btn.dataset.meta;
    if (typeof lb.showModal === 'function') lb.showModal();
    else { lb.setAttribute('open', ''); lb.classList.add('is-fallback'); }
    if (lenis) lenis.stop();
  }
  function onClosed() {
    lbFrame.src = 'about:blank';
    if (lenis) lenis.start();
    if (lastFocus) lastFocus.focus({ preventScroll: true });
  }
  function closeLB() {
    if (typeof lb.close === 'function') { if (lb.open) lb.close(); }
    else if (lb.hasAttribute('open')) { lb.removeAttribute('open'); lb.classList.remove('is-fallback'); onClosed(); }
  }
  // Native <dialog>: 'close' vuurt bij de knop, Escape en klik naast de video
  lb.addEventListener('close', onClosed);
  // Oude browsers zonder <dialog>: Escape zelf afhandelen
  if (typeof lb.showModal !== 'function') {
    document.addEventListener('keydown', e => { if (e.key === 'Escape') closeLB(); });
  }
  $('#lbClose').addEventListener('click', closeLB);
  // Klik naast de video sluit (niet bij de tweede klik van een dubbelklik op een filmkaart)
  lb.addEventListener('click', e => { if (e.target === lb && e.detail < 2) closeLB(); });
  document.addEventListener('click', e => {
    const btn = e.target.closest('.film-frame');
    if (btn) openLB(btn);
  });

  /* ───────── Smooth scroll ───────── */
  let lenis = null;
  if (!reduceMotion && window.Lenis) {
    lenis = new Lenis({ lerp: 0.1, smoothWheel: true });
    if (hasGSAP) {
      lenis.on('scroll', ScrollTrigger.update);
      gsap.ticker.add(t => lenis.raf(t * 1000));
      gsap.ticker.lagSmoothing(0);
    } else {
      const raf = t => { lenis.raf(t); requestAnimationFrame(raf); };
      requestAnimationFrame(raf);
    }
  }
  document.addEventListener('click', e => {
    const a = e.target.closest('a[href^="#"]');
    if (!a) return;
    const hash = a.getAttribute('href');
    const target = hash === '#top' ? 0 : (hash.length > 1 ? document.querySelector(hash) : null);
    if (target === null) return;
    e.preventDefault();
    if (lenis) lenis.scrollTo(target, { duration: 1.4, easing: t => 1 - Math.pow(1 - t, 4) });
    else if (target === 0) window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
    else target.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth' });
    // Toetsenbordfocus mee verplaatsen
    const focusEl = target === 0 ? $('#top') : target;
    if (focusEl) {
      if (!focusEl.hasAttribute('tabindex')) focusEl.setAttribute('tabindex', '-1');
      focusEl.focus({ preventScroll: true });
    }
  });

  /* ───────── Navigatie ───────── */
  const nav = $('#nav');
  let lastY = window.scrollY, ticking = false;
  window.addEventListener('scroll', () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      const y = window.scrollY;
      nav.classList.toggle('is-scrolled', y > 40);
      if (y > lastY + 4 && y > window.innerHeight * 0.6) nav.classList.add('is-hidden');
      else if (y < lastY - 4) nav.classList.remove('is-hidden');
      lastY = y;
      ticking = false;
    });
  }, { passive: true });

  /* ───────── Hero-achtergrondvideo: pas tonen als hij echt speelt ───────── */
  (function initHeroVideo() {
    const wrap = $('#heroVidWrap');
    const frame = $('#heroVid');
    if (!wrap || !frame) return;
    // Bij minder beweging of databesparing blijft de stilstaande Ken Burns-foto staan
    const saveData = navigator.connection && navigator.connection.saveData;
    const small = window.matchMedia('(max-width: 700px), (pointer: coarse) and (max-height: 500px)').matches;
    // Op gsm's toont YouTube eigen knoppen over de video en kost het data: daar volstaat de foto
    if (reduceMotion || saveData || small) { wrap.remove(); return; }
    frame.src = frame.dataset.src;
    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    document.head.appendChild(tag);
    window.onYouTubeIframeAPIReady = function () {
      try {
        new YT.Player('heroVid', {
          events: {
            onStateChange: e => { if (e.data === YT.PlayerState.PLAYING) wrap.classList.add('is-playing'); },
            onError: () => wrap.classList.remove('is-playing')
          }
        });
      } catch (err) { /* de foto blijft staan */ }
    };
  })();

  /* ───────── Linten achter de outro ───────── */
  let outroRibbons = null;
  if (window.Ribbons) {
    const c = $('#outroRibbons');
    try {
      outroRibbons = new Ribbons(c, {
        still: reduceMotion, seed: 4.1, gain: 0.8, speed: 0.85, tilt: 0.25,
        maxPixels: finePointer ? 1400000 : 480000,
        focus: window.innerWidth < 700 ? [0.55, 0.2] : [0.78, 0.45]
      });
    } catch (err) { c.remove(); }
  }

  /* ───────── Cursor-label & magnetische knoppen ───────── */
  if (finePointer) {
    const cursor = $('.cursor');
    const label = $('.cursor-label', cursor);
    let x = 0, y = 0, cx = 0, cy = 0, running = false;
    const loop = () => {
      cx += (x - cx) * 0.2;
      cy += (y - cy) * 0.2;
      cursor.style.translate = `${cx}px ${cy}px`;
      if (Math.abs(cx - x) > 0.1 || Math.abs(cy - y) > 0.1) requestAnimationFrame(loop);
      else running = false;
    };
    window.addEventListener('pointermove', e => {
      x = e.clientX; y = e.clientY;
      if (!running) { running = true; requestAnimationFrame(loop); }
    }, { passive: true });
    document.addEventListener('pointerover', e => {
      const t = e.target.closest('[data-cursor]');
      if (t) { label.textContent = t.dataset.cursor; cursor.classList.add('is-active'); }
    });
    document.addEventListener('pointerout', e => {
      const t = e.target.closest('[data-cursor]');
      if (t && !t.contains(e.relatedTarget)) cursor.classList.remove('is-active');
    });
  }
  $$('.btn').forEach(btn => {
    const setOrigin = e => {
      const r = btn.getBoundingClientRect();
      btn.style.setProperty('--x', `${e.clientX - r.left}px`);
      btn.style.setProperty('--y', `${e.clientY - r.top}px`);
    };
    btn.addEventListener('pointerenter', setOrigin);
    btn.addEventListener('pointerleave', setOrigin);
  });
  if (finePointer && hasGSAP && !reduceMotion) {
    $$('[data-magnetic]').forEach(el => {
      const xTo = gsap.quickTo(el, 'x', { duration: 0.6, ease: 'power3' });
      const yTo = gsap.quickTo(el, 'y', { duration: 0.6, ease: 'power3' });
      el.addEventListener('pointermove', e => {
        const r = el.getBoundingClientRect();
        xTo((e.clientX - r.left - r.width / 2) * 0.28);
        yTo((e.clientY - r.top - r.height / 2) * 0.38);
      });
      el.addEventListener('pointerleave', () => { xTo(0); yTo(0); });
    });
  }

  /* ───────── Animaties ───────── */
  function splitWords(el) {
    const words = [];
    const walk = node => {
      Array.from(node.childNodes).forEach(child => {
        if (child.nodeType === Node.TEXT_NODE) {
          const frag = document.createDocumentFragment();
          child.textContent.split(/(\s+)/).forEach(part => {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(' ')); return; }
            const outer = document.createElement('span');
            outer.className = 'w';
            const inner = document.createElement('span');
            inner.className = 'wi';
            inner.textContent = part;
            outer.appendChild(inner);
            frag.appendChild(outer);
            words.push(inner);
          });
          child.replaceWith(frag);
        } else if (child.nodeType === Node.ELEMENT_NODE && child.tagName !== 'BR') {
          walk(child);
        }
      });
    };
    walk(el);
    el.classList.add('is-split');
    return words;
  }

  // Teller in de hero
  function countUp(el) {
    const target = parseInt(el.dataset.count, 10);
    if (reduceMotion || !target) return;
    const t0 = performance.now(), dur = 1400;
    const step = now => {
      const t = Math.min((now - t0) / dur, 1);
      el.textContent = Math.round((1 - Math.pow(1 - t, 4)) * target);
      if (t < 1) requestAnimationFrame(step);
    };
    el.textContent = '0';
    requestAnimationFrame(step);
  }

  const heroTitle = $('[data-hero-split]');
  const heroWords = heroTitle ? splitWords(heroTitle) : [];

  if (!hasGSAP || reduceMotion) {
    root.classList.add('is-ready');
    return;
  }

  root.classList.add('has-gsap');
  gsap.set(heroWords, { yPercent: 115 });
  gsap.set('.vhero [data-intro]', { opacity: 0 });

  const intro = () => {
    gsap.timeline({ defaults: { ease: 'expo.out' }, delay: 0.1 })
      .to(heroWords, { yPercent: 0, duration: 1.5, stagger: 0.08 }, 0)
      .fromTo('.vhero [data-intro]', { y: 24, opacity: 0 }, { y: 0, opacity: 1, duration: 1.2, stagger: 0.1 }, 0.45)
      .fromTo(nav, { opacity: 0 }, { opacity: 1, duration: 1.2, ease: 'power2.out', clearProps: 'opacity' }, 0.5)
      .add(() => $$('.vhero [data-count]').forEach(countUp), 0.7);
  };
  if (document.fonts && document.fonts.ready) {
    Promise.race([document.fonts.ready, new Promise(r => setTimeout(r, 1200))]).then(intro);
  } else intro();

  $$('[data-split]').forEach(el => {
    const words = splitWords(el);
    gsap.fromTo(words, { yPercent: 115 }, {
      yPercent: 0, duration: 1.3, ease: 'expo.out', stagger: 0.07,
      scrollTrigger: { trigger: el, start: 'top 88%', once: true }
    });
  });

  gsap.set('[data-reveal]', { opacity: 0, y: 50 });
  ScrollTrigger.batch('[data-reveal]', {
    start: 'top 92%',
    once: true,
    onEnter: batch => gsap.to(batch, { y: 0, opacity: 1, duration: 1.2, ease: 'expo.out', stagger: 0.1, overwrite: true })
  });

  // Hero: tekst glijdt weg, beeld zoomt licht in
  gsap.to('.vhero-inner', {
    yPercent: -12, opacity: 0.2, ease: 'none',
    scrollTrigger: { trigger: '.vhero', start: 'top top', end: 'bottom top', scrub: true }
  });
  gsap.to('.vhero-still, .vhero-video', {
    scale: 1.1, ease: 'none',
    scrollTrigger: { trigger: '.vhero', start: 'top top', end: 'bottom top', scrub: true }
  });

  if (outroRibbons) {
    ScrollTrigger.create({
      trigger: '.voutro', start: 'top bottom', end: 'top top', scrub: true,
      onUpdate: self => outroRibbons.setGain(0.15 + self.progress * 0.6)
    });
  }

  const refresh = () => ScrollTrigger.refresh();
  if (document.fonts) document.fonts.ready.then(refresh);
  window.addEventListener('load', refresh);
})();
