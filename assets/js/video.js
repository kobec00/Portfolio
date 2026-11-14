/* ═══════════════════════════════════════════════════════════
   VIDEOGRAFIE — filmbibliotheek, filter en lightbox.
   Films beheer je in de FILMS-lijst hieronder: voeg een object toe
   en de kaart, de tellers en de lightbox volgen automatisch.
   ═══════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  const FILMS = [
    // ── TROUWFILMS ──
    { id: '1aSgwH5nDEA', cat: 'wedding', title: 'Febe & Seppe', desc: 'De trouw van mijn zus en meteen ook mijn meest recente werk. Warm en persoonlijk in beeld gebracht.', year: '2024', format: 'Trouwfilm' },
    { id: '4OBGTtQVUYo', cat: 'wedding', title: 'Ines & Sander', desc: 'Ceremonie en feest samengebracht tot één rustig, filmisch geheel.', year: '2021', format: 'Trouwfilm' },
    { id: 'Q8kLe0-2gnc', cat: 'wedding', title: 'Caroline & Bram', desc: 'Mijn allereerste trouwfilm. Waar het allemaal begon.', year: '2019', format: 'Trouwfilm' },
    // ── REISBEELDEN & PROJECTEN ──
    { id: 'LOpTFsjrGvw', cat: 'other', title: 'Kinderboek voor Lannoo', desc: 'Stop-motion advertentie voor uitgeverij Lannoo. Frame voor frame opgebouwd.', year: '2021', format: 'Stop-motion' },
    { id: 's_slyU9heV4', cat: 'other', title: 'Louis Cornelis · 1936–2023', desc: 'Een mini-reportage over mijn grootvader. Een persoonlijk portret en het verhaal van een leven.', year: '2020', format: 'Reportage' },
    { id: 'PwpixmMHLhE', cat: 'other', title: 'The Smoky Mountains', desc: 'Sfeerbeelden uit Tennessee, gefilmd tijdens mijn uitwisseling. Natuur in 4K.', year: '2019', format: 'Reisfilm · 4K' },
    { id: 'Aky2uWTmonw', cat: 'other', title: 'Schotland', desc: 'Een van mijn eerste reisvideo’s. Ruige landschappen en sfeerbeelden uit de Schotse Highlands.', year: '2018', format: 'Reisfilm' },
    { id: 'WDYyBPZgw1M', cat: 'other', title: 'New York City', desc: 'Het ritme en de energie van de stad tijdens mijn WEP-uitwisseling.', year: '2018', format: 'Reisfilm' },
    { id: 'ZKUQl-iN1tE', cat: 'other', title: 'Euromillions Volley League', desc: 'Teaservideo met sportieve energie en een dynamische montage.', year: '2021', format: 'Teaser' }
  ];

  /* Kop en inleiding per filter. */
  const INTRO = {
    all: { title: 'de breedte van wat ik maak', lead: 'Van trouwfilms en sfeerbeelden op reis tot commerciële opdrachten en een persoonlijke reportage.' },
    wedding: { title: 'de dag, opnieuw beleefd', lead: 'De dag zelf vliegt voorbij. Met een trouwfilm beleef je hem opnieuw. Die ene blik, de lach, het feest. Ik beweeg ongezien mee tussen de gasten en vang de echte momenten.' },
    other: { title: 'de breedte van wat ik maak', lead: 'Van sfeerbeelden op reis tot commerciële opdrachten en een persoonlijke reportage.' }
  };

  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const slug = s => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/&/g, 'en').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

  /* YouTube geeft niet voor elke film een maxres-beeld: val terug op hq. */
  function thumb(img, id) {
    const fallback = () => { img.onerror = null; img.onload = null; img.src = `https://i.ytimg.com/vi/${id}/hqdefault.jpg`; };
    img.onerror = fallback;
    img.onload = () => { if (img.naturalWidth && img.naturalWidth <= 120) fallback(); };
    if (img.complete && img.naturalWidth && img.naturalWidth <= 120) fallback();
  }

  /* ── Kaarten opbouwen ── */
  const grid = $('#filmGrid');
  const cards = FILMS.map(f => {
    const el = document.createElement('article');
    el.className = 'film';
    el.dataset.cat = f.cat;
    el.innerHTML = `
      <button class="film-frame" type="button" data-id="${esc(f.id)}" data-title="${esc(f.title)}" aria-label="Speel ${esc(f.title)} af">
        <img loading="lazy" decoding="async" alt="" src="https://i.ytimg.com/vi/${esc(f.id)}/maxresdefault.jpg">
        <span class="play play--sm"><svg aria-hidden="true"><use href="#i-play"/></svg>speel af</span>
      </button>
      <div class="film-meta">
        <small>${esc(f.year)} · ${esc(f.format)}</small>
        <h3>${esc(f.title)}</h3>
        <p>${esc(f.desc)}</p>
      </div>`;
    thumb($('img', el), f.id);
    if (grid) grid.appendChild(el);
    return el;
  });
  $$('[data-film-count]').forEach(el => { el.textContent = FILMS.length; });
  $$('img[data-yt]').forEach(img => thumb(img, img.dataset.yt));

  /* ── Filter ── */
  const segs = $$('.seg button');
  const count = cat => FILMS.filter(f => cat === 'all' || f.cat === cat).length;
  segs.forEach(b => { $('small', b).textContent = count(b.dataset.cat); });

  function filter(cat) {
    let n = 0;
    cards.forEach(el => {
      const show = cat === 'all' || el.dataset.cat === cat;
      el.hidden = !show;
      if (show) {
        el.style.setProperty('--n', n++);
        el.style.animation = 'none';
        void el.offsetWidth;          // animatie opnieuw starten
        el.style.animation = '';
      }
    });
    segs.forEach(b => b.setAttribute('aria-pressed', String(b.dataset.cat === cat)));
    const intro = INTRO[cat] || INTRO.all;
    const t = $('[data-lib-title]'), l = $('[data-lib-lead]'), p = $('[data-lib-pride]'), s = $('[data-lib-status]');
    if (t) t.textContent = intro.title;
    if (l) l.textContent = intro.lead;
    if (p) p.hidden = cat !== 'wedding';
    if (s) s.textContent = n + (n === 1 ? ' film' : ' films');
  }
  segs.forEach(b => b.addEventListener('click', () => filter(b.dataset.cat)));
  $$('a[data-filter]').forEach(a => a.addEventListener('click', () => filter(a.dataset.filter)));
  filter('all');

  /* ── Lightbox (native dialog: focus-trap en Escape gratis) ── */
  const lb = $('#lightbox');
  const frame = $('#lbFrame');
  const title = $('#lbTitle');
  let opener = null;

  document.addEventListener('click', e => {
    const btn = e.target.closest('.film-frame');
    if (!btn || !lb) return;
    if (!lb.showModal) { window.open(`https://www.youtube.com/watch?v=${btn.dataset.id}`, '_blank', 'noopener'); return; }
    opener = btn;
    title.textContent = slug(btn.dataset.title) + '.mov';
    frame.src = `https://www.youtube-nocookie.com/embed/${btn.dataset.id}?autoplay=1&rel=0&modestbranding=1`;
    lb.showModal();
  });
  if (lb) {
    $('#lbClose').addEventListener('click', () => lb.close());
    lb.addEventListener('click', e => { if (e.target === lb) lb.close(); });
    lb.addEventListener('close', () => { frame.src = 'about:blank'; if (opener) opener.focus(); });
  }
})();
