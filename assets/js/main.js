/* ═══════════════════════════════════════════════════════════
   KOBE CORNELIS — PORTFOLIO · interactie & animatie
   Werkt progressief: zonder GSAP/Lenis blijft alles leesbaar
   en bruikbaar, mét krijg je de volledige ervaring.
   ═══════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
  const root = document.documentElement;
  const body = document.body;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const hasGSAP = !!(window.gsap && window.ScrollTrigger);

  if (hasGSAP) gsap.registerPlugin(ScrollTrigger);

  /* ───────── Kleine helpers ───────── */
  const clamp = (v, a, b) => Math.min(Math.max(v, a), b);
  const lerp = (a, b, t) => a + (b - a) * t;

  function splitWords(el, mask) {
    const words = [];
    const walk = node => {
      Array.from(node.childNodes).forEach(child => {
        if (child.nodeType === Node.TEXT_NODE) {
          const frag = document.createDocumentFragment();
          child.textContent.split(/(\s+)/).forEach(part => {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(' ')); return; }
            const inner = document.createElement('span');
            inner.className = mask ? 'wi' : 'sw';
            inner.textContent = part;
            if (mask) {
              const outer = document.createElement('span');
              outer.className = 'w';
              outer.appendChild(inner);
              frag.appendChild(outer);
            } else {
              frag.appendChild(inner);
            }
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

  function splitChars(el) {
    const text = el.textContent;
    el.textContent = '';
    return Array.from(text).map(ch => {
      const s = document.createElement('span');
      s.className = 'ch';
      s.textContent = ch;
      el.appendChild(s);
      return s;
    });
  }

  function loadScript(src, integrity) {
    return new Promise((resolve, reject) => {
      const s = document.createElement('script');
      if (integrity) { s.integrity = integrity; s.crossOrigin = 'anonymous'; }
      s.src = src;
      s.async = true;
      s.onload = resolve;
      s.onerror = reject;
      document.head.appendChild(s);
    });
  }

  /* ───────── Leeftijd en jaartal ───────── */
  (function initMeta() {
    const birth = new Date(2000, 4, 26);
    const now = new Date();
    let age = now.getFullYear() - birth.getFullYear();
    if (now < new Date(now.getFullYear(), birth.getMonth(), birth.getDate())) age--;
    $$('[data-age]').forEach(el => { el.textContent = age; });
    $$('[data-year]').forEach(el => { el.textContent = now.getFullYear(); });
  })();

  /* ───────── Smooth scroll (Lenis) ───────── */
  let lenis = null;
  if (!reduceMotion && window.Lenis) {
    lenis = new Lenis({ lerp: 0.1, wheelMultiplier: 1, smoothWheel: true });
    if (hasGSAP) {
      lenis.on('scroll', ScrollTrigger.update);
      gsap.ticker.add(time => lenis.raf(time * 1000));
      gsap.ticker.lagSmoothing(0);
    } else {
      const raf = t => { lenis.raf(t); requestAnimationFrame(raf); };
      requestAnimationFrame(raf);
    }
  }

  function scrollToTarget(target) {
    // Een gepinde sectie wordt na de pin verschoven: scroll naar de spacer
    const dest = target === 0 ? 0 : (target.closest('.pin-spacer') || target);
    if (lenis) {
      // Doel als absolute positie op basis van de echte scrollpositie: blijft kloppen als er net
      // native gescrold werd (schermlezer, zoeken op de pagina) en Lenis dat nog niet verwerkt heeft
      const y = dest === 0 ? 0 : dest.getBoundingClientRect().top + window.scrollY - (parseFloat(getComputedStyle(dest).scrollMarginTop) || 0);
      lenis.scrollTo(y, { duration: 1.5, easing: t => 1 - Math.pow(1 - t, 4) });
    } else if (dest === 0) {
      window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
    } else {
      dest.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
    }
    // Toetsenbordfocus mee verplaatsen (preventDefault annuleert dat anders)
    const focusEl = target === 0 ? $('#top') : target;
    if (focusEl) {
      if (!focusEl.hasAttribute('tabindex')) focusEl.setAttribute('tabindex', '-1');
      focusEl.focus({ preventScroll: true });
    }
  }

  /* ───────── Navigatie ───────── */
  const nav = $('#nav');
  const menu = $('#menu');
  const toggle = $('.nav-toggle');
  let menuOpen = false;

  const outside = $$('main, footer, .to-top, .skip-link');
  function setMenu(open) {
    if (open === menuOpen) return;
    menuOpen = open;
    root.classList.toggle('menu-open', open);
    toggle.setAttribute('aria-expanded', String(open));
    $('.nav-toggle-label', toggle).textContent = open ? 'Sluit' : 'Menu';
    if (open) { menu.removeAttribute('inert'); nav.classList.remove('is-hidden'); }
    else menu.setAttribute('inert', '');
    // De rest van de pagina is onbereikbaar zolang het menu open is
    outside.forEach(el => el.toggleAttribute('inert', open));
    if (lenis) open ? lenis.stop() : lenis.start();
    root.style.overflow = open ? 'hidden' : '';
    if (open) setTimeout(() => { const first = $('.menu-list a', menu); if (first) first.focus({ preventScroll: true }); }, 300);
  }
  toggle.addEventListener('click', () => setMenu(!menuOpen));
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && menuOpen) { setMenu(false); toggle.focus(); }
  });
  // Scherm groter gedraaid of pagina uit de cache hersteld: menu dicht
  window.matchMedia('(min-width: 901px)').addEventListener('change', e => { if (e.matches) setMenu(false); });
  window.addEventListener('pageshow', () => setMenu(false));

  // Alle interne ankers: zachte scroll + menu sluiten
  document.addEventListener('click', e => {
    const a = e.target.closest('a[href^="#"]');
    if (!a) return;
    const hash = a.getAttribute('href');
    const target = hash === '#top' ? 0 : (hash.length > 1 ? document.querySelector(hash) : null);
    if (target === null) return;
    e.preventDefault();
    const go = () => scrollToTarget(target);
    if (menuOpen) { setMenu(false); setTimeout(go, 350); } else go();
    if (hash !== '#top') history.replaceState(null, '', hash);
    else history.replaceState(null, '', location.pathname);
  });

  // Verbergen bij naar beneden scrollen, tonen bij omhoog
  const toTop = $('.to-top');
  const toTopBar = $('.to-top-bar');
  let lastY = window.scrollY;
  let ticking = false;
  function onScroll() {
    const y = window.scrollY;
    const max = document.documentElement.scrollHeight - window.innerHeight;
    nav.classList.toggle('is-scrolled', y > 40);
    if (!menuOpen) {
      if (y > lastY + 4 && y > window.innerHeight * 0.6) nav.classList.add('is-hidden');
      else if (y < lastY - 4) nav.classList.remove('is-hidden');
    }
    lastY = y;
    const p = max > 0 ? y / max : 0;
    toTopBar.style.strokeDashoffset = String(100 - p * 100);
    toTop.classList.toggle('is-visible', y > window.innerHeight * 0.9 && y < max - 160);
    ticking = false;
  }
  window.addEventListener('scroll', () => {
    if (!ticking) { ticking = true; requestAnimationFrame(onScroll); }
  }, { passive: true });
  onScroll();

  // Actieve sectie in de navigatie
  const navLinks = $$('.nav-links a[href^="#"]');
  const watched = $$('main > section[id]');
  const activeIO = new IntersectionObserver(entries => {
    entries.forEach(en => {
      if (!en.isIntersecting) return;
      navLinks.forEach(a => {
        if (a.getAttribute('href') === '#' + en.target.id) a.setAttribute('aria-current', 'true');
        else a.removeAttribute('aria-current');
      });
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  watched.forEach(s => activeIO.observe(s));

  /* ───────── Thema-wissel licht ↔ donker ───────── */
  (function initTheme() {
    const sections = $$('main > section[data-theme], footer[data-theme]');
    const meta = $('meta[name="theme-color"]');
    root.classList.add('theme-sync');
    const setTheme = t => {
      if (body.dataset.theme === t) return;
      body.dataset.theme = t;
      if (meta) meta.setAttribute('content', t === 'light' ? '#F3EDE4' : '#0E0C0B');
    };
    const io = new IntersectionObserver(entries => {
      entries.forEach(en => { if (en.isIntersecting) setTheme(en.target.dataset.theme); });
    }, { rootMargin: '-49% 0px -50% 0px' });
    sections.forEach(s => io.observe(s));
  })();

  /* ───────── WebGL-linten ───────── */
  const ribbons = {};
  (function initRibbons() {
    if (!window.Ribbons) return;
    const make = (id, opts) => {
      const c = document.getElementById(id);
      if (!c) return;
      const coarse = !finePointer;
      try { ribbons[id] = new Ribbons(c, Object.assign({ still: reduceMotion, maxPixels: coarse ? 480000 : 1400000 }, opts)); }
      catch (err) { c.remove(); }
    };
    const narrow = window.innerWidth < 700;
    make('heroRibbons', { seed: 0.0, focus: narrow ? [0.6, 0.6] : [0.7, 0.55] });
    make('contactRibbons', { seed: 2.7, focus: narrow ? [0.55, 0.2] : [0.78, 0.45], gain: 0.9, speed: 0.85, tilt: 0.28 });
  })();

  /* ───────── Hero: letters + intro ───────── */
  const heroChars = [];
  $$('.hero-word').forEach(w => heroChars.push(...splitChars(w)));

  // Kwamen de scripts pas na het vangnet (3,5 s) binnen, dan staat de hero al in beeld: niet opnieuw verbergen
  const heroShown = root.classList.contains('is-ready');
  const playIntro = hasGSAP && !reduceMotion && !heroShown;
  function heroIntro() {
    root.classList.add('is-ready');
    if (!playIntro) return;
    const tl = gsap.timeline({ defaults: { ease: 'expo.out' }, delay: 0.1 });
    tl.fromTo(heroChars, { y: 0, yPercent: 115, rotate: 7 }, { y: 0, yPercent: 0, rotate: 0, duration: 1.6, stagger: 0.045 }, 0)
      .fromTo('.hero [data-intro]', { y: 26, opacity: 0 }, { y: 0, opacity: 1, duration: 1.3, stagger: 0.09 }, 0.45)
      .fromTo(nav, { opacity: 0 }, { opacity: 1, duration: 1.4, ease: 'power2.out', clearProps: 'opacity' }, 0.6);
  }
  if (playIntro) {
    root.classList.add('has-gsap');
    gsap.set(heroChars, { y: 0, yPercent: 115 });
    gsap.set('.hero [data-intro]', { opacity: 0 });
  }
  if (document.fonts && document.fonts.ready) {
    Promise.race([document.fonts.ready, new Promise(r => setTimeout(r, 1200))]).then(heroIntro);
  } else {
    heroIntro();
  }

  // Variabel lettertype dat reageert op de cursor
  (function initProximity() {
    if (!finePointer || reduceMotion || !heroChars.length) return;
    const hero = $('.hero');
    const state = heroChars.map(() => ({ w: 300, tw: 300 }));
    let mx = -9999, my = -9999, raf = 0, lastMove = 0;
    hero.addEventListener('pointermove', e => {
      mx = e.clientX; my = e.clientY; lastMove = performance.now();
      if (!raf) raf = requestAnimationFrame(frame);
    });
    hero.addEventListener('pointerleave', () => {
      mx = -9999; my = -9999; lastMove = performance.now();
      if (!raf) raf = requestAnimationFrame(frame);
    });
    new IntersectionObserver(entries => {
      if (!entries[0].isIntersecting) { mx = -9999; my = -9999; }
    }).observe(hero);
    function frame(now) {
      const radius = Math.max(window.innerWidth * 0.16, 180);
      // Eerst alles meten, dan pas schrijven: geen layout-thrashing
      const rects = heroChars.map(ch => ch.getBoundingClientRect());
      let moving = false;
      rects.forEach((r, i) => {
        const d = Math.hypot(mx - (r.left + r.width / 2), my - (r.top + r.height / 2));
        const f = clamp(1 - d / radius, 0, 1);
        const st = state[i];
        st.tw = 300 + f * f * (3 - 2 * f) * 520;
        st.w = lerp(st.w, st.tw, 0.14);
        if (Math.abs(st.w - st.tw) > 0.4) moving = true;
      });
      heroChars.forEach((ch, i) => {
        const w = state[i].w;
        ch.style.fontVariationSettings = `"wght" ${w.toFixed(1)}, "SOFT" 100, "WONK" ${w > 560 ? 1 : 0}`;
      });
      raf = (moving || now - lastMove < 120) ? requestAnimationFrame(frame) : 0;
    }
  })();

  /* ───────── Cursor-label & magnetische knoppen ───────── */
  (function initCursor() {
    if (!finePointer) return;
    const cursor = $('.cursor');
    const label = $('.cursor-label', cursor);
    let x = window.innerWidth / 2, y = window.innerHeight / 2, cx = x, cy = y, running = false;
    window.addEventListener('pointermove', e => {
      x = e.clientX; y = e.clientY;
      if (!running) { running = true; requestAnimationFrame(loop); }
    }, { passive: true });
    function loop() {
      cx = lerp(cx, x, 0.2);
      cy = lerp(cy, y, 0.2);
      cursor.style.translate = `${cx}px ${cy}px`;
      if (Math.abs(cx - x) > 0.1 || Math.abs(cy - y) > 0.1) requestAnimationFrame(loop);
      else running = false;
    }
    document.addEventListener('pointerover', e => {
      const t = e.target.closest('[data-cursor]');
      if (t) { label.textContent = t.dataset.cursor; cursor.classList.add('is-active'); }
    });
    document.addEventListener('pointerout', e => {
      const t = e.target.closest('[data-cursor]');
      if (t && !t.contains(e.relatedTarget)) cursor.classList.remove('is-active');
    });
  })();

  (function initButtons() {
    $$('.btn').forEach(btn => {
      btn.addEventListener('pointerenter', e => {
        const r = btn.getBoundingClientRect();
        btn.style.setProperty('--x', `${e.clientX - r.left}px`);
        btn.style.setProperty('--y', `${e.clientY - r.top}px`);
      });
      btn.addEventListener('pointerleave', e => {
        const r = btn.getBoundingClientRect();
        btn.style.setProperty('--x', `${e.clientX - r.left}px`);
        btn.style.setProperty('--y', `${e.clientY - r.top}px`);
      });
    });
    if (!finePointer || !hasGSAP || reduceMotion) return;
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
  })();

  // Spotlight op de competentiekaarten
  if (finePointer) {
    $$('[data-spot]').forEach(card => {
      card.addEventListener('pointermove', e => {
        const r = card.getBoundingClientRect();
        card.style.setProperty('--mx', `${e.clientX - r.left}px`);
        card.style.setProperty('--my', `${e.clientY - r.top}px`);
      });
    });
  }

  /* ───────── Tellers ───────── */
  (function initCounters() {
    const els = $$('[data-count]');
    const run = el => {
      const target = parseInt(el.dataset.count, 10);
      if (reduceMotion) { el.textContent = target; return; }
      const dur = 1600, t0 = performance.now();
      const step = now => {
        const t = clamp((now - t0) / dur, 0, 1);
        const eased = 1 - Math.pow(1 - t, 4);
        el.textContent = Math.round(eased * target);
        if (t < 1) requestAnimationFrame(step);
      };
      el.textContent = '0';
      requestAnimationFrame(step);
    };
    const io = new IntersectionObserver((entries, obs) => {
      entries.forEach(en => { if (en.isIntersecting) { run(en.target); obs.unobserve(en.target); } });
    }, { threshold: 0.6 });
    els.forEach(el => io.observe(el));
  })();

  /* ───────── Filmstrip-thumbnails (YouTube) ───────── */
  // Bestaat er geen HD-versie, dan stuurt YouTube een grijs plaatje van 120×90: val terug op hqdefault.
  // Als helper, zodat ook de gekloonde tegels van de marquee de fallback krijgen.
  const ytThumb = (img, id) => {
    const fallback = () => {
      if (img.dataset.fb) return;
      img.dataset.fb = '1';
      img.src = `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
    };
    img.addEventListener('load', () => { if (img.naturalWidth <= 120) fallback(); });
    img.addEventListener('error', fallback);
    if (img.complete && img.naturalWidth && img.naturalWidth <= 120) fallback();
  };
  $$('.tile[data-yt]').forEach(tile => {
    const img = new Image();
    img.alt = '';
    img.loading = 'lazy';
    img.decoding = 'async';
    ytThumb(img, tile.dataset.yt);
    img.src = `https://i.ytimg.com/vi/${tile.dataset.yt}/maxresdefault.jpg`;
    tile.prepend(img);
  });

  /* ───────── Marquees (band + filmstrip), reageren op scrollsnelheid ───────── */
  (function initMarquees() {
    if (reduceMotion) return;
    const tracks = $$('[data-marquee]');
    if (!tracks.length) return;

    // Dupliceer de inhoud zodat de lus naadloos is, ook op brede schermen
    const fill = track => {
      const group = track.firstElementChild;
      const w = group.offsetWidth || 1;
      const needed = Math.ceil(window.innerWidth / w) + 1;
      while (track.children.length < needed + 1) {
        const clone = group.cloneNode(true);
        clone.setAttribute('aria-hidden', 'true');
        clone.querySelectorAll('.tile[data-yt] > img').forEach(img => ytThumb(img, img.parentElement.dataset.yt));
        track.appendChild(clone);
      }
    };
    tracks.forEach(fill);
    root.classList.add('marquee-js');

    const items = tracks.map(track => ({
      el: track,
      dir: parseFloat(track.dataset.marquee) || 1,
      x: 0,
      width: 0,
      visible: false,
      speed: track.classList.contains('reel-track') ? 0.55 : 0.75
    }));
    // offsetWidth = layoutbreedte (getBoundingClientRect telt de rotatie/schaal van de strip mee)
    const measure = () => items.forEach(it => { fill(it.el); it.width = it.el.firstElementChild.offsetWidth; });
    measure();
    window.addEventListener('resize', measure);
    if (document.fonts) document.fonts.ready.then(measure);

    const io = new IntersectionObserver(entries => {
      entries.forEach(en => { const it = items.find(i => i.el === en.target); if (it) it.visible = en.isIntersecting; });
    });
    items.forEach(it => io.observe(it.el));

    let velocity = 0, lastScroll = window.scrollY, scrollDir = 1, boost = 0;
    let last = performance.now();
    function frame(now) {
      const dt = Math.min(now - last, 50) / 16.67;
      last = now;
      const y = window.scrollY;
      velocity = y - lastScroll;
      lastScroll = y;
      if (Math.abs(velocity) > 0.5) scrollDir = velocity > 0 ? 1 : -1;
      boost = lerp(boost, Math.min(Math.abs(velocity) * 0.35, 14), 0.08);
      items.forEach(it => {
        if (!it.visible || !it.width) return;
        it.x -= (it.speed + boost) * it.dir * scrollDir * dt;
        if (it.x <= -it.width) it.x += it.width;
        if (it.x > 0) it.x -= it.width;
        it.el.style.transform = `translate3d(${it.x.toFixed(2)}px, 0, 0)`;
      });
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  })();

  /* ───────── Interesses als physics-pillen (Matter.js, lazy) ───────── */
  (function initPills() {
    const box = $('#pillbox');
    if (!box) return;
    const hint = $('.interests-hint');
    if (!finePointer && hint && hint.dataset.hintTouch) hint.textContent = hint.dataset.hintTouch;
    if (reduceMotion) { if (hint) hint.textContent = ''; box.removeAttribute('data-cursor'); return; }

    const io = new IntersectionObserver(async entries => {
      if (!entries[0].isIntersecting) return;
      io.disconnect();
      try {
        if (!window.Matter) await loadScript('https://cdnjs.cloudflare.com/ajax/libs/matter-js/0.20.0/matter.min.js', 'sha384-ZRKYEXtLBVeqs9z1WxyeKutCqnkqolS/r1EUWuoUpG4ZKbnRAIXnHhHdnNuiB6CL');
        start();
      } catch (err) { box.classList.add('is-static'); if (hint) hint.textContent = ''; }
    }, { rootMargin: '0px 0px -20% 0px' });
    io.observe(box);

    function start() {
      const { Engine, Bodies, Body, Composite, Mouse, MouseConstraint } = Matter;
      const pills = $$('.pill', box);
      const sizes = pills.map(el => ({ w: el.offsetWidth, h: el.offsetHeight }));
      // Eerst buiten beeld zetten, pas dan absoluut positioneren (geen flits linksboven)
      pills.forEach(el => { el.style.transform = 'translate3d(0, -200px, 0)'; });
      box.classList.add('is-physics');

      const engine = Engine.create();
      engine.gravity.y = 1.1;
      let W = box.clientWidth, H = box.clientHeight;

      const bodies = pills.map((el, i) => {
        const { w, h } = sizes[i];
        const b = Bodies.rectangle(
          w / 2 + Math.random() * Math.max(1, W - w),
          -h - i * 70 - Math.random() * 60,
          w, h,
          { chamfer: { radius: h / 2 - 1 }, restitution: 0.45, friction: 0.25, frictionAir: 0.012, density: 0.0018, angle: (Math.random() - 0.5) * 0.8 }
        );
        // Meer traagheid: pillen tollen minder en landen meestal leesbaar
        Body.setInertia(b, b.inertia * 3.5);
        b.plugin = { el, w, h };
        return b;
      });

      let walls = [];
      const T = 400;
      function buildWalls() {
        if (walls.length) Composite.remove(engine.world, walls);
        walls = [
          Bodies.rectangle(W / 2, H + T / 2, W + T * 2, T, { isStatic: true }),
          Bodies.rectangle(-T / 2, H / 2 - 600, T, H * 2 + 1200, { isStatic: true }),
          Bodies.rectangle(W + T / 2, H / 2 - 600, T, H * 2 + 1200, { isStatic: true })
        ];
        Composite.add(engine.world, walls);
      }
      buildWalls();
      Composite.add(engine.world, bodies);

      if (finePointer) {
        const mouse = Mouse.create(box);
        mouse.element.removeEventListener('wheel', mouse.mousewheel);
        mouse.element.removeEventListener('mousewheel', mouse.mousewheel);
        mouse.element.removeEventListener('DOMMouseScroll', mouse.mousewheel);
        // Touch op hybride laptops: laat de pagina gewoon scrollen
        mouse.element.removeEventListener('touchmove', mouse.mousemove);
        mouse.element.removeEventListener('touchstart', mouse.mousedown);
        mouse.element.removeEventListener('touchend', mouse.mouseup);
        const mc = MouseConstraint.create(engine, { mouse, constraint: { stiffness: 0.18, damping: 0.08, render: { visible: false } } });
        Composite.add(engine.world, mc);
        window.addEventListener('mouseup', () => { mouse.button = -1; });
      } else {
        pills.forEach((el, i) => {
          el.addEventListener('click', () => {
            const b = bodies[i];
            Body.setVelocity(b, { x: (Math.random() - 0.5) * 10, y: -14 - Math.random() * 6 });
            Body.setAngularVelocity(b, (Math.random() - 0.5) * 0.35);
          });
        });
      }

      let visible = true, raf = 0, last = performance.now();
      function tick(now) {
        const dt = Math.min(now - last, 32);
        last = now;
        // Matter.js wil stappen van max. ~16,7 ms: trage frames in kleinere stapjes opdelen
        const steps = Math.max(1, Math.ceil(dt / 16.667));
        for (let s = 0; s < steps; s++) Engine.update(engine, dt / steps);
        bodies.forEach(b => {
          const { el, w, h } = b.plugin;
          el.style.transform = `translate3d(${(b.position.x - w / 2).toFixed(1)}px, ${(b.position.y - h / 2).toFixed(1)}px, 0) rotate(${b.angle.toFixed(3)}rad)`;
        });
        if (visible) raf = requestAnimationFrame(tick);
      }
      raf = requestAnimationFrame(tick);

      new IntersectionObserver(entries => {
        const v = entries[0].isIntersecting;
        if (v && !visible) { visible = true; last = performance.now(); raf = requestAnimationFrame(tick); }
        else if (!v) { visible = false; cancelAnimationFrame(raf); }
      }).observe(box);

      let rt;
      window.addEventListener('resize', () => {
        clearTimeout(rt);
        rt = setTimeout(() => {
          W = box.clientWidth; H = box.clientHeight;
          buildWalls();
          bodies.forEach(b => {
            // Lettergrootte schaalt met de viewport: lichaam mee laten groeien/krimpen
            const el = b.plugin.el;
            const nw = el.offsetWidth, nh = el.offsetHeight;
            if (nw && nh && (Math.abs(nw - b.plugin.w) > 1 || Math.abs(nh - b.plugin.h) > 1)) {
              Body.scale(b, nw / b.plugin.w, nh / b.plugin.h);
              b.plugin.w = nw; b.plugin.h = nh;
            }
            const { w, h } = b.plugin;
            Body.setPosition(b, { x: clamp(b.position.x, w / 2, W - w / 2), y: Math.min(b.position.y, H - h / 2) });
          });
        }, 150);
      });
    }
  })();

  /* ───────── E-mailadres kopiëren ───────── */
  (function initCopy() {
    const toast = $('.toast');
    let tt;
    const show = msg => {
      toast.textContent = msg;
      toast.classList.add('is-visible');
      clearTimeout(tt);
      tt = setTimeout(() => toast.classList.remove('is-visible'), 2200);
    };
    $$('[data-copy]').forEach(btn => {
      const label = $('.copy-label', btn);
      btn.addEventListener('click', async () => {
        try {
          await navigator.clipboard.writeText(btn.dataset.copy);
          btn.classList.add('is-copied');
          if (label) label.textContent = 'Gekopieerd';
          show('E-mailadres gekopieerd ✓');
          setTimeout(() => { btn.classList.remove('is-copied'); if (label) label.textContent = 'Kopieer adres'; }, 2200);
        } catch (err) {
          show(btn.dataset.copy);
        }
      });
    });
  })();

  /* ═══════════ Vanaf hier: scroll-animaties (GSAP) ═══════════ */
  if (!hasGSAP) return;

  const mm = gsap.matchMedia();

  // Woord-voor-woord koppen
  $$('[data-split]').forEach(el => {
    const words = splitWords(el, true);
    if (reduceMotion) return;
    gsap.fromTo(words, { yPercent: 115 }, {
      yPercent: 0,
      duration: 1.3,
      ease: 'expo.out',
      stagger: 0.07,
      scrollTrigger: { trigger: el, start: 'top 88%', once: true }
    });
  });

  // Quote die oplicht terwijl je scrolt
  $$('[data-scrub]').forEach(el => {
    const words = splitWords(el, false);
    if (reduceMotion) return;
    gsap.fromTo(words, { opacity: 0.12 }, {
      opacity: 1,
      ease: 'none',
      stagger: 0.08,
      scrollTrigger: { trigger: el, start: 'top 78%', end: 'bottom 42%', scrub: true }
    });
  });

  if (!reduceMotion) {
    // Gewone reveals, per groep gestaggerd
    ScrollTrigger.batch('[data-reveal]', {
      start: 'top 90%',
      once: true,
      onEnter: batch => gsap.fromTo(batch, { y: 46, opacity: 0 }, { y: 0, opacity: 1, duration: 1.2, ease: 'expo.out', stagger: 0.08, overwrite: true })
    });
    gsap.set('[data-reveal]', { opacity: 0, y: 46 });

    // Hero: tekst glijdt weg en zijde dimt bij het scrollen
    gsap.to('.hero-inner', {
      yPercent: -14,
      opacity: 0.25,
      ease: 'none',
      scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true }
    });
    gsap.to('.hero-ribbons', {
      scale: 1.12,
      ease: 'none',
      scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true }
    });

    // Portret: masker-reveal + parallax
    const photo = $('.about-photo-frame');
    if (photo) {
      gsap.fromTo(photo, { clipPath: 'inset(100% 0% 0% 0% round 999px 999px 24px 24px)' }, {
        clipPath: 'inset(0% 0% 0% 0% round 999px 999px 24px 24px)',
        duration: 1.6,
        ease: 'expo.out',
        scrollTrigger: { trigger: photo, start: 'top 85%', once: true }
      });
      gsap.fromTo($('img', photo), { yPercent: -12 }, {
        yPercent: 0,
        ease: 'none',
        scrollTrigger: { trigger: photo, start: 'top bottom', end: 'bottom top', scrub: true }
      });
    }

    // Visie-pijlers: lijn tekent zich
    gsap.utils.toArray('.pillar').forEach(p => {
      gsap.fromTo(p, { '--draw': 0 }, { '--draw': 1, duration: 1.4, ease: 'expo.inOut', scrollTrigger: { trigger: p, start: 'top 88%', once: true } });
    });

    // Filmstrip kantelt mee met de scroll
    gsap.fromTo('.reel', { rotate: -5 }, {
      rotate: -1,
      ease: 'none',
      scrollTrigger: { trigger: '.reel-sec', start: 'top bottom', end: 'bottom top', scrub: true }
    });

    // Contact: de linten lichten op wanneer je aankomt
    const contactRibbons = ribbons.contactRibbons;
    if (contactRibbons) {
      ScrollTrigger.create({
        trigger: '.contact',
        start: 'top bottom',
        end: 'top top',
        scrub: true,
        onUpdate: self => contactRibbons.setGain(0.15 + self.progress * 0.65)
      });
    }
  }

  // Traject: horizontaal scrollen (desktop)
  // Niet op lage schermen (gsm in landscape): daar blijft de verticale lijst staan
  mm.add('(min-width: 901px) and (min-height: 650px) and (prefers-reduced-motion: no-preference)', () => {
    const section = $('.journey');
    const track = $('.journey-track');
    const bar = $('.journey-progress span');
    section.classList.add('is-horizontal');
    const distance = () => Math.max(0, track.scrollWidth - document.documentElement.clientWidth);

    const tween = gsap.to(track, {
      x: () => -distance(),
      ease: 'none',
      scrollTrigger: {
        trigger: section,
        start: 'top top',
        end: () => '+=' + distance(),
        pin: true,
        scrub: 0.8,
        invalidateOnRefresh: true,
        anticipatePin: 1,
        onUpdate: self => { bar.style.transform = `scaleX(${self.progress})`; }
      }
    });

    $$('.stop').forEach(stop => {
      gsap.fromTo(stop, { y: 60, rotate: 2.5, opacity: 0.35 }, {
        y: 0, rotate: 0, opacity: 1, ease: 'none',
        scrollTrigger: { trigger: stop, containerAnimation: tween, start: 'left 100%', end: 'right 100%', scrub: true }
      });
      const num = $('.stop-num', stop);
      gsap.fromTo(num, { xPercent: 30 }, {
        xPercent: -10, ease: 'none',
        scrollTrigger: { trigger: stop, containerAnimation: tween, start: 'left 100%', end: 'right 0%', scrub: true }
      });
    });

    // Toetsenbordfocus in een kaart: scroll zodat die kaart in beeld schuift
    const onFocus = e => {
      // Alleen bij toetsenbordfocus: een muisklik mag de pagina niet onder de cursor wegschuiven
      let keyboard = false;
      try { keyboard = e.target.matches(':focus-visible'); } catch (err) { keyboard = false; }
      if (!keyboard) return;
      const stop = e.target.closest('.stop');
      const st = tween.scrollTrigger;
      const d = distance();
      if (!stop || !st || !d) return;
      const vw = document.documentElement.clientWidth;
      const p = Math.min(1, Math.max(0, (stop.offsetLeft + stop.offsetWidth - vw * 0.9) / d));
      window.scrollTo(0, st.start + p * (st.end - st.start));
    };
    section.addEventListener('focusin', onFocus);

    return () => {
      section.removeEventListener('focusin', onFocus);
      section.classList.remove('is-horizontal');
    };
  });

  // Projecten: kaarten stapelen en zakken weg
  // Zelfde voorwaarden als de sticky-CSS: alleen stapelen als een kaart volledig in beeld past
  mm.add('(min-width: 901px) and (min-height: 650px) and (prefers-reduced-motion: no-preference), (min-width: 701px) and (min-height: 960px) and (prefers-reduced-motion: no-preference)', () => {
    const items = $$('.stack-item');
    items.forEach((item, i) => {
      const next = items[i + 1];
      if (!next) return;
      const card = $('.project', item);
      gsap.to(card, {
        scale: 0.9 + i * 0.02,
        '--dim': 0.38,
        ease: 'none',
        scrollTrigger: {
          trigger: next,
          start: 'top bottom',
          end: () => `top ${parseFloat(getComputedStyle(next).top) || 0}px`,
          scrub: true,
          invalidateOnRefresh: true
        }
      });
    });
  });

  // Herbereken posities zodra fonts en beelden binnen zijn
  const refresh = () => ScrollTrigger.refresh();
  if (document.fonts) document.fonts.ready.then(refresh);
  window.addEventListener('load', refresh);
})();
