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

  /* ───────── Interesses: Sterrenjacht (minigame) ───────── */
  // Kleine arcade-shooter in golven: stuur het schip, schiet sterretjes en vang zo al mijn interesses.
  // Drie golven van drie, daarna hond Bink als eindbaas. De pillen schieten vonkjes terug: geraakt = twee strafseconden.
  // Sterrenveld, kogels en deeltjes tekenen op canvas; de pillen blijven DOM-elementen (scherpe tekst, zelfde stijl).
  (function initGame() {
    const box = $('#pillbox');
    if (!box) return;
    const hint = $('.interests-hint');
    if (reduceMotion) { if (hint) hint.textContent = ''; return; }
    const list = $('.pills', box);
    const bg = document.createElement('canvas');
    const fx = document.createElement('canvas');
    const bctx = bg.getContext('2d');
    const fctx = fx.getContext('2d');
    if (!list || !bctx || !fctx) return;

    const PAPER = '#F3EDE4';
    const PALETTE = ['#F4B474', '#EF97AB', '#B2A5F2', '#8EC2E8', '#9CCDAB'];
    const RECORD_KEY = 'kc-sterrenjacht-record';
    const TAU = Math.PI * 2;
    const touchFirst = !finePointer;
    const make = (tag, cls, parent) => { const n = document.createElement(tag); if (cls) n.className = cls; if (parent) parent.appendChild(n); return n; };
    const readRecord = () => { try { return parseFloat(localStorage.getItem(RECORD_KEY)) || 0; } catch (err) { return 0; } };
    const saveRecord = v => { try { localStorage.setItem(RECORD_KEY, v.toFixed(2)); } catch (err) { /* privévenster: geen record */ } };
    const secs = v => v.toFixed(1).replace('.', ',');
    const ease = v => v * v * (3 - 2 * v);

    /* Opbouw: twee canvassen rond de pillen, scorebord, klok, prompt, banner en een kaart voor pauze/winst */
    box.classList.add('is-game');
    box.tabIndex = 0;
    box.setAttribute('role', 'group');
    box.setAttribute('aria-roledescription', 'minigame');
    box.setAttribute('aria-label', 'Sterrenjacht: vang al mijn interesses. Enter om te starten, pijltjes om te sturen, spatie om te schieten.');
    bg.className = 'game-bg';
    fx.className = 'game-fx';
    [bg, fx].forEach(c => c.setAttribute('aria-hidden', 'true'));
    box.insertBefore(bg, list);
    box.appendChild(fx);

    const hud = make('div', 'hud', box);
    const dotsWrap = make('span', 'hud-dots', hud);
    const countEl = make('span', 'hud-count', hud);
    const clock = make('div', 'hud-clock', box);
    const power = make('div', 'hud-power', box);
    power.innerHTML = '<span>3× ✦</span><i></i>';
    const prompt = make('div', 'game-prompt', box);
    prompt.innerHTML = touchFirst
      ? '<b>✦ Tik om te starten</b><span>schuif om te sturen · hou vast om te schieten</span>'
      : '<b>✦ Klik om te starten</b><span>muis of ← → om te sturen · klik of spatie om te schieten</span>';
    const bannerEl = make('div', 'game-banner', box);
    [hud, clock, power, prompt, bannerEl].forEach(n => n.setAttribute('aria-hidden', 'true'));
    const card = make('div', 'game-card', box);
    card.setAttribute('aria-live', 'polite');

    const P = $$('.pill', list).map((el, i) => {
      const cs = getComputedStyle(el);
      const grad = cs.backgroundImage !== 'none';
      const pale = el.classList.contains('pill--ink') || el.classList.contains('pill--line');
      const solid = cs.backgroundColor;
      const big = el.classList.contains('pill--big');
      const dot = make('i', '', dotsWrap);
      dot.style.setProperty('--dot', grad ? cs.backgroundImage : solid);
      return {
        el, i, dot, big, label: el.textContent.trim(),
        colors: grad ? PALETTE : pale ? [PAPER, PAPER, '#B2A5F2', '#8EC2E8'] : [solid, solid, solid, PAPER],
        max: big ? 6 : 1, hp: big ? 6 : 1,
        // form = formatie (wachtstand), leave = vliegt weg bij de start, wave = in het spel, gone = gevangen of buiten beeld
        mode: 'form', enter: 0, leave: 0, lane: null, dive: null,
        w: 0, h: 0, hx: 0, hy: 0, row: 0, x: 0, y: 0, a: 0,
        pulse: 0, dodge: 0, dv: 0, hitT: 0, inv: 0
      };
    });
    const hittable = p => p.mode === 'wave' && p.enter < 0.2 && p.inv <= 0;

    /* Toestand */
    let W = 0, H = 0, dpr = 1, narrow = false, rows = [], stars = [];
    const ship = { x: 0, y: 0, tx: 0, bank: 0, cd: 0, kick: 0, stun: 0, safe: 0 };
    const keys = { l: false, r: false };
    let bullets = [], sparks = [], parts = [], rings = [], drops = [];
    let waves = [], wave = -1, waveT = 0;
    let state = 'idle', firing = false, keyFire = false;
    let t = 0, gt = 0, elapsed = 0, shots = 0, hits = 0, caught = 0, penalties = 0;
    let triple = 0, diveT = 0, sparkT = 0, warp = 0, shake = 0, lastClock = '', lastSay = 0;

    function setState(s) {
      state = s;
      box.dataset.state = s;
      box.classList.toggle('is-playing', s === 'play');
      if (s !== 'play') { firing = keyFire = false; keys.l = keys.r = false; }
    }

    /* Maten: canvassen, formatie voor de wachtstand, banen voor een golf, sterren */
    function placeLanes(group) {
      const top = narrow ? 66 : 80;
      const bottom = ship.y - (narrow ? 168 : 158);
      const boss = group.length === 1 && group[0].big;
      group.forEach((p, j) => {
        const L = p.lane;
        L.y = boss ? top + (bottom - top) * 0.35 : group.length === 1 ? (top + bottom) / 2 : top + (bottom - top) * j / (group.length - 1);
        L.amp = Math.max(10, (W - p.w) / 2 - (narrow ? 10 : 26));
        L.sp = L.v / L.amp;
        L.ampY = boss ? (narrow ? 58 : 56) : (narrow ? 5 : 8);
      });
    }
    function layout() {
      W = box.clientWidth; H = box.clientHeight;
      narrow = W < 600;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      [bg, fx].forEach(c => { c.width = Math.round(W * dpr); c.height = Math.round(H * dpr); });
      bctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      fctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      P.forEach(p => { p.w = p.el.offsetWidth; p.h = p.el.offsetHeight; });

      // Formatie: rijen zo gelijk mogelijk verdelen (geen eenzame pil op een laatste rij)
      const gx = narrow ? 8 : 16, gy = narrow ? 10 : 14, maxW = W * (narrow ? 0.95 : 0.76);
      const total = P.reduce((sum, p) => sum + p.w, 0) + gx * (P.length - 1);
      const fill = limit => {
        const out = [];
        let row = { items: [], w: 0 };
        P.forEach(p => {
          const add = (row.items.length ? gx : 0) + p.w;
          if (row.items.length && row.w + add > limit) { out.push(row); row = { items: [], w: 0 }; }
          row.w += (row.items.length ? gx : 0) + p.w;
          row.items.push(p);
        });
        out.push(row);
        return out;
      };
      for (let n = Math.max(1, Math.ceil(total / maxW)); ; n++) {
        rows = fill(Math.min(maxW, total / n + total / P.length * 0.6));
        if (rows.length <= n || n >= P.length) break;
      }
      let y = narrow ? 52 : 66;
      rows.forEach((r, ri) => {
        const rh = Math.max(...r.items.map(p => p.h));
        let x = (W - r.w) / 2;
        r.items.forEach(p => { p.hx = x + p.w / 2; p.hy = y + rh / 2; p.row = ri; x += p.w + gx; });
        r.amp = Math.max(4, (W - r.w) / 2 - (narrow ? 4 : 28));
        y += rh + gy;
      });

      ship.y = H - (narrow ? 44 : 54);
      if (!ship.x) ship.x = ship.tx = W / 2;
      ship.x = clamp(ship.x, 22, W - 22);
      ship.tx = clamp(ship.tx, 22, W - 22);
      if (waves[wave]) placeLanes(waves[wave].filter(p => p.lane));

      const n = Math.round(W * H / (narrow ? 2200 : 2600));
      stars = Array.from({ length: n }, () => {
        const z = Math.random();
        const layer = z < 0.6 ? 0 : z < 0.9 ? 1 : 2;
        return {
          x: Math.random() * W, y: Math.random() * H,
          sp: [0.25, 0.6, 1.25][layer], r: [0.6, 0.95, 1.5][layer], al: [0.4, 0.65, 0.95][layer],
          tw: 1 + Math.random() * 2.5, ph: Math.random() * TAU,
          c: Math.random() < 0.18 ? PALETTE[(Math.random() * PALETTE.length) | 0] : PAPER
        };
      });
    }

    /* Effecten */
    function burst(x, y, colors, n, force, dir, spread) {
      for (let k = 0; k < n && parts.length < 700; k++) {
        const an = (dir === undefined ? 0 : dir) + (Math.random() - 0.5) * (spread === undefined ? TAU : spread);
        const v = (50 + Math.random() * 250) * force;
        const life = 0.45 + Math.random() * 0.65;
        parts.push({ x, y, vx: Math.cos(an) * v, vy: Math.sin(an) * v, life, max: life, r: 1.4 + Math.random() * 2.6, c: colors[k % colors.length], star: Math.random() < 0.4, rot: Math.random() * TAU });
      }
    }
    function say(text, x, y) {
      const s = make('span', 'pop-text', box);
      s.textContent = text;
      const half = s.offsetWidth / 2;
      s.style.left = clamp(x, half + 8, W - half - 8) + 'px';
      s.style.top = clamp(y, 40, H - 30) + 'px';
      const a = s.animate([
        { transform: 'translate(-50%, -50%) translateY(6px) scale(0.9)', opacity: 0 },
        { transform: 'translate(-50%, -50%) translateY(-6px) scale(1)', opacity: 1, offset: 0.15 },
        { transform: 'translate(-50%, -50%) translateY(-14px) scale(1)', opacity: 1, offset: 0.7 },
        { transform: 'translate(-50%, -50%) translateY(-30px) scale(1)', opacity: 0 }
      ], { duration: 1300, easing: 'ease-out' });
      a.onfinish = () => s.remove();
    }
    function banner(kicker, title) {
      bannerEl.textContent = '';
      make('span', '', bannerEl).textContent = kicker;
      make('b', '', bannerEl).textContent = title;
      bannerEl.getAnimations().forEach(a => a.cancel());
      bannerEl.animate([
        { opacity: 0, transform: 'translate(-50%, -38%) scale(0.94)' },
        { opacity: 1, transform: 'translate(-50%, -50%) scale(1)', offset: 0.18 },
        { opacity: 1, transform: 'translate(-50%, -50%) scale(1)', offset: 0.72 },
        { opacity: 0, transform: 'translate(-50%, -60%) scale(1.02)' }
      ], { duration: 1600, easing: 'ease-out' });
    }
    function pulseClass(n, cls, ms) {
      n.classList.remove(cls);
      void n.offsetWidth;
      n.classList.add(cls);
      clearTimeout(n._t);
      n._t = setTimeout(() => n.classList.remove(cls), ms);
    }
    function updateHud() { countEl.innerHTML = `<b>${caught}</b>/${P.length} gevangen`; }

    /* Spelverloop */
    function planWaves() {
      const normal = P.filter(p => !p.big).sort(() => Math.random() - 0.5);
      waves = [];
      for (let k = 0; k < normal.length; k += 3) waves.push(normal.slice(k, k + 3));
      const boss = P.filter(p => p.big);
      if (boss.length) waves.push(boss);
      wave = -1;
    }
    function spawnWave() {
      wave++;
      const group = waves[wave];
      const boss = group.length === 1 && group[0].big;
      const v = (narrow ? [130, 170, 210, 200] : [190, 260, 330, 250])[Math.min(wave, 3)];
      group.forEach((p, j) => {
        p.lane = { v: v * (0.85 + Math.random() * 0.3), ph: Math.random() * TAU, y: 0, amp: 0, sp: 0, ampY: 0 };
        p.mode = 'wave';
        p.hp = p.max;
        p.enter = 1 + j * 0.16;
        p.dive = null;
        p.dodge = p.dv = 0;
        p.inv = 0;
        p.el.getAnimations().forEach(a => a.cancel());
        p.el.classList.remove('is-out');
      });
      placeLanes(group);
      if (boss) banner('Eindbaas', group[0].label);
      else banner(`Golf ${wave + 1}/${waves.length}`, wave === 0 ? 'Vang ze!' : wave === waves.length - 2 && waves[waves.length - 1][0].big ? 'Bijna bij de baas' : 'Sneller nu');
      sparkT = 1.6;
      diveT = 2.6;
    }
    function fire() {
      // Zoals in Space Invaders: maar een paar sterretjes tegelijk in de lucht, dus mikken loont
      if (bullets.length >= (triple > 0 ? 3 : 1)) return;
      const c = PALETTE[shots % PALETTE.length];
      const add = vx => { bullets.push({ x: ship.x + vx * 0.02, y: ship.y - 22, vx, vy: -780, rot: Math.random() * TAU, c }); shots++; };
      add(0);
      if (triple > 0) { add(-190); add(190); }
      ship.cd = triple > 0 ? 0.14 : 0.12;
      ship.kick = 1;
    }
    function hitTest(p, x, y, r) {
      const dx = x - p.x, dy = y - p.y;
      const c = Math.cos(-p.a), s = Math.sin(-p.a);
      const lx = dx * c - dy * s, ly = dx * s + dy * c;
      const half = Math.max(0, p.w / 2 - p.h / 2);
      const qx = clamp(lx, -half, half);
      return Math.hypot(lx - qx, ly) < p.h / 2 + r;
    }
    function hit(p, b) {
      hits++;
      p.hp--;
      p.pulse = 1;
      p.hitT = 0.12;
      p.el.classList.add('is-hit');
      burst(b.x, b.y + 4, p.colors, 7, 0.6, Math.PI / 2, 2.2);
      if (p.hp > 0) {
        // De baas ontwijkt (zijwaartse veer weg van de inslag) en knippert even: dan is hij onkwetsbaar
        p.dv = (b.x < p.x ? 1 : -1) * (narrow ? 300 : 460);
        p.inv = 0.4;
        const now = performance.now();
        if (p.big && p.hp === Math.floor(p.max / 2)) { lastSay = now; say('Bink wordt boos!', p.x, p.y - p.h / 2 - 12); shake = 1; }
        else if (now - lastSay > 450) { lastSay = now; say(p.hp === 1 ? 'Grrr… woef!' : 'Woef!', p.x, p.y - p.h / 2 - 12); }
        return;
      }
      pop(p);
    }
    function pop(p) {
      p.mode = 'gone';
      p.dive = null;
      caught++;
      burst(p.x, p.y, p.colors, narrow ? 26 : 38, p.big ? 1.5 : 1);
      rings.push({ x: p.x, y: p.y, r0: p.h * 0.4, r1: p.w * 0.75, life: 0, c: p.colors[0] });
      shake = p.big ? 1.6 : 0.8;
      const a = p.el.animate([{ scale: '1', opacity: 1 }, { scale: '1.3', opacity: 0 }], { duration: 220, easing: 'ease-out' });
      a.onfinish = () => { if (p.mode === 'gone') p.el.classList.add('is-out'); };
      say(`+ ${p.label}`, p.x, p.y);
      p.dot.classList.add('is-on');
      pulseClass(p.dot, 'is-pop', 600);
      updateHud();
      // Golf leeg? Volgende golf, en als beloning valt er een ster: vang ze voor een drievoudig schot
      if (waves[wave].every(q => q.mode === 'gone')) {
        if (wave === waves.length - 1) win();
        else { waveT = 1.1; drops.push({ x: p.x, y: p.y, t: 0 }); }
      }
    }
    // Geraakt door een vonk of een duikende pil: even stilgevallen en twee strafseconden
    function stunShip() {
      if (ship.safe > 0 || state !== 'play') return;
      ship.stun = 0.75;
      ship.safe = 1.5;
      elapsed += 2;
      penalties++;
      shake = 1.2;
      burst(ship.x, ship.y - 4, [PAPER, '#F4B474', '#EF97AB'], 22, 0.9);
      say('Au! +2 s', ship.x, ship.y - 56);
    }
    function startDive() {
      const pool = P.filter(p => hittable(p) && !p.dive);
      if (!pool.length) return;
      const p = pool[(Math.random() * pool.length) | 0];
      p.dive = {
        s: 0, dur: 2.1 + Math.random() * 0.6,
        depth: Math.max(60, ship.y - 6 - p.lane.y),
        swing: (Math.random() < 0.5 ? -1 : 1) * (narrow ? 50 : 110),
        tx: ship.x, bumped: false
      };
    }
    function enemyFire() {
      const pool = P.filter(p => hittable(p) && !p.dive);
      if (!pool.length) return;
      const p = pool[(Math.random() * pool.length) | 0];
      const sy = p.y + p.h / 2;
      const speed = 230 + wave * 18;
      const tt = Math.max(0.6, (ship.y - sy) / speed);
      const base = clamp((ship.x - p.x) / tt, -120, 120) * 0.8;
      const c = p.colors[0] === PAPER ? '#F4B474' : p.colors[0];
      // De baas vuurt een waaier van drie
      (p.big ? [-110, 0, 110] : [0]).forEach(off => sparks.push({ x: p.x, y: sy, vx: base + off, vy: speed, c, t: 0 }));
    }
    function win() {
      const time = elapsed;
      const acc = shots ? Math.round(hits / shots * 100) : 100;
      const best = readRecord();
      const record = !best || time < best;
      if (record) saveRecord(time);
      setState('won');
      warp = 1.6;
      drops.length = 0;
      sparks.length = 0;
      triple = 0;
      setTimeout(() => { [0.25, 0.5, 0.75].forEach(f => burst(W * f, H * 0.42, PALETTE, narrow ? 30 : 46, 1.5)); }, 280);
      // Daarna zweven alle interesses terug in formatie, achter de kaart
      setTimeout(() => {
        if (state !== 'won') return;
        P.forEach((p, i) => {
          p.mode = 'form';
          p.enter = 1 + i * 0.06;
          p.el.getAnimations().forEach(a => a.cancel());
          p.el.classList.remove('is-out');
        });
      }, 1300);
      setTimeout(() => {
        if (state !== 'won') return;
        const extra = record && best ? 'Nieuw record! ✦' : best ? `Record: ${secs(best)} s` : 'Nu ken je me al een beetje.';
        const hurt = penalties ? ` · ${penalties}× geraakt` : '';
        showCard(`<div><p class="game-eyebrow">Missie geslaagd</p><p class="game-title">Alle ${P.length} <em>gevangen!</em></p>` +
          `<p class="game-sub">In ${secs(time)} s · ${acc}% raak${hurt}<br>${extra}</p></div>` +
          '<button class="game-btn" type="button">Nog eens <span aria-hidden="true">↻</span></button>');
      }, 1000);
    }
    function showCard(html) {
      card.innerHTML = html;
      card.classList.add('is-on');
      if (document.activeElement === box) { const btn = $('.game-btn', card); if (btn) btn.focus({ preventScroll: true }); }
    }
    function hideCard() { card.classList.remove('is-on'); }

    function start() {
      bullets.length = 0;
      sparks.length = 0;
      drops.length = 0;
      caught = hits = shots = penalties = 0;
      elapsed = 0; gt = 0; triple = 0; lastClock = '';
      ship.stun = ship.safe = 0;
      planWaves();
      waveT = 0.9;
      // De formatie vliegt weg naar boven; daarna komt de eerste golf binnen
      P.forEach((p, i) => {
        p.hp = p.max; p.dive = null; p.dodge = p.dv = 0; p.pulse = 0; p.lane = null;
        p.dot.classList.remove('is-on');
        if (p.mode === 'form') { p.mode = 'leave'; p.leave = -i * 0.03; }
        else { p.mode = 'gone'; p.el.classList.add('is-out'); }
      });
      updateHud();
      hideCard();
      setState('play');
    }
    function pause() {
      if (state !== 'play') return;
      setState('pause');
      showCard('<p class="game-title">Even <em>pauze</em></p><p class="game-sub">Je tijd staat stil.</p><button class="game-btn" type="button">Verder spelen <span aria-hidden="true">✦</span></button>');
    }
    function act() {
      if (state === 'idle' || state === 'won') start();
      else if (state === 'pause') { hideCard(); setState('play'); }
      // Focus op het speelveld (niet op de verborgen knop), zodat pijltjes en spatie meteen werken
      box.focus({ preventScroll: true });
    }

    /* Simulatie */
    function update(dt) {
      t += dt;
      warp = Math.max(0, warp - dt * 0.9);
      shake = Math.max(0, shake - dt * 5);

      // Sterrenveld: rustig in de wachtstand, sneller tijdens het spel, warp na een overwinning
      const v = (state === 'play' ? 70 : state === 'pause' ? 8 : 24) + warp * warp * 900;
      stars.forEach(s => {
        s.y += v * s.sp * dt;
        if (s.y > H + 20) { s.y -= H + 40; s.x = Math.random() * W; }
      });
      for (let i = parts.length - 1; i >= 0; i--) {
        const q = parts[i];
        q.life -= dt;
        if (q.life <= 0) { parts.splice(i, 1); continue; }
        q.vx *= Math.pow(0.08, dt);
        q.vy = q.vy * Math.pow(0.08, dt) + 220 * dt;
        q.x += q.vx * dt; q.y += q.vy * dt; q.rot += dt * 6;
      }
      for (let i = rings.length - 1; i >= 0; i--) { rings[i].life += dt / 0.5; if (rings[i].life >= 1) rings.splice(i, 1); }
      // Pauze: de rest van de wereld staat stil
      if (state === 'pause') return;

      const playing = state === 'play';
      if (playing) { elapsed += dt; gt += dt; }

      // Schip: glijdt naar het doel en helt over in de bocht
      if (playing) { if (keys.l) ship.tx -= 600 * dt; if (keys.r) ship.tx += 600 * dt; }
      ship.tx = clamp(ship.tx, 22, W - 22);
      const px = ship.x;
      ship.x += (ship.tx - ship.x) * (1 - Math.exp(-dt * 16));
      const vx = (ship.x - px) / Math.max(dt, 0.001);
      ship.bank += (clamp(vx / 900, -0.5, 0.5) - ship.bank) * (1 - Math.exp(-dt * 10));
      ship.kick = Math.max(0, ship.kick - dt * 7);
      // Vonkjes uit de motor: een spoor dat achterblijft als je stuurt
      if (Math.random() < (playing ? 0.9 : 0.35) && parts.length < 650) {
        const life = 0.25 + Math.random() * 0.3;
        parts.push({ x: ship.x + (Math.random() - 0.5) * 6, y: ship.y + 14, vx: -vx * 0.08 + (Math.random() - 0.5) * 30, vy: 90 + Math.random() * 80, life, max: life, r: 1 + Math.random() * 1.6, c: Math.random() < 0.6 ? '#F4B474' : '#EF97AB', star: false, rot: 0 });
      }
      ship.stun = Math.max(0, ship.stun - dt);
      ship.safe = Math.max(0, ship.safe - dt);
      ship.cd -= dt;
      if (playing && (firing || keyFire) && ship.cd <= 0 && ship.stun <= 0) fire();
      if (playing) triple = Math.max(0, triple - dt);

      // Golven, vonkjes en duikvluchten
      if (playing && waveT > 0) { waveT -= dt; if (waveT <= 0) spawnWave(); }
      if (playing && waves[wave]) {
        sparkT -= dt;
        if (sparkT <= 0) {
          enemyFire();
          const angry = waves[wave].some(p => p.big && p.hp <= p.max / 2);
          sparkT = [1.5, 1.2, 0.95, angry ? 0.8 : 1.05][Math.min(wave, 3)] * (0.7 + Math.random() * 0.6);
        }
        if (wave >= 1) {
          diveT -= dt;
          if (diveT <= 0) { startDive(); diveT = [0, 3.2, 2.4, 2.6][Math.min(wave, 3)] * (0.8 + Math.random() * 0.4); }
        }
      }

      P.forEach(p => {
        if (p.mode === 'gone') return;
        let x, y, a;
        if (p.mode === 'wave') {
          const L = p.lane;
          // Fase 2 van de eindbaas: vanaf halve kracht sneller (fase loopt vloeiend door, geen sprong)
          if (p.big) L.ph += dt * L.sp * (p.hp <= p.max / 2 ? 0.35 : 0);
          const ph = gt * L.sp + L.ph;
          x = W / 2 + Math.sin(ph) * L.amp;
          y = L.y + Math.sin(ph * 2) * L.ampY + Math.sin(t * 2.1 + p.i) * 3;
          a = Math.cos(ph) * 0.08;
        } else {
          const r = rows[p.row];
          x = p.hx + Math.sin(t * 0.85 + p.row * 1.15) * r.amp;
          y = p.hy + Math.sin(t * 2.1 + p.i * 1.7) * (narrow ? 3 : 5);
          a = Math.sin(t * 1.6 + p.i * 2.3) * 0.05;
        }
        if (p.dive) {
          p.dive.s += dt / p.dive.dur;
          const s = p.dive.s;
          if (s >= 1) p.dive = null;
          else {
            const k = Math.sin(s * Math.PI);
            x += Math.sin(s * TAU) * p.dive.swing + (p.dive.tx - x) * k * 0.65;
            y += k * p.dive.depth;
            a += Math.cos(s * TAU) * 0.22 * Math.sign(p.dive.swing);
          }
        }
        p.dv += (-p.dodge * 90 - p.dv * 11) * dt;
        p.dodge += p.dv * dt;
        x += p.dodge;
        if (p.enter > 0) {
          p.enter = Math.max(0, p.enter - dt * 1.5);
          const e = Math.min(1, p.enter);
          y -= ease(e) * (y + p.h + 60);
        }
        if (p.mode === 'leave') {
          p.leave += dt * 2.4;
          const e = clamp(p.leave, 0, 1);
          y -= e * e * (y + p.h + 80);
          if (p.leave >= 1) { p.mode = 'gone'; p.el.classList.add('is-out'); return; }
        }
        p.pulse = Math.max(0, p.pulse - dt * 5);
        p.inv = Math.max(0, p.inv - dt);
        if (p.hitT > 0) { p.hitT -= dt; if (p.hitT <= 0) p.el.classList.remove('is-hit'); }
        p.x = clamp(x, p.w / 2 + 4, W - p.w / 2 - 4);
        p.y = y;
        p.a = a;
        if (playing && p.dive && !p.dive.bumped && hitTest(p, ship.x, ship.y - 2, 13)) { p.dive.bumped = true; stunShip(); }
      });

      // Kogels
      for (let i = bullets.length - 1; i >= 0; i--) {
        const b = bullets[i];
        b.x += b.vx * dt; b.y += b.vy * dt; b.rot += dt * 10;
        if (b.y < -24 || b.x < -24 || b.x > W + 24) { bullets.splice(i, 1); continue; }
        for (let j = 0; j < P.length; j++) {
          const p = P[j];
          if (hittable(p) && hitTest(p, b.x, b.y, 4)) { bullets.splice(i, 1); hit(p, b); break; }
        }
      }
      // Vonkjes van de pillen
      for (let i = sparks.length - 1; i >= 0; i--) {
        const q = sparks[i];
        q.t += dt; q.x += q.vx * dt; q.y += q.vy * dt;
        if (playing && Math.abs(q.x - ship.x) < 13 && Math.abs(q.y - ship.y + 2) < 17) { sparks.splice(i, 1); stunShip(); continue; }
        if (q.y > H + 20) sparks.splice(i, 1);
      }
      // Vallende power-up-sterren
      for (let i = drops.length - 1; i >= 0; i--) {
        const d = drops[i];
        d.t += dt;
        d.y += 100 * dt;
        d.x += Math.cos(d.t * 3) * 45 * dt;
        if (playing && Math.hypot(d.x - ship.x, d.y - ship.y) < 32) {
          drops.splice(i, 1);
          triple = 6;
          burst(d.x, d.y, PALETTE, 18, 0.8);
          say('Drievoudig schot ✦', ship.x, ship.y - 54);
          continue;
        }
        if (d.y > H + 20) drops.splice(i, 1);
      }
    }

    /* Tekenen */
    // Zachte gloed per kleur, één keer voorgerenderd en daarna additief gestempeld
    const glows = {};
    function glow(color) {
      if (glows[color]) return glows[color];
      const g = document.createElement('canvas');
      g.width = g.height = 64;
      const gc = g.getContext('2d');
      const rg = gc.createRadialGradient(32, 32, 0, 32, 32, 32);
      rg.addColorStop(0, color);
      rg.addColorStop(0.35, color);
      rg.addColorStop(1, 'rgba(0, 0, 0, 0)');
      gc.globalAlpha = 0.5;
      gc.fillStyle = rg;
      gc.fillRect(0, 0, 64, 64);
      glows[color] = g;
      return g;
    }
    const stamp = (c, color, x, y, size, alpha) => { c.globalAlpha = alpha; c.drawImage(glow(color), x - size / 2, y - size / 2, size, size); };
    function starPath(c, x, y, R, rot) {
      c.beginPath();
      for (let k = 0; k < 8; k++) {
        const rr = k % 2 ? R * 0.38 : R;
        const an = rot + k * Math.PI / 4;
        if (k) c.lineTo(x + Math.cos(an) * rr, y + Math.sin(an) * rr);
        else c.moveTo(x + Math.cos(an) * rr, y + Math.sin(an) * rr);
      }
      c.closePath();
    }
    function drawShip(c) {
      c.save();
      c.translate(ship.x, ship.y + ship.kick * 2.5);
      c.rotate(ship.bank * 0.5);
      if (!narrow) c.scale(1.12, 1.12);
      // gloed en vlam
      const halo = c.createRadialGradient(0, 6, 0, 0, 6, 38);
      halo.addColorStop(0, 'rgba(244, 180, 116, 0.22)');
      halo.addColorStop(1, 'rgba(244, 180, 116, 0)');
      c.fillStyle = halo;
      c.fillRect(-40, -32, 80, 80);
      const fl = 11 + Math.random() * 8 + (state === 'play' ? 6 : 0) + warp * 14;
      const g = c.createLinearGradient(0, 9, 0, 9 + fl * 1.4);
      g.addColorStop(0, 'rgba(246, 186, 131, 0.95)');
      g.addColorStop(0.45, 'rgba(241, 151, 178, 0.75)');
      g.addColorStop(1, 'rgba(180, 166, 255, 0)');
      c.fillStyle = g;
      c.beginPath();
      c.moveTo(-6, 9);
      c.quadraticCurveTo(0, 9 + fl * 1.6, 6, 9);
      c.closePath();
      c.fill();
      // romp
      c.fillStyle = PAPER;
      c.beginPath();
      c.moveTo(0, -23);
      c.bezierCurveTo(5, -15, 8, -5, 9, 3);
      c.lineTo(19, 11); c.lineTo(18, 15); c.lineTo(6, 11.5); c.lineTo(0, 13.5);
      c.lineTo(-6, 11.5); c.lineTo(-18, 15); c.lineTo(-19, 11); c.lineTo(-9, 3);
      c.bezierCurveTo(-8, -5, -5, -15, 0, -23);
      c.fill();
      // cockpit en vleugelstreepjes
      c.fillStyle = '#F2A36B';
      c.beginPath(); c.ellipse(0, -7, 2.7, 5.2, 0, 0, TAU); c.fill();
      c.fillStyle = '#B2A5F2';
      c.fillRect(12.5, 10.5, 4, 2);
      c.fillStyle = '#8EC2E8';
      c.fillRect(-16.5, 10.5, 4, 2);
      // mondingsflits
      if (ship.kick > 0.55) {
        c.globalAlpha = ship.kick;
        c.fillStyle = '#FFF6EA';
        starPath(c, 0, -27, 6 * ship.kick, t * 20);
        c.fill();
        c.globalAlpha = 1;
      }
      c.restore();
    }
    function render() {
      // sterren
      bctx.clearRect(0, 0, W, H);
      const streak = warp > 0.08 ? warp * warp * 26 : 0;
      stars.forEach(s => {
        bctx.globalAlpha = s.al * (0.55 + 0.45 * Math.sin(t * s.tw + s.ph));
        bctx.fillStyle = s.c;
        if (streak) bctx.fillRect(s.x - s.r / 2, s.y - streak * s.sp, s.r, streak * s.sp + s.r);
        else bctx.fillRect(s.x - s.r, s.y - s.r, s.r * 2, s.r * 2);
      });
      bctx.globalAlpha = 1;

      // pillen (DOM)
      P.forEach(p => {
        if (p.mode === 'gone') return;
        p.el.style.transform = `translate3d(${(p.x - p.w / 2).toFixed(1)}px, ${(p.y - p.h / 2).toFixed(1)}px, 0) rotate(${p.a.toFixed(3)}rad) scale(${(1 + p.pulse * 0.14).toFixed(3)})`;
        const op = p.inv > 0 && Math.floor(t * 16) % 2 ? '0.4' : '';
        if (p.el.style.opacity !== op) p.el.style.opacity = op;
      });

      // effectlaag: alles wat licht geeft, additief
      const c = fctx;
      c.clearRect(0, 0, W, H);
      c.globalCompositeOperation = 'lighter';
      rings.forEach(r => {
        const e = 1 - Math.pow(1 - r.life, 3);
        c.globalAlpha = (1 - r.life) * 0.8;
        c.strokeStyle = r.c;
        c.lineWidth = 2.5 * (1 - r.life) + 0.5;
        c.beginPath();
        c.arc(r.x, r.y, r.r0 + (r.r1 - r.r0) * e, 0, TAU);
        c.stroke();
      });
      drops.forEach(d => {
        const pulse = 0.5 + 0.5 * Math.sin(d.t * 8);
        const col = PALETTE[Math.floor(d.t * 6) % PALETTE.length];
        c.fillStyle = col;
        stamp(c, col, d.x, d.y, 64 + pulse * 16, 0.9);
        c.globalAlpha = 1;
        starPath(c, d.x, d.y, 10 + pulse * 2, d.t * 3);
        c.fill();
        c.fillStyle = PAPER;
        starPath(c, d.x, d.y, 4, d.t * 3);
        c.fill();
      });
      sparks.forEach(q => {
        const tail = c.createLinearGradient(q.x, q.y - 22, q.x, q.y);
        tail.addColorStop(0, 'rgba(243, 237, 228, 0)');
        tail.addColorStop(1, q.c);
        c.globalAlpha = 0.55;
        c.strokeStyle = tail;
        c.lineWidth = 3;
        c.lineCap = 'round';
        c.beginPath(); c.moveTo(q.x - q.vx * 0.09, q.y - 22); c.lineTo(q.x, q.y); c.stroke();
        c.fillStyle = q.c;
        stamp(c, q.c, q.x, q.y, 34 + Math.sin(q.t * 18) * 5, 0.9);
        c.globalAlpha = 1;
        c.beginPath(); c.arc(q.x, q.y, 3.6, 0, TAU); c.fill();
        c.fillStyle = '#FFF8EE';
        c.beginPath(); c.arc(q.x, q.y, 1.4, 0, TAU); c.fill();
      });
      bullets.forEach(b => {
        c.fillStyle = b.c;
        stamp(c, b.c, b.x, b.y, 34, 0.8);
        c.globalAlpha = 0.35;
        starPath(c, b.x - b.vx * 0.012, b.y + 11, 3.2, b.rot); c.fill();
        c.globalAlpha = 0.14;
        starPath(c, b.x - b.vx * 0.024, b.y + 21, 2.4, b.rot); c.fill();
        c.globalAlpha = 1;
        starPath(c, b.x, b.y, 6, b.rot); c.fill();
        c.fillStyle = '#FFF8EE';
        c.beginPath(); c.arc(b.x, b.y, 1.5, 0, TAU); c.fill();
      });
      parts.forEach(q => {
        const a = Math.min(1, q.life / q.max * 1.4);
        if (q.r > 2.6) stamp(c, q.c, q.x, q.y, q.r * 6, a * 0.5);
        c.globalAlpha = a;
        c.fillStyle = q.c;
        if (q.star) { starPath(c, q.x, q.y, q.r * 1.6, q.rot); c.fill(); }
        else c.fillRect(q.x - q.r / 2, q.y - q.r / 2, q.r, q.r);
      });
      c.globalAlpha = 1;
      c.globalCompositeOperation = 'source-over';
      // levens van de eindbaas
      P.forEach(p => {
        if (p.mode !== 'wave' || p.max < 2 || p.enter > 0) return;
        for (let k = 0; k < p.max; k++) {
          const x = p.x + (k - (p.max - 1) / 2) * 11, y = p.y + p.h / 2 + 11;
          c.fillStyle = k < p.hp ? '#EF97AB' : 'rgba(243, 237, 228, 0.22)';
          c.beginPath(); c.arc(x, y, 3, 0, TAU); c.fill();
        }
      });
      // Na een treffer knippert het schip even
      if (!(ship.safe > 0 && Math.floor(t * 14) % 2)) drawShip(c);

      // schokje bij een vangst
      if (shake > 0) {
        box.style.setProperty('--sx', ((Math.random() - 0.5) * shake * 6).toFixed(1) + 'px');
        box.style.setProperty('--sy', ((Math.random() - 0.5) * shake * 6).toFixed(1) + 'px');
      } else if (box.style.getPropertyValue('--sx') !== '0px') {
        box.style.setProperty('--sx', '0px');
        box.style.setProperty('--sy', '0px');
      }

      // klok en power-up
      const label = (waves[wave] && state !== 'idle' && !narrow ? `golf ${wave + 1}/${waves.length} · ` : '') + secs(elapsed) + ' s';
      if (label !== lastClock) { lastClock = label; clock.textContent = label; }
      power.classList.toggle('is-on', triple > 0);
      if (triple > 0) power.style.setProperty('--pw', (triple / 6).toFixed(3));
    }

    let visible = false, raf = 0, last = 0;
    function frame(now) {
      const dt = Math.min((now - last) / 1000, 1 / 30);
      last = now;
      update(dt);
      render();
      raf = visible ? requestAnimationFrame(frame) : 0;
    }

    /* Besturing */
    const localX = e => clamp(e.clientX - box.getBoundingClientRect().left, 0, W);
    box.addEventListener('pointermove', e => {
      if (state === 'play' || (state === 'idle' && e.pointerType !== 'touch')) ship.tx = localX(e);
    });
    box.addEventListener('pointerdown', e => {
      if (state !== 'play' || (e.pointerType === 'mouse' && e.button !== 0)) return;
      e.preventDefault();
      ship.tx = localX(e);
      firing = true;
      try { box.setPointerCapture(e.pointerId); } catch (err) { /* oude browser */ }
    });
    ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(type => box.addEventListener(type, () => { firing = false; }));
    box.addEventListener('click', e => {
      if (state === 'play') return;
      if (state === 'won' && !e.target.closest('.game-btn')) return;
      act();
    });
    box.addEventListener('keydown', e => {
      const k = e.key;
      if (e.target !== box) return; // de knop in de kaart handelt Enter en spatie zelf af
      if (state !== 'play') {
        if (k === 'Enter' || k === ' ') { e.preventDefault(); act(); }
        return;
      }
      if (k === 'ArrowLeft' || k === 'a' || k === 'A') keys.l = true;
      else if (k === 'ArrowRight' || k === 'd' || k === 'D') keys.r = true;
      else if (k === ' ' || k === 'ArrowUp') keyFire = true;
      else if (k === 'Escape' || k === 'p' || k === 'P') pause();
      else return;
      e.preventDefault();
    });
    box.addEventListener('keyup', e => {
      const k = e.key;
      if (k === 'ArrowLeft' || k === 'a' || k === 'A') keys.l = false;
      else if (k === 'ArrowRight' || k === 'd' || k === 'D') keys.r = false;
      else if (k === ' ' || k === 'ArrowUp') keyFire = false;
    });
    box.addEventListener('focusout', () => { keys.l = keys.r = keyFire = false; });

    // Uit beeld gescrold of ander tabblad: pauzeren en niet meer tekenen
    new IntersectionObserver(entries => {
      const en = entries[0];
      if (state === 'play' && en.intersectionRatio < 0.35) pause();
      if (en.isIntersecting && !visible) { visible = true; last = performance.now(); raf = requestAnimationFrame(frame); }
      else if (!en.isIntersecting) { visible = false; cancelAnimationFrame(raf); raf = 0; }
    }, { threshold: [0, 0.35] }).observe(box);
    document.addEventListener('visibilitychange', () => { if (document.hidden) pause(); });

    let rt;
    window.addEventListener('resize', () => {
      clearTimeout(rt);
      rt = setTimeout(() => { layout(); if (!visible) { update(0); render(); } }, 150);
    });
    if (document.fonts) document.fonts.ready.then(() => { layout(); update(0); render(); });

    layout();
    setState('idle');
    updateHud();
    update(0);
    render();
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
