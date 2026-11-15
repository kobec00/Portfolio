/* ═══════════════════════════════════════════════════════════
   KOBE CORNELIS — gedeeld script (homepage + videopagina)
   klok · leeftijd · menu · onthullingen · hero (woord, melding, slepen)
   · tijdlijn · Finder · berichten · filmstrook · adres kopiëren
   ═══════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hasIO = 'IntersectionObserver' in window;

  /* ── Klok (Belgische tijd), jaar en leeftijd ── */
  const clocks = $$('[data-clock]');
  if (clocks.length) {
    const fmt = new Intl.DateTimeFormat('nl-BE', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Brussels' });
    const tick = () => { const t = fmt.format(new Date()); clocks.forEach(c => { c.textContent = t; }); };
    tick();
    setInterval(tick, 15000);
  }
  const now = new Date();
  $$('[data-year]').forEach(el => { el.textContent = now.getFullYear(); });
  const born = new Date(2000, 4, 26);
  let age = now.getFullYear() - born.getFullYear();
  if (now < new Date(now.getFullYear(), born.getMonth(), born.getDate())) age--;
  $$('[data-age]').forEach(el => { el.textContent = age; });
  // beschikbaar vanaf 1 januari 2027: vanaf die dag toont elke [data-avail] zijn "nu"-tekst
  if (now >= new Date(2027, 0, 1)) $$('[data-avail]').forEach(el => { el.textContent = el.dataset.avail; });

  /* ── Uitklapmenu (mobiel) ── */
  const toggle = $('.mb-toggle');
  const menu = $('#dropmenu');
  if (toggle && menu) {
    const setOpen = open => {
      menu.classList.toggle('is-open', open);
      toggle.setAttribute('aria-expanded', String(open));
      toggle.textContent = open ? 'sluit' : 'menu';
    };
    toggle.addEventListener('click', e => { e.stopPropagation(); setOpen(!menu.classList.contains('is-open')); });
    menu.addEventListener('click', e => { if (e.target.closest('a')) setOpen(false); });
    document.addEventListener('click', e => { if (!menu.contains(e.target)) setOpen(false); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape') setOpen(false); });
  }

  /* ── Navigatie: schuivende markering volgt de actieve sectie (en de muis) ── */
  const navLinks = $('.nav-links');
  const links = $$('.nav-links a[href^="#"]:not([data-filter])');
  if (navLinks) {
    let current = null;
    const moveTo = a => {
      if (!a) { navLinks.style.setProperty('--o', 0); return; }
      navLinks.style.setProperty('--x', a.offsetLeft + 'px');
      navLinks.style.setProperty('--w', a.offsetWidth + 'px');
      navLinks.style.setProperty('--o', 1);
    };
    $$('a', navLinks).forEach(a => a.addEventListener('mouseenter', () => moveTo(a)));
    navLinks.addEventListener('mouseleave', () => moveTo(current));
    window.addEventListener('resize', () => moveTo(current));
    if (links.length && hasIO) {
      const byId = new Map(links.map(a => [a.getAttribute('href').slice(1), a]));
      const io = new IntersectionObserver(entries => {
        entries.forEach(en => {
          if (!en.isIntersecting) return;
          links.forEach(a => a.classList.remove('is-active'));
          current = byId.get(en.target.id) || null;
          if (current) current.classList.add('is-active');
          if (!navLinks.matches(':hover')) moveTo(current);
        });
      }, { rootMargin: '-45% 0px -50% 0px' });
      $$('main section').forEach(s => io.observe(s));
    }
  }

  /* ── Bedieningspaneel: rustige modus, accentkleur, leesvoortgang, datum ── */
  const root = document.documentElement;
  const store = {
    get: k => { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set: (k, v) => { try { localStorage.setItem(k, v); } catch (e) { /* privévenster */ } }
  };
  const ACCENTS = {
    blue: ['#0f7fff', '#221898', 'linear-gradient(#edf4ff 0%, #d6e7ff 18%, #a2c7ff 50%, #99cbf8 80%, #a2d2f7 100%)'],
    purple: ['#8a5cf6', '#3f1f9a', 'linear-gradient(#f3eeff 0%, #e2d6ff 18%, #c0a6ff 50%, #bfa9fb 80%, #cbb8fb 100%)'],
    pink: ['#f0468a', '#9a1d52', 'linear-gradient(#fff0f5 0%, #ffd9e6 18%, #ffa6c4 50%, #fba3c0 80%, #fbb1cb 100%)'],
    orange: ['#f58a1f', '#96500f', 'linear-gradient(#fff5ea 0%, #ffe4c7 18%, #ffc48a 50%, #fbbf83 80%, #fbc995 100%)'],
    green: ['#28a745', '#17642a', 'linear-gradient(#eefbf0 0%, #d3f3d9 18%, #9fe0ab 50%, #98dba5 80%, #a8e2b3 100%)'],
    graphite: ['#6e6e73', '#3a3a3e', 'linear-gradient(#fbfbfb 0%, #ededed 42%, #dcdce0 100%)']
  };
  const setAccent = name => {
    const a = ACCENTS[name] || ACCENTS.blue;
    root.style.setProperty('--accent', a[0]);
    root.style.setProperty('--edge-blue', a[1]);
    root.style.setProperty('--gloss-blue', a[2]);
    $$('[data-accent]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.accent === name)));
  };
  const setCalm = on => {
    root.classList.toggle('calm', on);
    $$('[data-calm]').forEach(b => b.setAttribute('aria-pressed', String(on)));
    $$('[data-calm-label]').forEach(l => { l.textContent = on ? 'aan' : 'uit'; });
  };
  const isCalm = () => reduceMotion || root.classList.contains('calm');
  setAccent(store.get('accent') || 'blue');
  setCalm(store.get('calm') === '1');
  $$('[data-accent]').forEach(b => b.addEventListener('click', () => { setAccent(b.dataset.accent); store.set('accent', b.dataset.accent); }));
  $$('[data-calm]').forEach(b => b.addEventListener('click', () => { const on = !root.classList.contains('calm'); setCalm(on); store.set('calm', on ? '1' : '0'); }));
  $$('[data-date]').forEach(el => {
    el.textContent = new Intl.DateTimeFormat('nl-BE', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'Europe/Brussels' }).format(now);
  });

  const cc = $('#cc');
  const ccBtn = $('.cc-btn');
  if (cc && ccBtn) {
    const setCC = open => { cc.classList.toggle('is-open', open); ccBtn.setAttribute('aria-expanded', String(open)); };
    ccBtn.addEventListener('click', e => { e.stopPropagation(); setCC(!cc.classList.contains('is-open')); });
    document.addEventListener('click', e => { if (!cc.contains(e.target)) setCC(false); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape') setCC(false); });
  }

  // het batterijtje vult zich naarmate je verder leest
  const reads = $$('[data-read]');
  let readQueued = false;
  const updateRead = () => {
    readQueued = false;
    const max = root.scrollHeight - window.innerHeight;
    const p = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
    root.style.setProperty('--read', p.toFixed(3));
    reads.forEach(el => { el.textContent = Math.round(p * 100) + '%'; });
  };
  window.addEventListener('scroll', () => { if (!readQueued) { readQueued = true; requestAnimationFrame(updateRead); } }, { passive: true });
  updateRead();

  /* ── In beeld: onthullen ([data-reveal]) en animaties starten ([data-watch]) ── */
  const countUp = el => {
    const target = parseInt(el.dataset.count, 10);
    const t0 = performance.now(), dur = 1500;
    const step = t => {
      const k = Math.min((t - t0) / dur, 1);
      el.textContent = Math.round(target * (1 - Math.pow(1 - k, 3)));
      if (k < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };
  const watched = $$('[data-reveal], [data-watch]');
  if (hasIO && !reduceMotion) {
    const io = new IntersectionObserver(entries => {
      entries.forEach(en => {
        if (!en.isIntersecting) return;
        en.target.classList.add('is-in');
        $$('[data-count]', en.target).forEach(countUp);
        io.unobserve(en.target);
      });
    }, { rootMargin: '0px 0px -10% 0px', threshold: 0.15 });
    watched.forEach(el => io.observe(el));
  } else {
    watched.forEach(el => el.classList.add('is-in'));
  }

  /* ── Hero: wisselend woord (typen en wissen) ── */
  const rot = $('[data-rotate]');
  if (rot && !reduceMotion) {
    const words = rot.dataset.rotate.split('|');
    let w = 0;
    const type = (text, i, done) => {
      rot.textContent = text.slice(0, i);
      if (i < text.length) setTimeout(() => type(text, i + 1, done), 55 + Math.random() * 45);
      else done();
    };
    const erase = done => {
      const t = rot.textContent;
      if (!t.length) return done();
      rot.textContent = t.slice(0, -1);
      setTimeout(() => erase(done), 28);
    };
    const next = () => {
      if (isCalm()) { setTimeout(next, 2600); return; }
      rot.classList.add('is-typing');
      erase(() => {
        w = (w + 1) % words.length;
        type(words[w], 1, () => { rot.classList.remove('is-typing'); setTimeout(next, 2600); });
      });
    };
    setTimeout(next, 3200);
  }

  /* ── macOS-meldingen rechtsboven ── */
  const notif = $('[data-notif]');
  let notifTimer, notifWatch;
  const hideNotif = () => {
    if (!notif) return;
    notif.classList.remove('is-on');
    clearTimeout(notifTimer);
    if (notifWatch) { notifWatch.disconnect(); notifWatch = null; }
  };
  const inView = el => { const r = el.getBoundingClientRect(); return r.bottom > 80 && r.top < window.innerHeight - 80; };
  const notify = (title, text, anchor, ms = 7000) => {
    if (!notif || (anchor && !inView(anchor))) return;
    hideNotif();
    notif.innerHTML = '<i class="app-ico"><svg viewBox="0 0 64 64" aria-hidden="true"><path d="M22 15v34M22 35 40 15M28.5 28.5 42 49"/></svg></i><div><strong><b></b><small>nu</small></strong><span></span></div>';
    $('b', notif).textContent = title;
    $('div > span', notif).textContent = text;
    // meteen tonen (geen uitgestelde frame): zo kan een melding nooit later op een andere plek opduiken
    void notif.offsetWidth;
    notif.classList.add('is-on');
    notifTimer = setTimeout(hideNotif, ms);
    if (anchor && hasIO) {
      notifWatch = new IntersectionObserver(en => { if (!en[0].isIntersecting) hideNotif(); });
      notifWatch.observe(anchor);
    }
  };
  if (notif) {
    notif.addEventListener('click', hideNotif);
    // de welkomstmelding hoort bij het bureaublad: alleen tonen als dat in beeld is
    const deskEl = $('[data-desk]');
    if (deskEl && window.matchMedia('(min-width: 1000px)').matches) {
      setTimeout(() => notify('welkom 👋', 'Sleep de vensters en mapjes gerust rond.', deskEl), 1400);
    }
  }

  /* ── Tabbladen (Over mij, Projecten) ── */
  const initTabs = (el, onShow) => {
    const tabs = $$('[role="tab"]', el);
    const select = (tab, focus) => {
      tabs.forEach(t => {
        const on = t === tab;
        const panel = document.getElementById(t.getAttribute('aria-controls'));
        t.setAttribute('aria-selected', String(on));
        t.tabIndex = on ? 0 : -1;
        panel.hidden = !on;
        if (on && onShow) onShow(panel);
      });
      if (focus) tab.focus();
    };
    tabs.forEach((tab, i) => {
      tab.addEventListener('click', () => select(tab));
      tab.addEventListener('keydown', e => {
        const d = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 }[e.key];
        if (!d) return;
        e.preventDefault();
        select(tabs[(i + d + tabs.length) % tabs.length], true);
      });
    });
    select(tabs[0]);
    return select;
  };

  /* ── Over mij: "Over deze Mac" ── */
  $$('[data-tabs]').forEach(el => initTabs(el, panel => {
    // balken en tellers starten telkens wanneer het tabblad opengaat
    panel.classList.remove('is-in');
    requestAnimationFrame(() => requestAnimationFrame(() => {
      panel.classList.add('is-in');
      if (!reduceMotion) $$('[data-count]', panel).forEach(countUp);
    }));
  }));

  /* ── Competenties: zoeken en schakelaars ── */
  const setSearch = $('[data-set-search]');
  if (setSearch) {
    const rows = $$('.set-row');
    const empty = $('.set-empty');
    setSearch.addEventListener('input', () => {
      const q = setSearch.value.trim().toLowerCase();
      let shown = 0;
      rows.forEach(r => {
        const hit = !q || r.textContent.toLowerCase().includes(q);
        r.hidden = !hit;
        if (hit) shown++;
      });
      if (empty) empty.hidden = shown > 0;
    });
  }
  $$('button.switch').forEach(sw => {
    const name = sw.closest('.set-row').querySelector('h3').textContent;
    sw.setAttribute('aria-label', name);
    sw.addEventListener('click', () => {
      if (sw.classList.contains('is-off')) return;
      sw.classList.add('is-off');
      sw.setAttribute('aria-checked', 'false');
      say('die laat ik liever aan staan 😉');
      setTimeout(() => { sw.classList.remove('is-off'); sw.setAttribute('aria-checked', 'true'); }, 900);
    });
  });

  /* ── Hero: versleepbaar bureaublad ── */
  const desk = $('[data-desk]');
  const deskMode = window.matchMedia('(min-width: 1000px)');
  if (desk) {
    let top = 10;
    $$('.desk-item', desk).forEach(item => {
      let startX, startY, baseX = 0, baseY = 0, moved = false, active = false;
      item.addEventListener('dragstart', e => e.preventDefault());
      item.addEventListener('pointerdown', e => {
        if (!deskMode.matches || e.button !== 0) return;
        active = true; moved = false;
        startX = e.clientX; startY = e.clientY;
        item.style.zIndex = ++top;
        item.setPointerCapture(e.pointerId);
      });
      item.addEventListener('pointermove', e => {
        if (!active) return;
        const dx = e.clientX - startX, dy = e.clientY - startY;
        if (!moved && Math.hypot(dx, dy) < 5) return;
        if (!moved) { moved = true; item.classList.add('is-drag'); }
        item.style.setProperty('--dx', (baseX + dx) + 'px');
        item.style.setProperty('--dy', (baseY + dy) + 'px');
      });
      const end = e => {
        if (!active) return;
        active = false;
        if (moved) { baseX += e.clientX - startX; baseY += e.clientY - startY; }
        item.classList.remove('is-drag');
      };
      item.addEventListener('pointerup', end);
      item.addEventListener('pointercancel', end);
      // een sleepbeweging mag de link niet openen
      item.addEventListener('click', e => { if (moved) { e.preventDefault(); e.stopImmediatePropagation(); moved = false; } });
    });
  }

  /* ── Hero: plaknotitie afvinken en Bink laten blaffen ── */
  $$('[data-todo] li').forEach(li => li.addEventListener('click', () => {
    const done = li.classList.toggle('is-done');
    li.firstElementChild.textContent = done ? '✓' : '☐';
  }));
  $$('[data-woof]').forEach(el => {
    let t;
    el.addEventListener('click', () => {
      el.classList.add('is-woof');
      clearTimeout(t);
      t = setTimeout(() => el.classList.remove('is-woof'), 1100);
    });
  });

  /* ── Tijdlijn: de lijn groeit mee met het scrollen ── */
  const tl = $('[data-timeline]');
  if (tl) {
    const items = $$('.tl-item', tl);
    // totaalbalk: telt de uren op van de stages die je al voorbij bent
    const hoursEl = $('[data-tl-hours]');
    const segs = $$('.tl-total-bar i');
    const staged = items.filter(i => i.dataset.hours);
    let shownHours = -1;
    const updateTotal = () => {
      let sum = 0;
      staged.forEach((it, n) => {
        const on = it.classList.contains('is-on');
        if (on) sum += +it.dataset.hours;
        if (segs[n]) segs[n].classList.toggle('is-on', on);
      });
      if (sum === shownHours || !hoursEl) return;
      const from = Math.max(0, shownHours), t0 = performance.now();
      shownHours = sum;
      const step = t => {
        const k = Math.min((t - t0) / 600, 1);
        hoursEl.textContent = Math.round(from + (sum - from) * k);
        if (k < 1 && shownHours === sum) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    };
    if (reduceMotion) {
      tl.style.setProperty('--p', 1);
      items.forEach(i => i.classList.add('is-on'));
      segs.forEach(s => s.classList.add('is-on'));
    } else {
      let queued = false;
      const update = () => {
        queued = false;
        const r = tl.getBoundingClientRect();
        const line = window.innerHeight * 0.62;
        const p = Math.max(0, Math.min(1, (line - r.top - 26) / (r.height - 86)));
        tl.style.setProperty('--p', p.toFixed(4));
        items.forEach(i => {
          if (i.getBoundingClientRect().top + 28 < line) i.classList.add('is-on');
        });
        updateTotal();
      };
      const onScroll = () => { if (!queued) { queued = true; requestAnimationFrame(update); } };
      window.addEventListener('scroll', onScroll, { passive: true });
      window.addEventListener('resize', onScroll);
      update();
    }
  }

  /* ── Projecten: Finder-venster met tabs ── */
  const finder = $('[data-finder]');
  if (finder) {
    const select = initTabs(finder);
    // tip zodra je bij de projecten aankomt: de bestanden zijn klikbaar
    if (hasIO) {
      const io = new IntersectionObserver(entries => {
        if (!entries[0].isIntersecting) return;
        io.disconnect();
        notify('tip · projecten', 'Klik links op een bestand om tussen de projecten te wisselen.', finder, 8000);
      }, { threshold: 0.45 });
      io.observe(finder);
    }
    // een venster in de hero opent meteen het juiste bestand
    $$('[data-open]').forEach(a => a.addEventListener('click', () => {
      const t = document.getElementById(a.dataset.open);
      if (t) select(t);
    }));
  }

  /* ── Contact: berichten verschijnen één voor één ── */
  const chat = $('[data-chat]');
  if (chat) {
    const bubbles = $$('.b', chat);
    const typing = $('.typing', chat);
    if (reduceMotion || !hasIO) {
      bubbles.forEach(b => b.classList.add('is-shown'));
    } else {
      const play = i => {
        if (i >= bubbles.length) return;
        bubbles[i].before(typing);
        typing.classList.add('is-on');
        setTimeout(() => {
          typing.classList.remove('is-on');
          bubbles[i].classList.add('is-shown');
          setTimeout(() => play(i + 1), 450);
        }, 700 + bubbles[i].textContent.length * 14);
      };
      const io = new IntersectionObserver(entries => {
        if (!entries[0].isIntersecting) return;
        io.disconnect();
        setTimeout(() => play(0), 400);
      }, { threshold: 0.5 });
      io.observe(chat);
    }
  }

  /* ── Cover Flow op de homepage ── */
  const flow = $('[data-cflow]');
  if (flow) {
    const films = [
      ['1aSgwH5nDEA', 'Febe & Seppe', '2024 · trouwfilm'], ['LOpTFsjrGvw', 'Kinderboek voor Lannoo', '2021 · stop-motion'],
      ['PwpixmMHLhE', 'The Smoky Mountains', '2019 · reisfilm'], ['4OBGTtQVUYo', 'Ines & Sander', '2021 · trouwfilm'],
      ['WDYyBPZgw1M', 'New York City', '2018 · reisfilm'], ['s_slyU9heV4', 'Louis Cornelis · 1936–2023', '2020 · reportage'],
      ['Aky2uWTmonw', 'Schotland', '2018 · reisfilm'], ['Q8kLe0-2gnc', 'Caroline & Bram', '2019 · trouwfilm'],
      ['ZKUQl-iN1tE', 'Euromillions Volley League', '2021 · teaser']
    ];
    const stage = $('.cflow-stage', flow);
    const range = $('input', flow);
    const capTitle = $('.cflow-cap b', flow), capMeta = $('.cflow-cap span', flow);
    let active = 2, hover = false, visible = false;

    const items = films.map(([id, title], i) => {
      const a = document.createElement('a');
      a.className = 'cflow-item';
      a.href = 'video/';
      a.setAttribute('aria-label', title);
      a.tabIndex = -1;
      const src = `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
      a.innerHTML = `<img class="cover" src="${src}" alt=""><img class="refl" src="${src}" alt="" aria-hidden="true">`;
      a.addEventListener('click', e => { if (i !== active) { e.preventDefault(); go(i); } });
      stage.appendChild(a);
      return a;
    });
    range.max = films.length - 1;

    // pas tonen wanneer alle kaften (en dus ook hun spiegelingen) geladen zijn
    const ready = () => stage.classList.add('is-ready');
    Promise.all($$('img.cover', stage).map(img => img.complete ? null : new Promise(res => { img.onload = img.onerror = res; }))).then(ready);
    setTimeout(ready, 4000);

    function go(i) {
      active = Math.max(0, Math.min(films.length - 1, i));
      const w = items[0].offsetWidth;
      items.forEach((el, n) => {
        const d = n - active, s = Math.sign(d);
        el.classList.toggle('is-current', d === 0);
        el.style.zIndex = 50 - Math.abs(d);
        el.style.opacity = Math.abs(d) > 4 ? 0 : 1;
        el.style.transform = d === 0
          ? 'translateX(-50%) translateZ(0)'
          : `translateX(calc(-50% + ${s * w * 0.64 + d * w * 0.2}px)) translateZ(${-w * 0.42}px) rotateY(${-s * 62}deg)`;
      });
      capTitle.textContent = films[active][1];
      capMeta.textContent = films[active][2];
      range.value = active;
      range.setAttribute('aria-valuetext', films[active][1]);
    }

    range.addEventListener('input', () => go(+range.value));
    $$('[data-step]', flow).forEach(b => b.addEventListener('click', () => go(active + +b.dataset.step)));
    flow.addEventListener('keydown', e => {
      if (e.key === 'ArrowLeft') { e.preventDefault(); go(active - 1); }
      if (e.key === 'ArrowRight') { e.preventDefault(); go(active + 1); }
      if (e.key === 'Enter' && e.target === flow) window.location.href = 'video/';
    });
    flow.addEventListener('mouseenter', () => { hover = true; });
    flow.addEventListener('mouseleave', () => { hover = false; });
    flow.addEventListener('focusin', () => { hover = true; });
    flow.addEventListener('focusout', () => { hover = false; });
    window.addEventListener('resize', () => go(active));
    if (hasIO) new IntersectionObserver(en => { visible = en[0].isIntersecting; }, { threshold: 0.4 }).observe(flow);

    // bladert vanzelf verder zolang je er niet mee bezig bent
    let dir = 1;
    setInterval(() => {
      if (!visible || hover || isCalm() || document.hidden) return;
      if (active + dir < 0 || active + dir > films.length - 1) dir = -dir;
      go(active + dir);
    }, 3200);
    go(active);
  }

  /* ── E-mailadres kopiëren ── */
  const toast = $('.toast');
  let toastTimer;
  const say = msg => {
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.add('is-on');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('is-on'), 2200);
  };
  $$('[data-copy]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const text = btn.dataset.copy;
      try {
        await navigator.clipboard.writeText(text);
        say('adres gekopieerd ✓');
      } catch (err) {
        say(text);
      }
    });
  });
})();
