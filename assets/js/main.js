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

  /* ───────── Scroll-meetlat (desktop): vervangt de scrollbalk ───────── */
  // Ingezoomd schuift een lat met streepjes mee terwijl je scrolt; ga je erover met de muis,
  // dan schuift alles samen tot 0–100 % en zie je alle secties om naar te springen.
  (function initRail() {
    const mq = window.matchMedia('(hover: hover) and (pointer: fine) and (min-width: 901px)');
    const secs = $$('[data-rail]');
    if (!secs.length) return;

    const ZOOM = 34; // px per procent, ingezoomd
    const rail = document.createElement('div');
    rail.className = 'rail';
    rail.setAttribute('aria-hidden', 'true');
    let html = '<div class="rail-panel"></div><div class="rail-clip"><div class="rail-track"><div class="rail-tape">';
    for (let v = 0; v <= 100; v++) {
      html += v % 5 ? `<i class="rail-tick" style="--v:${v}"></i>` : `<i class="rail-tick is-major" style="--v:${v}"><b>${v}</b></i>`;
    }
    html += '<span class="rail-band"></span><span class="rail-now"><b>000%</b></span>';
    let n = 0;
    secs.forEach(s => {
      const num = s.id === 'top' ? '' : `<span>${String(++n).padStart(2, '0')}</span>`;
      html += `<a class="rail-label" href="#${s.id}" tabindex="-1">${num}${s.dataset.rail}</a>`;
    });
    html += '</div><span class="rail-hover"><b>000%</b></span></div></div>';
    rail.innerHTML = html;
    body.appendChild(rail);

    const track = $('.rail-track', rail);
    const tape = $('.rail-tape', rail);
    const nowLabel = $('.rail-now b', rail);
    const hoverLine = $('.rail-hover', rail);
    const hoverLabel = $('b', hoverLine);
    const marks = $$('.rail-label', rail).map((el, i) => ({ el, sec: secs[i], v: 0 }));

    let on = false, open = false, z = 0, zT = 0, p = 0, Hr = 1, max = 1, raf = 0, last = 0;
    let openT = 0, closeT = 0, drag = null;
    const fmt = v => String(Math.round(v * 100)).padStart(3, '0') + '%';

    function measure() {
      if (!on) return;
      Hr = Math.max(1, track.clientHeight);
      max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      marks.forEach(m => {
        const top = m.sec.id === 'top' ? 0 : (m.sec.closest('.pin-spacer') || m.sec).getBoundingClientRect().top + window.scrollY;
        m.v = clamp(top / max, 0, 1) * 100;
      });
      // Labels die te dicht op elkaar vallen een beetje uit elkaar duwen (alleen hun plek op de lat)
      const gap = 20 / (Hr / 100);
      let prev = -Infinity;
      marks.forEach(m => { m.y = Math.max(m.v, prev + gap); prev = m.y; });
      for (let i = marks.length - 1; i >= 0; i--) {
        const lim = i === marks.length - 1 ? 100 : marks[i + 1].y - gap;
        if (marks[i].y > lim) marks[i].y = lim;
        marks[i].el.style.setProperty('--v', marks[i].y.toFixed(3));
      }
      rail.style.setProperty('--bh', (window.innerHeight / max * 100).toFixed(3));
      update();
    }

    function render() {
      const e = z * z * (3 - 2 * z);
      const s = ZOOM + (Hr / 100 - ZOOM) * e;
      rail.style.setProperty('--s', s.toFixed(3));
      rail.style.setProperty('--p', p.toFixed(5));
      tape.style.transform = `translate3d(0, ${(p * (Hr - 100 * s)).toFixed(2)}px, 0)`;
      nowLabel.textContent = fmt(p);
      rail.classList.toggle('is-end', p > 0.97);
    }
    function update() {
      p = clamp(window.scrollY / max, 0, 1);
      // Actieve sectie: die het midden van het scherm vult
      const mid = (window.scrollY + window.innerHeight / 2) / max * 100;
      let active = marks[0];
      marks.forEach(m => { if (m.v <= mid) active = m; });
      marks.forEach(m => m.el.classList.toggle('is-active', m === active));
      if (!raf) render();
    }
    function loop(now) {
      const dt = Math.min(now - last, 50);
      last = now;
      z += (zT - z) * (1 - Math.exp(-dt / 110));
      if (Math.abs(zT - z) < 0.002) z = zT;
      render();
      raf = z !== zT ? requestAnimationFrame(loop) : 0;
    }
    function setOpen(v) {
      if (open === v) return;
      open = v;
      rail.classList.toggle('is-open', v);
      zT = v ? 1 : 0;
      if (reduceMotion) { z = zT; render(); return; }
      if (!raf) { last = performance.now(); raf = requestAnimationFrame(loop); }
    }

    // Klik of sleep op de lat: naar dat punt scrollen
    const pAt = y => clamp((y - track.getBoundingClientRect().top) / Hr, 0, 1);
    function go(target, instant) {
      const y = target * max;
      if (lenis) lenis.scrollTo(y, instant ? { immediate: true, force: true } : { duration: 1.2, easing: t => 1 - Math.pow(1 - t, 4), force: true });
      else window.scrollTo({ top: y, behavior: instant || reduceMotion ? 'instant' : 'smooth' });
    }
    rail.addEventListener('pointerenter', () => {
      clearTimeout(closeT);
      openT = setTimeout(() => setOpen(true), 80);
    });
    rail.addEventListener('pointerleave', () => {
      clearTimeout(openT);
      rail.classList.remove('is-hovering');
      if (!drag) closeT = setTimeout(() => setOpen(false), 280);
    });
    rail.addEventListener('pointermove', e => {
      const y = pAt(e.clientY);
      rail.classList.add('is-hovering');
      hoverLine.style.transform = `translate3d(0, ${(y * Hr).toFixed(1)}px, 0)`;
      hoverLabel.textContent = fmt(y);
      if (drag) {
        if (Math.abs(e.clientY - drag.y0) > 4) drag.moved = true;
        if (drag.moved) go(y, true);
      }
    });
    rail.addEventListener('pointerdown', e => {
      if (e.button !== 0 || e.target.closest('.rail-label')) return;
      e.preventDefault();
      clearTimeout(openT);
      setOpen(true);
      drag = { y0: e.clientY, moved: false };
      try { rail.setPointerCapture(e.pointerId); } catch (err) { /* oude browser */ }
    });
    const endDrag = e => {
      if (!drag) return;
      if (!drag.moved && e.type === 'pointerup') go(pAt(e.clientY), false);
      drag = null;
      if (!rail.matches(':hover')) closeT = setTimeout(() => setOpen(false), 280);
    };
    rail.addEventListener('pointerup', endDrag);
    rail.addEventListener('pointercancel', endDrag);
    // Na een sprong via een label: dichtklappen
    rail.addEventListener('click', e => { if (e.target.closest('.rail-label')) { clearTimeout(openT); setOpen(false); } });

    let ticking = false;
    window.addEventListener('scroll', () => {
      if (!on || ticking) return;
      ticking = true;
      requestAnimationFrame(() => { ticking = false; update(); });
    }, { passive: true });

    // Posities opnieuw meten als de pagina van hoogte verandert (pins, lettertypes, beelden)
    let mt = 0;
    const remeasure = () => { cancelAnimationFrame(mt); mt = requestAnimationFrame(measure); };
    if (window.ResizeObserver) new ResizeObserver(remeasure).observe(document.body);
    window.addEventListener('resize', remeasure);
    window.addEventListener('load', remeasure);
    if (hasGSAP) ScrollTrigger.addEventListener('refresh', remeasure);

    function apply() {
      on = mq.matches;
      root.classList.toggle('has-rail', on);
      if (!on) { setOpen(false); return; }
      remeasure();
    }
    apply();
    mq.addEventListener('change', () => { apply(); if (hasGSAP) ScrollTrigger.refresh(); });
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

    // Iconen: kopie van elke vorm bovenop het origineel, met een streep zo lang als de vorm zelf.
    // Het gat is iets langer dan de streep, zodat ook een ronde lijnkap pas verschijnt als de lijn vertrekt.
    if (!reduceMotion) {
      $$('.card .icon').forEach(svg => {
        const trace = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        trace.setAttribute('class', 'icon-trace');
        $$('path, circle, rect', svg).forEach((shape, i) => {
          let len = 0;
          try { len = shape.getTotalLength(); } catch (err) { len = 0; }
          if (!len) return;
          const copy = shape.cloneNode(false);
          copy.style.strokeDasharray = `${len.toFixed(2)} ${(len + 4).toFixed(2)}`;
          copy.style.setProperty('--off', (len + 2).toFixed(2));
          copy.style.setProperty('--i', i);
          trace.appendChild(copy);
        });
        svg.appendChild(trace);
        svg.classList.add('has-trace');
      });
    }
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

  /* ───────── Interesses: basket-minigame met physics-pillen (Matter.js, lazy) ───────── */
  // Gooi de pillen in de ring rechtsboven. Een pil die je over de stippellijn sleept glipt uit je hand:
  // scoren kan alleen met een echte worp van achter de lijn.
  (function initPills() {
    const box = $('#pillbox');
    if (!box) return;
    const hint = $('.interests-hint');
    if (!finePointer && hint && hint.dataset.hintTouch) hint.textContent = hint.dataset.hintTouch;
    if (reduceMotion) { if (hint) hint.textContent = ''; return; }

    const io = new IntersectionObserver(async entries => {
      if (!entries[0].isIntersecting) return;
      io.disconnect();
      try {
        if (!window.Matter) await loadScript('https://cdnjs.cloudflare.com/ajax/libs/matter-js/0.20.0/matter.min.js', 'sha384-ZRKYEXtLBVeqs9z1WxyeKutCqnkqolS/r1EUWuoUpG4ZKbnRAIXnHhHdnNuiB6CL');
        start();
      } catch (err) { box.classList.add('is-static'); if (hint) hint.textContent = ''; }
    }, { rootMargin: '0px 0px -20% 0px' });
    io.observe(box);

    const PALETTE = ['#F4B474', '#EF97AB', '#B2A5F2', '#8EC2E8', '#9CCDAB'];
    const RECORD_KEY = 'kc-basket-record';
    const readRecord = () => { try { return parseInt(localStorage.getItem(RECORD_KEY), 10) || 0; } catch (err) { return 0; } };
    const saveRecord = n => { try { localStorage.setItem(RECORD_KEY, String(n)); } catch (err) { /* privévenster: geen record */ } };
    const el = (tag, cls, parent) => { const n = document.createElement(tag); if (cls) n.className = cls; if (parent) parent.appendChild(n); return n; };

    function start() {
      const { Engine, Bodies, Body, Composite, Constraint } = Matter;
      const pills = $$('.pill', box);
      const sizes = pills.map(p => ({ w: p.offsetWidth, h: p.offsetHeight }));
      // Kleur per pil, voor het scorebord en de confetti (verloop-pil → spectrum)
      const colors = pills.map(p => {
        const cs = getComputedStyle(p);
        return { fill: cs.backgroundImage !== 'none' ? cs.backgroundImage : cs.backgroundColor, solid: cs.backgroundImage !== 'none' ? null : cs.backgroundColor };
      });
      // Eerst buiten beeld zetten, pas dan absoluut positioneren (geen flits linksboven)
      pills.forEach(p => { p.style.transform = 'translate3d(0, -200px, 0)'; });
      box.classList.add('is-physics', 'is-game');

      /* Speelveld: driepuntslijn, ring, scorebord */
      const SVGNS = 'http://www.w3.org/2000/svg';
      const court = document.createElementNS(SVGNS, 'svg');
      court.setAttribute('class', 'court');
      court.setAttribute('aria-hidden', 'true');
      const zone = document.createElementNS(SVGNS, 'circle');
      zone.setAttribute('class', 'court-zone');
      const line = document.createElementNS(SVGNS, 'circle');
      line.setAttribute('class', 'court-line');
      court.append(zone, line);
      box.prepend(court);
      const board = el('span', 'hoop-board', box);
      const net = el('span', 'hoop-net', box);
      const rim = el('span', 'hoop-rim', box);
      [board, net, rim].forEach(n => n.setAttribute('aria-hidden', 'true'));

      const hud = el('div', 'hud', box);
      hud.setAttribute('aria-hidden', 'true');
      const dotsWrap = el('span', 'hud-dots', hud);
      const dots = pills.map((p, i) => { const d = el('i', '', dotsWrap); d.style.setProperty('--dot', colors[i].fill); return d; });
      const countEl = el('span', 'hud-count', hud);

      const engine = Engine.create();
      engine.gravity.y = 1.1;
      let W = 0, H = 0, G = null;

      function geometry() {
        W = box.clientWidth; H = box.clientHeight;
        const narrow = W < 600;
        const boardW = narrow ? 10 : 12;
        const rimW = narrow ? 136 : clamp(W * 0.17, 150, 250);
        const rimY = narrow ? 116 : clamp(H * 0.38, 105, 165);
        const back = W - boardW;
        const front = back - rimW;
        const cx = (front + back) / 2;
        // Lijn tot boven de rand van het vak laten doorlopen: zo kan je een pil niet over de lijn heen 'dragen'.
        // Op een gsm blijft de zone klein, zodat je ook vanaf de grond kan gooien.
        const R = narrow ? rimY + 36 : Math.max(clamp(W * 0.42, 150, 520), rimY + 40);
        G = { boardW, rimW, rimY, back, front, cx, R };
        box.style.setProperty('--rim-y', rimY + 'px');
        box.style.setProperty('--rim-w', rimW + 'px');
        box.style.setProperty('--board', boardW + 'px');
        court.setAttribute('viewBox', `0 0 ${W} ${H}`);
        [zone, line].forEach(c => { c.setAttribute('cx', cx); c.setAttribute('cy', rimY); c.setAttribute('r', R); });
      }
      const inZone = p => Math.hypot(p.x - G.cx, p.y - G.rimY) < G.R;

      // Waar een (nieuwe) pil invalt: links van de ring, liefst buiten de driepuntslijn
      function spawnX(w) {
        const reach = H - G.rimY;
        const edge = G.R > reach ? G.cx - Math.sqrt(G.R * G.R - reach * reach) : G.front;
        const min = w / 2 + 8;
        let max = Math.min(G.front - 12, edge) - w / 2;
        if (max <= min) max = G.front - 12 - w / 2;
        return max > min ? min + Math.random() * (max - min) : min + Math.random() * 24;
      }

      const bodies = pills.map((p, i) => {
        const { w, h } = sizes[i];
        const b = Bodies.rectangle(0, -400, w, h, {
          chamfer: { radius: h / 2 - 1 }, restitution: 0.45, friction: 0.25, frictionAir: 0.012, density: 0.0018
        });
        // Wat meer traagheid: pillen tollen minder en landen meestal leesbaar
        Body.setInertia(b, b.inertia * 2.5);
        b.plugin = { el: p, w, h, i, live: false, armed: false, scored: false, px: 0, py: 0, rest: 0 };
        return b;
      });

      /* Statische delen: vloer, wanden, onzichtbaar plafond, bord en voorkant van de ring */
      let statics = [];
      const T = 400;
      function buildStatics() {
        if (statics.length) Composite.remove(engine.world, statics);
        const ceil = -Math.max(160, H * 0.5);
        const s = { isStatic: true, friction: 0.3 };
        statics = [
          Bodies.rectangle(W / 2, H + T / 2, W + T * 2, T, s),
          Bodies.rectangle(-T / 2, H / 2, T, H * 4 + T, s),
          Bodies.rectangle(W + T / 2, H / 2, T, H * 4 + T, s),
          Bodies.rectangle(W / 2, ceil - T / 2, W + T * 2, T, s),
          Bodies.rectangle(W - G.boardW / 2, G.rimY - 54, G.boardW, 148, Object.assign({ chamfer: { radius: 3 } }, s)),
          Bodies.circle(G.front, G.rimY, 5, Object.assign({ restitution: 0.6 }, s))
        ];
        Composite.add(engine.world, statics);
      }

      geometry();
      buildStatics();

      /* Pillen laten invallen, één voor één */
      let queue = bodies.slice();
      let lastDrop = 0;
      function drop(b) {
        const { w, h } = b.plugin;
        Body.setPosition(b, { x: spawnX(w), y: -h - 20 });
        Body.setVelocity(b, { x: 0, y: 0 });
        Body.setAngularVelocity(b, 0);
        Body.setAngle(b, (Math.random() - 0.5) * 0.6);
        Object.assign(b.plugin, { armed: false, px: b.position.x, py: b.position.y, rest: 0 });
        if (!b.plugin.live) { b.plugin.live = true; Composite.add(engine.world, b); }
      }

      /* Score */
      let count = 0, throws = 0, lastSay = 0, finished = false;
      const updateHud = () => {
        countEl.innerHTML = `<b>${count}</b>/${bodies.length} in de mand`;
        dots.forEach((d, i) => d.classList.toggle('is-on', bodies[i].plugin.scored));
      };
      updateHud();

      function sparks(x, y, list, n, power) {
        for (let k = 0; k < n; k++) {
          const s = el('i', 'spark', box);
          s.style.left = x + 'px';
          s.style.top = y + 'px';
          s.style.background = list[k % list.length];
          if (k % 3 === 0) s.style.borderRadius = '50%';
          const ang = -Math.PI / 2 + (Math.random() - 0.5) * 2.4;
          const v = (50 + Math.random() * 90) * power;
          const dx = Math.cos(ang) * v, dy = Math.sin(ang) * v, r = (Math.random() - 0.5) * 540;
          const a = s.animate([
            { transform: 'translate(0, 0) rotate(0deg) scale(1)', opacity: 1 },
            { transform: `translate(${dx.toFixed(1)}px, ${dy.toFixed(1)}px) rotate(${(r / 2).toFixed(0)}deg) scale(1)`, opacity: 1, offset: 0.45 },
            { transform: `translate(${(dx * 1.3).toFixed(1)}px, ${(dy + 110 * power).toFixed(1)}px) rotate(${r.toFixed(0)}deg) scale(0.5)`, opacity: 0 }
          ], { duration: 900 + Math.random() * 500, easing: 'cubic-bezier(.2,.7,.3,1)' });
          a.onfinish = () => s.remove();
        }
      }
      function say(text, x, y) {
        const s = el('span', 'pop-text', box);
        s.textContent = text;
        const half = s.offsetWidth / 2;
        s.style.left = clamp(x, half + 8, W - half - 8) + 'px';
        s.style.top = y + 'px';
        const a = s.animate([
          { transform: 'translate(-50%, 6px)', opacity: 0 },
          { transform: 'translate(-50%, -10px)', opacity: 1, offset: 0.18 },
          { transform: 'translate(-50%, -16px)', opacity: 1, offset: 0.7 },
          { transform: 'translate(-50%, -34px)', opacity: 0 }
        ], { duration: 1500, easing: 'ease-out' });
        a.onfinish = () => s.remove();
      }
      function flash(n, cls, ms) {
        n.classList.remove(cls);
        void n.offsetWidth;
        n.classList.add(cls);
        clearTimeout(n._t);
        n._t = setTimeout(() => n.classList.remove(cls), ms);
      }
      // Een kopie van de pil spat open op de plek waar ze scoorde; de echte valt opnieuw in
      function ghost(b) {
        const g = b.plugin.el.cloneNode(true);
        g.classList.add('pill-ghost');
        g.classList.remove('is-held');
        g.setAttribute('aria-hidden', 'true');
        box.appendChild(g);
        const a = g.animate([{ opacity: 1, scale: '1' }, { opacity: 0, scale: '1.35' }], { duration: 380, easing: 'ease-out' });
        a.onfinish = () => g.remove();
      }

      function score(b) {
        const pl = b.plugin;
        const first = !pl.scored;
        const list = colors[pl.i].solid ? [colors[pl.i].solid, colors[pl.i].solid].concat(PALETTE) : PALETTE;
        ghost(b);
        sparks(G.cx, G.rimY + 6, list, first ? 18 : 10, first ? 1 : 0.7);
        flash(net, 'is-swish', 600);
        say(first ? `Raak! ${pl.el.textContent.trim()}` : 'Raak!', G.cx, G.rimY - 58);
        if (first) {
          pl.scored = true;
          pl.el.classList.add('is-scored');
          count++;
          updateHud();
          flash(dots[pl.i], 'is-pop', 600);
          if (count === bodies.length && !finished) setTimeout(win, 450);
        }
        pl.live = false;
        Composite.remove(engine.world, b);
        pl.el.style.transform = 'translate3d(0, -200px, 0)';
        queue.push(b);
      }
      function spit(b) {
        Body.setVelocity(b, { x: -(5 + Math.random() * 3), y: -(9 + Math.random() * 3) });
        Body.setAngularVelocity(b, -0.06);
        flash(court, 'is-hot', 700);
        const now = performance.now();
        if (now - lastSay > 1400) { lastSay = now; say('Van achter de lijn 😉', G.cx, G.rimY - 58); }
      }

      let done = null;
      function win() {
        finished = true;
        const best = readRecord();
        const record = !best || throws < best;
        if (record) saveRecord(throws);
        sparks(W * 0.3, H * 0.55, PALETTE, 34, 1.6);
        sparks(W * 0.7, H * 0.55, PALETTE, 34, 1.6);
        done = el('div', 'game-done', box);
        done.setAttribute('role', 'status');
        const worpen = n => `${n} ${n === 1 ? 'worp' : 'worpen'}`;
        done.innerHTML = `<p class="game-done-title">Alle ${bodies.length} <em>erin!</em></p>` +
          `<p class="game-done-sub">In ${worpen(throws)}${record && best ? ' — nieuw record!' : (best ? ` · record: ${worpen(best)}` : '')}<br>Nu ken je me al een beetje.</p>` +
          '<button class="game-again" type="button">Nog eens <span aria-hidden="true">↻</span></button>';
        requestAnimationFrame(() => done.classList.add('is-on'));
        $('.game-again', done).addEventListener('click', reset);
      }
      function reset() {
        if (done) { const d = done; done = null; d.classList.remove('is-on'); setTimeout(() => d.remove(), 400); }
        release();
        count = 0; throws = 0; finished = false;
        bodies.forEach(b => {
          b.plugin.scored = false;
          b.plugin.el.classList.remove('is-scored');
          if (b.plugin.live) { b.plugin.live = false; Composite.remove(engine.world, b); }
          b.plugin.el.style.transform = 'translate3d(0, -200px, 0)';
        });
        queue = bodies.slice().sort(() => Math.random() - 0.5);
        updateHud();
      }

      /* Vastpakken, slepen en gooien */
      let drag = null;
      const bodyOf = n => bodies[pills.indexOf(n)];
      const local = (x, y) => {
        const r = box.getBoundingClientRect();
        return { x: clamp(x - r.left, 0, W), y: clamp(y - r.top, 0, H) };
      };
      function grab(b, p) {
        release();
        if (!b || !b.plugin.live) return;
        const c = Constraint.create({
          pointA: { x: p.x, y: p.y }, bodyB: b,
          pointB: { x: p.x - b.position.x, y: p.y - b.position.y },
          stiffness: 0.2, damping: 0.08, length: 0
        });
        Composite.add(engine.world, c);
        drag = { b, c, inside: inZone(b.position), slipped: false };
        b.plugin.armed = false;
        b.plugin.el.classList.add('is-held');
      }
      function moveTo(p) {
        if (!drag) return;
        drag.c.pointA.x = p.x;
        drag.c.pointA.y = p.y;
      }
      function release(tap) {
        if (!drag) return;
        const { b, c, slipped } = drag;
        drag = null;
        Composite.remove(engine.world, c);
        b.plugin.el.classList.remove('is-held');
        if (tap) {
          // Een tik: de pil maakt een sprongetje (telt niet als worp)
          Body.setVelocity(b, { x: (Math.random() - 0.5) * 6, y: -9 - Math.random() * 4 });
          Body.setAngularVelocity(b, (Math.random() - 0.5) * 0.25);
          return;
        }
        // Snelheid begrenzen: niets vliegt door de wanden
        const v = Body.getVelocity(b);
        const sp = Math.hypot(v.x, v.y);
        if (sp > 30) Body.setVelocity(b, { x: v.x / sp * 30, y: v.y / sp * 30 });
        const outside = slipped || !inZone(b.position);
        b.plugin.armed = outside;
        if (outside && (slipped || sp > 2)) throws++;
      }

      // Muis en pen: direct vastpakken
      let mouse = null;
      box.addEventListener('pointerdown', e => {
        if (e.pointerType === 'touch' || e.button !== 0) return;
        const p = e.target.closest('.pill');
        if (!p || p.classList.contains('pill-ghost')) return;
        e.preventDefault();
        try { box.setPointerCapture(e.pointerId); } catch (err) { /* oude browser */ }
        mouse = { id: e.pointerId, x0: e.clientX, y0: e.clientY, t0: performance.now(), moved: 0 };
        grab(bodyOf(p), local(e.clientX, e.clientY));
      });
      box.addEventListener('pointermove', e => {
        if (!mouse || e.pointerId !== mouse.id) return;
        mouse.moved = Math.max(mouse.moved, Math.hypot(e.clientX - mouse.x0, e.clientY - mouse.y0));
        moveTo(local(e.clientX, e.clientY));
      });
      const mouseEnd = e => {
        if (!mouse || e.pointerId !== mouse.id) return;
        const tap = mouse.moved < 6 && performance.now() - mouse.t0 < 280;
        mouse = null;
        release(tap);
      };
      box.addEventListener('pointerup', mouseEnd);
      box.addEventListener('pointercancel', mouseEnd);
      box.addEventListener('lostpointercapture', mouseEnd);
      window.addEventListener('blur', () => { mouse = null; release(); });

      // Touch: even vasthouden (of zijwaarts vegen) = gooien, snel verticaal vegen = gewoon scrollen
      let touch = null;
      const findTouch = list => Array.from(list).find(t => t.identifier === touch.id);
      box.addEventListener('touchstart', e => {
        if (touch) return;
        const p = e.target.closest('.pill');
        if (!p || p.classList.contains('pill-ghost')) return;
        const t = e.changedTouches[0];
        touch = { id: t.identifier, b: bodyOf(p), x0: t.clientX, y0: t.clientY, t0: performance.now(), mode: 'wait', moved: 0 };
      }, { passive: true });
      box.addEventListener('touchmove', e => {
        if (!touch) return;
        const t = findTouch(e.changedTouches);
        if (!t) return;
        const dx = t.clientX - touch.x0, dy = t.clientY - touch.y0;
        touch.moved = Math.max(touch.moved, Math.hypot(dx, dy));
        if (touch.mode === 'wait') {
          if (performance.now() - touch.t0 >= 120 || Math.abs(dx) > Math.abs(dy)) {
            touch.mode = 'drag';
            grab(touch.b, local(touch.x0, touch.y0));
          } else {
            touch.mode = 'scroll';
          }
        }
        if (touch.mode === 'drag' && e.cancelable) {
          e.preventDefault();
          moveTo(local(t.clientX, t.clientY));
        }
      }, { passive: false });
      const touchEnd = e => {
        if (!touch || !findTouch(e.changedTouches)) return;
        const tap = touch.moved < 8 && performance.now() - touch.t0 < 300;
        if (touch.mode === 'drag') release(tap);
        else if (tap) { grab(touch.b, { x: touch.b.position.x, y: touch.b.position.y }); release(true); }
        touch = null;
      };
      box.addEventListener('touchend', touchEnd);
      box.addEventListener('touchcancel', touchEnd);

      /* Simulatie */
      let visible = true, raf = 0, last = performance.now();
      function tick(now) {
        const dt = Math.min(now - last, 32);
        last = now;
        if (queue.length && now - lastDrop > 110) { lastDrop = now; drop(queue.shift()); }
        // Kleine stapjes (max. ~8 ms): stabielere botsingen bij harde worpen
        const steps = Math.max(1, Math.ceil(dt / 8.34));
        for (let s = 0; s < steps; s++) Engine.update(engine, dt / steps);

        // Over de stippellijn gesleept? Dan glipt de pil uit je hand
        if (drag) {
          const inside = inZone(drag.b.position);
          if (inside && !drag.inside) { drag.slipped = true; flash(court, 'is-hot', 600); release(); }
          else drag.inside = inside;
        }

        for (let i = 0; i < bodies.length; i++) {
          const b = bodies[i];
          const pl = b.plugin;
          if (!pl.live) continue;
          const { x, y } = b.position;
          const held = drag && drag.b === b;
          // Door de ring naar beneden? Middelpunt kruist de ringlijn tussen voorkant en bord
          if (!held && pl.py < G.rimY && y >= G.rimY) {
            const t = (G.rimY - pl.py) / (y - pl.py);
            const xc = pl.px + (x - pl.px) * t;
            if (xc > G.front + 2 && xc < G.back - 2) {
              if (pl.armed) { score(b); continue; }
              spit(b);
            }
          }
          // Blijft een pil op de ring liggen? Even wiebelen
          const onRim = !held && Math.abs(y - G.rimY + pl.h * 0.3) < pl.h * 0.6 && x > G.front - pl.w / 2 && x < G.back && Body.getSpeed(b) < 0.4;
          pl.rest = onRim ? pl.rest + 1 : 0;
          if (pl.rest > 50) { pl.rest = 0; Body.setVelocity(b, { x: (Math.random() - 0.5) * 3, y: -3 }); Body.setAngularVelocity(b, (Math.random() - 0.5) * 0.1); }
          // Vangnet: uit het veld geraakt → opnieuw invallen
          if (y > H + 300 || x < -300 || x > W + 300) { drop(b); continue; }
          pl.px = x; pl.py = y;
          pl.el.style.transform = `translate3d(${(x - pl.w / 2).toFixed(1)}px, ${(y - pl.h / 2).toFixed(1)}px, 0) rotate(${b.angle.toFixed(3)}rad)`;
        }
        if (visible) raf = requestAnimationFrame(tick);
      }
      raf = requestAnimationFrame(tick);

      new IntersectionObserver(entries => {
        const v = entries[0].isIntersecting;
        if (v && !visible) { visible = true; last = performance.now(); raf = requestAnimationFrame(tick); }
        else if (!v) { visible = false; cancelAnimationFrame(raf); release(); }
      }).observe(box);

      let rt;
      window.addEventListener('resize', () => {
        clearTimeout(rt);
        rt = setTimeout(() => {
          geometry();
          buildStatics();
          bodies.forEach(b => {
            // Lettergrootte schaalt met de viewport: lichaam mee laten groeien/krimpen
            const p = b.plugin.el;
            const nw = p.offsetWidth, nh = p.offsetHeight;
            if (nw && nh && (Math.abs(nw - b.plugin.w) > 1 || Math.abs(nh - b.plugin.h) > 1)) {
              Body.scale(b, nw / b.plugin.w, nh / b.plugin.h);
              b.plugin.w = nw; b.plugin.h = nh;
            }
            if (!b.plugin.live) return;
            const { w, h } = b.plugin;
            Body.setPosition(b, { x: clamp(b.position.x, w / 2, W - w / 2), y: Math.min(b.position.y, H - h / 2) });
            b.plugin.px = b.position.x; b.plugin.py = b.position.y;
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
