/* Minimal stand-in for the Claude dashboard runtime, so the same page code runs on a plain website. */
(function () {
  'use strict';
  const DEFAULTS = { lang: 'en', mode: 'net', day: null, trade: null };
  const SOURCES = { trades: 'data/trades.json', days: 'data/days.json', bars: 'data/bars.json', rules: 'data/rules.json' };
  const DATA = {}, CALCS = [], DRAWS = {}, ON = [];
  let params = Object.assign({}, DEFAULTS);
  try { const l = new URLSearchParams(location.search).get('lang'); if (l === 'fr' || l === 'en') params.lang = l; } catch (e) { /* ignore */ }
  let started = false, pending = false;
  const safe = (fn, label) => { try { return fn(); } catch (e) { console.error('[road-to-funded]', label, e); return undefined; } };
  const shown = (el) => !el.closest('[hidden]');
  const runDraw = (name) => {
    const d = DRAWS[name];
    if (!d) return;
    document.querySelectorAll('[data-draw="' + name + '"]').forEach((el) => {
      if (!shown(el)) return;
      safe(() => {
        if (typeof d === 'function') d(el);
        else { if (!el.__rtfMade) el.__rtfMade = d.mount ? d.mount(el) || true : true; if (d.update) d.update(el, el.__rtfMade); }
      }, name);
    });
  };
  const renderAll = () => { ON.forEach((f) => safe(f, 'onData')); Object.keys(DRAWS).forEach(runDraw); };
  const schedule = () => { if (!started || pending) return; pending = true; requestAnimationFrame(() => { pending = false; renderAll(); }); };
  window.dash = {
    data: (id) => DATA[id] || { status: 'loading', data: [], meta: [], columns: [] },
    calc: (id, def) => { CALCS.push(Object.assign({ id }, def)); },
    loader: () => {},
    draw: (name, fn) => { if (fn === undefined) { if (started) runDraw(name); return; } DRAWS[name] = fn; },
    onData: (fn) => { ON.push(fn); safe(fn, 'onData'); },
    params: () => Object.assign({}, params),
    setParams: (p) => { Object.keys(p || {}).forEach((k) => { params[k] = p[k]; }); schedule(); },
    resetParams: () => { params = Object.assign({}, DEFAULTS); schedule(); },
    setLink: (name) => { try { history.replaceState(null, '', location.pathname + location.search + '#' + name); } catch (e) { /* ignore */ } },
    refresh: () => {},
    colors: ['#2BD47E', '#4EA8FF', '#FFB224', '#8B7CFF', '#F25C6E', '#FF9BD2', '#15F5BA', '#BAC4D6'],
  };
  window.RTFSHIM = {
    load: async () => {
      await Promise.all(Object.keys(SOURCES).map(async (id) => {
        try {
          const r = await fetch(SOURCES[id], { cache: 'no-cache' });
          if (!r.ok) throw new Error('HTTP ' + r.status);
          const rows = await r.json();
          DATA[id] = { status: 'ok', data: rows, meta: [], columns: rows.length ? Object.keys(rows[0]) : [] };
        } catch (e) { DATA[id] = { status: 'error', data: [], meta: [], columns: [], message: String(e) }; }
      }));
      CALCS.forEach((c) => {
        const args = c.inputs.map((i) => (DATA[i] && DATA[i].status === 'ok' ? DATA[i].data : []));
        const out = safe(() => c.fn.apply(null, args), 'calc ' + c.id);
        DATA[c.id] = out === undefined ? { status: 'error', data: [], meta: [] } : { status: 'ok', data: out, meta: [] };
      });
      started = true;
      renderAll();
      new MutationObserver((ms) => { if (ms.some((m) => m.target.classList && m.target.classList.contains('rtf-pane'))) schedule(); })
        .observe(document.body, { attributes: true, subtree: true, attributeFilter: ['hidden'] });
      let lastW = document.body.clientWidth;
      window.addEventListener('resize', () => { const w = document.body.clientWidth; if (Math.abs(w - lastW) > 4) { lastW = w; schedule(); } });
    },
  };
})();
