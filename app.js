/* Road to 5 Live: Louis's public trading journal. Plain JS, no dependencies. Data: data/*.json */
(() => {
  'use strict';
  const RM = !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const safe = (fn, d = null) => { try { return fn(); } catch (e) { return d; } };
  const local = { get: k => safe(() => localStorage.getItem(k)), set: (k, v) => safe(() => localStorage.setItem(k, v)) };
  const sess = { get: k => safe(() => sessionStorage.getItem(k)), set: (k, v) => safe(() => sessionStorage.setItem(k, v)) };
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const MINUS = '−';

  /* ---------- words ---------- */
  const W = {
    en: {
      intro: 'My live trading journal. The goal: five live 25K accounts at Lucid Trading. Every trade goes here, nothing gets deleted.',
      keys: ['ACCTS', 'CHART', 'LOG', 'TRADES', 'STATS', 'WATCH'], heads: ['ACCOUNTS', 'BALANCE', 'LOG', 'TRADES', 'STATS', 'WEEKLY WATCH'],
      last: 'LAST SESSION', paris: 'PARIS', cmeO: 'CME OPEN', cmeC: 'CME CLOSED',
      started: n => `${n} of 5 started`, stages: ['EVAL', 'FUNDED', 'PAYOUT', 'LIVE'],
      leadEval: (net, tgt, go) => `Account 1 is in its evaluation: <b>${net}</b> of the ${tgt} target. <b>${go}</b> to go.`,
      leadDone: 'Account 1 has hit its evaluation target.',
      floor: 'FLOOR', floorNote: 'touch it and the account is gone', cushion: 'CUSHION', days: 'DAYS', trades: 'TRADES',
      path: 'All five go live together, so each one needs a first payout before that.',
      balR: 'account 1', hint: 'Tap or hover the curve to read each trade.', target: 'TARGET', start: 'START',
      logR: 'newest first', day: 'DAY', tw: (n, w) => `${n} trade${n > 1 ? 's' : ''}, ${w} won`,
      sess: { asia: 'Asia', london: 'London', ny: 'New York' }, sessS: { asia: 'ASIA', london: 'LDN', ny: 'NY' },
      score: 'my discipline, out of 10', readAll: 'Read all', less: 'Less', showDay: n => (n === 1 ? 'Show the trade' : `Show the ${n} trades`), hideDay: n => (n === 1 ? 'Hide the trade' : 'Hide the trades'),
      cols5: ['TIME', 'SESS', 'SIDE', 'ENTRY', 'EXIT', 'HELD', 'POINTS', 'NET'], cols6: ['#', 'DATE', 'TIME', 'SESS', 'SIDE', 'ENTRY', 'EXIT', 'HELD', 'POINTS', 'NET'],
      next: 'scroll or press', accOpen: 'Open this account: rules, payouts and its own stats',
      fRes: [['all', 'ALL'], ['win', 'WINS'], ['loss', 'LOSSES']], fSess: [['all', 'ALL'], ['asia', 'ASIA'], ['london', 'LDN'], ['ny', 'NY']],
      trR: n => `${n} trades`, showAll: n => `Show all ${n}`, showLess: 'Show fewer', none: 'No trade matches these filters.',
      entry: 'ENTRY', exit: 'EXIT', held: 'HELD', points: 'POINTS', net: 'NET', fees: 'FEES', session: 'SESSION', vwap: 'VWAP DIST',
      mae: 'MAE', mfe: 'MFE', chartCap: 'MNQ 1-minute candles. Session VWAP with its 1σ and 2σ bands. Paris time.',
      noBars: 'No candles for this trade.', loading: 'Loading the candles…', inVideo: 'In a TikTok video.',
      stR: 'all trades', wr: 'Win rate', pf: 'Profit factor', aw: 'Average win', al: 'Average loss', best: 'Best trade', worst: 'Worst trade',
      hold: 'Median hold', feesPaid: 'Fees paid', bySess: 'BY SESSION', bySide: 'BY SIDE', long: 'LONG', short: 'SHORT', min: 'min',
      foot: 'Trades come from my MotiveWave report and balances from my Lucid account. Charts use 1-minute MNQ candles (Yahoo Finance) and a session VWAP recomputed on NQ. Paris time. Not financial advice.',
      boot: d => ['ROAD TO 5 LIVE', '> connect lucid 25k ......... ok', `> load trades .............. ${d.n}`, `> load sessions ............ ${d.s}`, `> last session  ${d.last}`, '']
    },
    fr: {
      intro: 'Mon journal de trading en direct. L’objectif : cinq comptes live de 25K chez Lucid Trading. Chaque trade est ici, rien n’est supprimé.',
      keys: ['COMPTES', 'COURBE', 'JOURNAL', 'TRADES', 'STATS', 'VEILLE'], heads: ['COMPTES', 'SOLDE', 'JOURNAL', 'TRADES', 'STATS', 'VEILLE'],
      last: 'DERNIÈRE SÉANCE', paris: 'PARIS', cmeO: 'CME OUVERT', cmeC: 'CME FERMÉ',
      started: n => `${n} sur 5 lancé${n > 1 ? 's' : ''}`, stages: ['ÉVAL', 'FUNDED', 'PAYOUT', 'LIVE'],
      leadEval: (net, tgt, go) => `Le compte 1 est en évaluation : <b>${net}</b> sur l’objectif de ${tgt}. Encore <b>${go}</b>.`,
      leadDone: 'Le compte 1 a atteint l’objectif de son évaluation.',
      floor: 'PLANCHER', floorNote: 'si le solde le touche, le compte est perdu', cushion: 'MARGE', days: 'JOURS', trades: 'TRADES',
      path: 'Les cinq passent en live en même temps : chacun doit d’abord avoir eu un payout.',
      balR: 'compte 1', hint: 'Touche la courbe pour lire chaque trade.', target: 'OBJECTIF', start: 'DÉPART',
      logR: 'récent d’abord', day: 'JOUR', tw: (n, w) => `${n} trade${n > 1 ? 's' : ''}, ${w} gagnant${w > 1 ? 's' : ''}`,
      sess: { asia: 'Asie', london: 'Londres', ny: 'New York' }, sessS: { asia: 'ASIE', london: 'LDN', ny: 'NY' },
      score: 'ma discipline, sur 10', readAll: 'Tout lire', less: 'Moins', showDay: n => (n === 1 ? 'Voir le trade' : `Voir les ${n} trades`), hideDay: n => (n === 1 ? 'Masquer le trade' : 'Masquer les trades'),
      cols5: ['HEURE', 'SESS', 'SENS', 'ENTRÉE', 'SORTIE', 'DURÉE', 'POINTS', 'NET'], cols6: ['#', 'DATE', 'HEURE', 'SESS', 'SENS', 'ENTRÉE', 'SORTIE', 'DURÉE', 'POINTS', 'NET'],
      next: 'fais défiler ou appuie sur', accOpen: 'Ouvrir ce compte : règles, payouts et ses propres stats',
      fRes: [['all', 'TOUS'], ['win', 'GAGNANTS'], ['loss', 'PERDANTS']], fSess: [['all', 'TOUTES'], ['asia', 'ASIE'], ['london', 'LDN'], ['ny', 'NY']],
      trR: n => `${n} trades`, showAll: n => `Tout voir (${n})`, showLess: 'En voir moins', none: 'Aucun trade avec ces filtres.',
      entry: 'ENTRÉE', exit: 'SORTIE', held: 'DURÉE', points: 'POINTS', net: 'NET', fees: 'FRAIS', session: 'SESSION', vwap: 'DIST. VWAP',
      mae: 'MAE', mfe: 'MFE', chartCap: 'Bougies MNQ 1 minute. VWAP de séance avec ses bandes 1σ et 2σ. Heure de Paris.',
      noBars: 'Pas de bougies pour ce trade.', loading: 'Chargement des bougies…', inVideo: 'Dans une vidéo TikTok.',
      stR: 'tous les trades', wr: 'Taux de réussite', pf: 'Profit factor', aw: 'Gain moyen', al: 'Perte moyenne', best: 'Meilleur trade', worst: 'Pire trade',
      hold: 'Durée médiane', feesPaid: 'Frais payés', bySess: 'PAR SESSION', bySide: 'PAR SENS', long: 'LONG', short: 'SHORT', min: 'min',
      foot: 'Les trades viennent de mon rapport MotiveWave et les soldes de mon compte Lucid. Les graphiques utilisent les bougies MNQ 1 minute (Yahoo Finance) et un VWAP de séance recalculé sur le NQ. Heure de Paris. Ceci n’est pas un conseil financier.',
      boot: d => ['ROAD TO 5 LIVE', '> connexion lucid 25k ...... ok', `> trades chargés ........... ${d.n}`, `> séances chargées .......... ${d.s}`, `> dernière séance  ${d.last}`, '']
    }
  };
  const qp = new URLSearchParams(location.search).get('lang');
  let LANG = (qp === 'fr' || qp === 'en') ? qp : (local.get('r5l-lang') || 'en');
  if (LANG !== 'fr') LANG = 'en';
  const t = () => W[LANG];

  /* ---------- formatting ---------- */
  const loc = () => (LANG === 'fr' ? 'fr-FR' : 'en-US');
  const nf = (n, dp = 2) => new Intl.NumberFormat(loc(), { minimumFractionDigits: dp, maximumFractionDigits: dp }).format(Math.abs(n));
  const num = (n, dp = 2) => (n < 0 ? MINUS : '') + nf(n, dp);
  const sg = (n, dp = 2) => (n > 0 ? '+' : n < 0 ? MINUS : '') + nf(n, dp);
  const usd = (n, dp = 2, sign = false) => { const s = sign ? (n > 0 ? '+' : n < 0 ? MINUS : '') : (n < 0 ? MINUS : ''); return LANG === 'fr' ? `${s}${nf(n, dp)}\u00A0$` : `${s}$${nf(n, dp)}`; };
  const cls = n => (n > 0 ? 'up' : n < 0 ? 'dn' : '');
  const ymd = s => { const [y, m, d] = s.slice(0, 10).split('-').map(Number); return new Date(Date.UTC(y, m - 1, d)); };
  const dayLabel = s => new Intl.DateTimeFormat(loc(), { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'UTC' }).format(ymd(s)).replace(',', '').toUpperCase();
  const shortDate = s => LANG === 'fr' ? `${s.slice(8, 10)}/${s.slice(5, 7)}` : `${s.slice(5, 7)}/${s.slice(8, 10)}`;
  const minOf = s => { const [d, h] = s.replace('T', ' ').split(' '); const [y, m, dd] = d.split('-').map(Number); const [hh, mm, ss] = (h || '0:0').split(':').map(Number); return Date.UTC(y, m - 1, dd, hh, mm, ss || 0) / 60000; };
  const firstSentences = (txt, n) => { if (!txt) return ''; const m = txt.match(/[^.!?]+[.!?]+(\s|$)/g) || [txt]; return m.slice(0, n).join('').trim(); };

  /* ---------- model ---------- */
  let M = null, BARS = null, barsP = null, BOOTING = false, ANIM = !RM;
  const ui = { res: 'all', sess: 'all', all: false, open: null, dayOpen: {}, noteOpen: {}, acc: null };
  const IDS = ['acc', 'bal', 'log', 'tr', 'st', 'wt'];

  function model(raw) {
    const R = raw.rules[0], start = R.start_balance, target = R.profit_target, ML = R.max_loss, lock = R.mll_lock_level;
    const trades = raw.trades.slice().sort((a, b) => (a.entry_time < b.entry_time ? -1 : 1));
    const days = raw.days.slice().sort((a, b) => (a.session_date < b.session_date ? -1 : 1));
    let bal = start; const eq = [{ b: start, t: null }], endOf = {};
    trades.forEach(x => { bal = +(bal + x.pnl_net).toFixed(2); eq.push({ b: bal, t: x }); endOf[x.session_date] = bal; });
    let run = start;
    const D = days.map(d => {
      const ts = trades.filter(x => x.session_date === d.session_date);
      run = endOf[d.session_date] ?? run;
      const close = d.balance_lucid ?? run;
      return { date: d.session_date, no: d.day_no, ts, n: ts.length, w: ts.filter(x => x.pnl_net > 0).length, net: +ts.reduce((s, x) => s + x.pnl_net, 0).toFixed(2), close,
        sc: { asia: d.score_asia, london: d.score_london, ny: d.score_ny }, note: { en: d.note_en, fr: d.note_fr } };
    });
    const balance = D.length ? D[D.length - 1].close : bal;
    const maxClose = Math.max(start, ...D.map(d => d.close));
    const floor = Math.min(maxClose - ML, lock);
    const net = +(balance - start).toFixed(2);
    const wins = trades.filter(x => x.pnl_net > 0), losses = trades.filter(x => x.pnl_net < 0);
    const gw = wins.reduce((s, x) => s + x.pnl_net, 0), gl = -losses.reduce((s, x) => s + x.pnl_net, 0);
    const holds = trades.map(x => x.duration_s).sort((a, b) => a - b), mid = holds.length ? (holds.length % 2 ? holds[(holds.length - 1) / 2] : (holds[holds.length / 2 - 1] + holds[holds.length / 2]) / 2) : 0;
    const group = key => { const o = {}; trades.forEach(x => { const k = x[key]; o[k] = o[k] || { n: 0, net: 0, w: 0 }; o[k].n++; o[k].net = +(o[k].net + x.pnl_net).toFixed(2); if (x.pnl_net > 0) o[k].w++; }); return o; };
    return {
      R, start, target, ML, balance, net, pct: Math.max(0, net / target * 100), toGo: Math.max(0, +(target - net).toFixed(2)), floor, cushion: +(balance - floor).toFixed(2),
      trades, days: D, eq, accounts: raw.accounts, meta: raw.meta || {}, rawDays: days,
      stats: { n: trades.length, w: wins.length, wr: trades.length ? wins.length / trades.length * 100 : 0, pf: gl ? gw / gl : 0, aw: wins.length ? gw / wins.length : 0, al: losses.length ? -gl / losses.length : 0,
        best: trades.reduce((a, b) => (b.pnl_net > (a?.pnl_net ?? -1e9) ? b : a), null), worst: trades.reduce((a, b) => (b.pnl_net < (a?.pnl_net ?? 1e9) ? b : a), null),
        hold: mid, fees: trades.reduce((s, x) => s + (x.fees || 0), 0), sess: group('session'), side: group('side') }
    };
  }

  /* ---------- animation helpers ---------- */
  const pending = new Set();
  const io = ('IntersectionObserver' in window) ? new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting || BOOTING) return;
    io.unobserve(e.target); pending.delete(e.target); const f = e.target.__an; e.target.__an = null; if (f) f(false);
  }), { rootMargin: '0px 0px -10% 0px', threshold: 0.01 }) : null;
  // run fn when el scrolls into view; prep() sets the hidden start state right away
  function when(el, fn, prep) { if (!el) return; if (!ANIM || !io) { fn(true); return; } if (prep) prep(); el.__an = fn; pending.add(el); io.observe(el); }
  function kick() { if (!io) return; pending.forEach(el => { io.unobserve(el); io.observe(el); }); }
  const hide = el => el && el.classList.add('pr');
  function typeIn(el, txt, speed = 14) {
    if (!ANIM) { el.textContent = txt; return; }
    el.textContent = ''; const t0 = performance.now();
    let fin = false;
    const step = now => { if (fin) return; const k = Math.min(txt.length, Math.floor((now - t0) / speed) + 1); el.textContent = txt.slice(0, k); if (k < txt.length) requestAnimationFrame(step); else fin = true; };
    requestAnimationFrame(step);
    setTimeout(() => { fin = true; el.textContent = txt; }, txt.length * speed + 500); // safety net if frames are paused
  }
  function printRows(box, gap = 32) {
    if (!box) return; const kids = [...box.children];
    if (!ANIM) { box.classList.remove('pr'); return; }
    box.classList.add('pr'); kids.forEach((k, i) => setTimeout(() => k.classList.add('in'), 40 + i * gap));
    setTimeout(() => { box.classList.remove('pr'); kids.forEach(k => k.classList.remove('in')); }, 80 + kids.length * gap + 50);
  }
  function countTo(el, to, fmt, dur = 900) {
    if (!ANIM) { el.textContent = fmt(to); return; }
    const t0 = performance.now(), from = 0;
    let fin = false;
    const step = now => { if (fin) return; const k = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - k, 3); el.textContent = fmt(from + (to - from) * e); if (k < 1) requestAnimationFrame(step); else { fin = true; el.textContent = fmt(to); } };
    el.textContent = fmt(from); requestAnimationFrame(step);
    setTimeout(() => { fin = true; el.textContent = fmt(to); }, dur + 400);
  }
  function blockBar(el, n, ch = '█') {
    if (!ANIM) { el.textContent = ch.repeat(n); return; }
    let k = 0; el.textContent = ''; const id = setInterval(() => { k++; el.textContent = ch.repeat(k); if (k >= n) clearInterval(id); }, 22);
    if (!n) clearInterval(id);
  }
  function headPrep(sec) { const h = $('h2', sec); h.style.setProperty('--rule', 0); $('.tt', h).textContent = ''; const r = $('.r', h); if (r) r.textContent = ''; }
  function headIn(sec) {
    const h = $('h2', sec), tt = $('.tt', h), r = $('.r', h);
    if (!ANIM) { h.style.setProperty('--rule', 1); tt.textContent = tt.dataset.t; if (r) r.textContent = r.dataset.t; return; }
    requestAnimationFrame(() => requestAnimationFrame(() => h.style.setProperty('--rule', 1)));
    typeIn(tt, tt.dataset.t, 22); if (r) setTimeout(() => typeIn(r, r.dataset.t, 12), 120);
  }

  /* ---------- header, status, keys ---------- */
  function cmeOpen(d = new Date()) {
    const p = Object.fromEntries(new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', weekday: 'short', hour: 'numeric', minute: 'numeric', hour12: false }).formatToParts(d).map(x => [x.type, x.value]));
    const m = (+p.hour % 24) * 60 + +p.minute;
    if (p.weekday === 'Sat') return false; if (p.weekday === 'Sun') return m >= 1080; if (p.weekday === 'Fri') return m < 1020;
    return !(m >= 1020 && m < 1080);
  }
  function status() {
    const el = $('#status'); if (!el || !M) return;
    const now = new Date(), clock = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Paris', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }).format(now);
    const last = M.days.length ? dayLabel(M.days[M.days.length - 1].date) : '';
    const open = cmeOpen(now);
    el.innerHTML = `<span>${t().last} <b>${last}</b></span><span>${t().paris} <b>${clock}</b></span><span class="${open ? 'open' : ''}">${open ? t().cmeO : t().cmeC}</span>`;
  }
  function keys() {
    const k = $('#keys'), ids = IDS;
    k.innerHTML = ids.map((id, i) => `<a href="#${id}" data-i="${i}"><b>${i + 1}</b>${t().keys[i]}</a>`).join('');
    $$('a', k).forEach(a => a.addEventListener('click', e => { e.preventDefault(); go(a.getAttribute('href').slice(1)); }));
    markKey(curKey);
  }
  let curKey = 'acc';
  function markKey(id) { curKey = id; $$('#keys a').forEach(a => a.setAttribute('aria-current', a.getAttribute('href') === '#' + id ? 'true' : 'false')); }
  function go(id) {
    const el = document.getElementById(id); if (!el) return;
    el.scrollIntoView({ behavior: ANIM ? 'smooth' : 'auto', block: 'start' }); markKey(id);
    if (history.replaceState) history.replaceState(null, '', '#' + id);
  }
  function spy() {
    const ids = IDS;
    const pick = () => {
      const mid = innerHeight * 0.35; let best = ids[0], bt = -1e9;
      ids.forEach(id => { const r = document.getElementById(id).getBoundingClientRect(); if (r.top <= mid && r.top > bt + 1) { best = id; bt = r.top; } });
      if (innerWidth < 1080 && innerHeight + scrollY >= document.documentElement.scrollHeight - 4) best = IDS[IDS.length - 1];
      if (best !== curKey) markKey(best);
    };
    addEventListener('scroll', pick, { passive: true }); pick();
  }
  function heads() {
    IDS.forEach((id, i) => {
      const h = $(`#${id} h2`); if (!h) return;
      const right = { acc: t().started(M.accounts.filter(a => a.stage !== 'none').length), bal: t().balR, log: t().logR, tr: t().trR(M.trades.length), st: t().stR, wt: window.R5S ? R5S.watchMeta() : '' }[id];
      h.innerHTML = `<span class="k">${i + 1}</span><span class="tt" data-t="${t().heads[i]}">${t().heads[i]}</span><span class="r" data-t="${esc(right)}">${esc(right)}</span>`;
    });
  }

  /* ---------- 1 accounts ---------- */
  function accounts() {
    const box = $('#accBody'), st = t().stages, order = ['eval', 'funded', 'payout', 'live'];
    let g = `<div class="hd"></div>` + st.map(s => `<div class="hd">${s}</div>`).join('');
    M.accounts.forEach(a => {
      const k = order.indexOf(a.stage);
      g += `<button type="button" class="n ${a.stage === 'none' ? 'off' : ''}" data-acc="${a.n}" aria-expanded="${ui.acc === a.n}" title="${esc(t().accOpen)}">#${a.n}<span class="chev">\u25B8</span></button>`;
      for (let j = 0; j < 4; j++) {
        if (k >= 0 && j < k) g += `<div class="done">✓</div>`;
        else if (k >= 0 && j === k && a.stage === 'eval') g += `<div class="cur"><span class="fill"></span><b class="pc">0%</b><i></i></div>`;
        else if (k >= 0 && j === k) g += `<div class="done">▶</div>`;
        else g += `<div class="e">···</div>`;
      }
    });
    const lead = M.net >= M.target ? t().leadDone : t().leadEval(usd(M.net, 2, true), usd(M.target, 0), usd(M.toGo));
    box.innerHTML = `<div class="grid" id="accGrid" data-an>${g}</div><div id="accDet"></div><p class="lead">${lead}</p>
      <div class="kvs" id="accKv" data-an>
        <div class="kv"><span class="l">${t().floor}</span><span><span class="dn">${num(M.floor)}</span> <span class="mu">${t().floorNote}</span></span></div>
        <div class="kv"><span class="l">${t().cushion}</span><span>${num(M.cushion)}</span></div>
        <div class="kv"><span class="l">${t().days}</span><span>${M.days.filter(d => d.n).length}  <span class="mu">${t().trades}</span> ${M.trades.length}</span></div>
      </div>
      <p class="note">${t().path}</p>`;
    const cur = $('.cur', box), pc = $('.pc', box), pct = Math.min(100, M.pct), grid = $('#accGrid');
    when(grid, instant => {
      printRows(grid, 18);
      if (cur) { if (instant || !ANIM) { cur.style.setProperty('--w', pct + '%'); pc.textContent = Math.round(pct) + '%'; } else { setTimeout(() => cur.style.setProperty('--w', pct + '%'), 450); setTimeout(() => countTo(pc, pct, v => Math.round(v) + '%', 1000), 450); } }
    }, () => hide(grid));
    when($('#accKv'), () => printRows($('#accKv'), 90), () => hide($('#accKv')));
    $$('[data-acc]', box).forEach(b => b.addEventListener('click', () => { const n = +b.dataset.acc; ui.acc = ui.acc === n ? null : n; $$('[data-acc]', box).forEach(x => x.setAttribute('aria-expanded', String(+x.dataset.acc === ui.acc))); accDet(true); }));
    accDet(false);
  }
  function accDet(anim) {
    const el = $('#accDet'); if (!el) return;
    if (ui.acc == null || !window.R5S) { el.innerHTML = ''; return; }
    el.innerHTML = R5S.accDetail(ui.acc); R5S.wire(el);
    if (anim && ANIM) $$('.blk', el).forEach(b => printRows(b, 24));
  }

  /* ---------- 2 balance chart ---------- */
  function balance() {
    const box = $('#balBody');
    box.innerHTML = `<div class="readout" id="rd">${t().hint}</div><div class="chart" id="eqc" data-an></div>`;
    drawEq(false);
  }
  function drawEq(redraw) {
    const host = $('#eqc'); if (!host) return;
    const w = Math.max(300, Math.round(host.clientWidth || 358)), h = w > 760 ? Math.round(Math.max(340, Math.min(560, innerHeight - 330))) : w > 600 ? 300 : 236, pl = 4, pr = 64, pt = 18, pb = 26;
    const P = M.eq, last = P[P.length - 1].b;
    const lo = Math.min(M.floor, ...P.map(p => p.b)) - 90, hi = Math.max(M.start + M.target, ...P.map(p => p.b)) + 70;
    const X = i => pl + (w - pl - pr) * i / Math.max(1, P.length - 1), Y = v => pt + (h - pt - pb) * (hi - v) / (hi - lo);
    let s = `<svg viewBox="0 0 ${w} ${h}" role="img" aria-label="${esc(t().heads[1])}: ${num(M.start)} → ${num(last)}">`;
    // day separators and labels
    M.days.forEach((d, j) => {
      const idx = P.map((p, i) => [p, i]).filter(([p]) => p.t && p.t.session_date === d.date).map(([, i]) => i);
      if (!idx.length) return;
      const a = Math.min(...idx), b = Math.max(...idx);
      if (j) s += `<line x1="${X(a - 0.5)}" x2="${X(a - 0.5)}" y1="${pt}" y2="${h - pb}" stroke="#3a2a10" stroke-dasharray="1 3"/>`;
      s += `<text x="${(X(a) + X(b)) / 2}" y="${h - 7}" font-size="10" fill="#A08D6C" text-anchor="middle">${t().day.slice(0, 1)}${d.no}</text>`;
    });
    const lvl = (v, col, dash, name) => {
      s += `<line x1="${pl}" x2="${w - pr + 4}" y1="${Y(v)}" y2="${Y(v)}" stroke="${col}" ${dash ? `stroke-dasharray="${dash}"` : ''}/>`;
      s += `<text x="${pl + 2}" y="${Y(v) - 4}" font-size="9.5" fill="${col}" letter-spacing=".06em">${name}</text>`;
      s += `<text x="${w - pr + 8}" y="${Y(v) + 4}" font-size="10.5" fill="${col}">${nf(v, 0)}</text>`;
    };
    lvl(M.start + M.target, '#3BD47A', '4 3', t().target); lvl(M.start, '#A08D6C', '1 3', t().start); lvl(M.floor, '#FF5149', '', t().floor);
    const d = P.map((p, i) => `${i ? 'L' : 'M'}${X(i).toFixed(1)},${Y(p.b).toFixed(1)}`).join('');
    s += `<path class="ln" pathLength="1" d="${d}" fill="none" stroke="#FFA41C" stroke-width="1.8" stroke-linejoin="round"/>`;
    P.forEach((p, i) => { if (i) s += `<circle class="dot" cx="${X(i)}" cy="${Y(p.b)}" r="2.2" fill="${p.t.pnl_net > 0 ? '#3BD47A' : p.t.pnl_net < 0 ? '#FF5149' : '#A08D6C'}" style="transition-delay:${(i / P.length * 1.3).toFixed(2)}s"/>`; });
    s += `<g class="tag"><rect x="${w - pr + 4}" y="${Y(last) - 10}" width="${pr - 4}" height="20" fill="#FFA41C"/><text x="${w - pr + 8}" y="${Y(last) + 4}" font-size="11" font-weight="700" fill="#000">${nf(last, 0)}</text></g>`;
    s += `<g class="xh" opacity="0"><line y1="${pt}" y2="${h - pb}" stroke="#F3E7CF" stroke-opacity=".35"/><circle r="4.5" fill="none" stroke="#F3E7CF" stroke-width="1.5"/></g>`;
    s += `<rect class="hit" x="0" y="0" width="${w - pr}" height="${h}" fill="transparent"/></svg>`;
    host.innerHTML = s;
    const svg = $('svg', host), xh = $('.xh', svg), ln = $('line', xh), cc = $('circle', xh), rd = $('#rd');
    const pick = ev => {
      const r = svg.getBoundingClientRect(), x = (ev.clientX - r.left) * w / r.width;
      const i = Math.max(1, Math.min(P.length - 1, Math.round((x - pl) / ((w - pl - pr) / Math.max(1, P.length - 1)))));
      const p = P[i], tr = p.t; xh.setAttribute('opacity', 1); ln.setAttribute('x1', X(i)); ln.setAttribute('x2', X(i)); cc.setAttribute('cx', X(i)); cc.setAttribute('cy', Y(p.b));
      rd.innerHTML = `<b>#${tr.id}</b>  ${shortDate(tr.session_date)} ${tr.entry_hms.slice(0, 5)}  ${tr.side === 'long' ? t().long : t().short}  <span class="${cls(tr.pnl_net)}">${sg(tr.pnl_net)}</span>  → <b>${num(p.b)}</b>`;
    };
    svg.addEventListener('pointermove', pick); svg.addEventListener('pointerdown', pick);
    svg.addEventListener('pointerleave', () => { xh.setAttribute('opacity', 0); rd.textContent = t().hint; });
    if (redraw) return;
    const lnp = $('.ln', svg), dots = $$('.dot', svg), tag = $('.tag', svg);
    when(host, instant => {
      if (instant || !ANIM) { lnp.style.setProperty('--off', 0); dots.forEach(c => c.style.setProperty('--op', 1)); tag.style.setProperty('--op', 1); return; }
      requestAnimationFrame(() => requestAnimationFrame(() => { lnp.style.transition = ''; lnp.style.setProperty('--off', 0); dots.forEach(c => c.style.setProperty('--op', 1)); tag.style.setProperty('--op', 1); }));
    }, () => { lnp.style.transition = 'none'; lnp.style.setProperty('--off', 1); dots.forEach(c => c.style.setProperty('--op', 0)); tag.style.setProperty('--op', 0); });
  }

  /* ---------- 3 log ---------- */
  function tradeRow5(x) {
    return `<div class="row c5 t" role="button" tabindex="0" data-go="${x.id}"><span>${x.entry_hms.slice(0, 5)}</span><span class="s">${t().sessS[x.session] || ''}</span><span>${x.side === 'long' ? t().long : t().short}</span><span>${num(x.entry_price)}</span><span class="wd">${num(x.exit_price)}</span><span class="wd s">${esc(x.dur_s_txt || '')}</span><span class="wd ${cls(x.points)}">${sg(x.points)}</span><span class="x ${cls(x.pnl_net)}">${sg(x.pnl_net)}</span></div>`;
  }
  const WD5 = [4, 5, 6], WD6 = [3, 5, 6, 7];
  function log() {
    const box = $('#logBody'), L = M.days.slice().reverse();
    box.innerHTML = L.map((d, i) => {
      const open = ui.dayOpen[d.date] ?? (i === 0), noteOpen = !!ui.noteOpen[d.date], note = d.note[LANG] || d.note.en;
      const sc = ['asia', 'london', 'ny'].filter(k => d.sc[k] != null).map(k => `${t().sess[k]} <em>${nf(d.sc[k], d.sc[k] % 1 ? 1 : 0)}/10</em>`);
      let h = `<article class="day" data-an data-day="${d.date}"><div class="dh"><span class="d">${dayLabel(d.date)}  ${t().day} ${d.no}</span><span class="p ${cls(d.net)}" data-v="${d.net}">${sg(d.net)}</span></div>`;
      h += `<div class="ds">${t().tw(d.n, d.w)}${sc.length ? '. ' + sc.join(', ') + ` <span class="mu">(${t().score})</span>` : ''}</div>`;
      if (note) {
        const short = firstSentences(note, i === 0 ? 2 : 1), full = note.length > short.length + 2;
        h += `<p class="quote">${esc(noteOpen ? note : short)}</p>${full ? `<button class="more" data-note="${d.date}">${noteOpen ? t().less : t().readAll}</button>` : ''}`;
      }
      if (d.n) {
        if (open) h += `<div class="tape"><div class="row c5 h">${t().cols5.map((c, j) => `<span class="${j === 7 ? 'x' : ''} ${WD5.includes(j) ? 'wd' : ''}">${c}</span>`).join('')}</div><div class="rows">${d.ts.map(tradeRow5).join('')}</div></div>`;
        if (i > 0 || !open) h += ` <button class="more" data-tog="${d.date}">${open ? t().hideDay(d.n) : t().showDay(d.n)}</button>`;
      }
      return h + '</article>';
    }).join('');
    $$('[data-note]', box).forEach(b => b.addEventListener('click', () => { ui.noteOpen[b.dataset.note] = !ui.noteOpen[b.dataset.note]; ANIM_SAVE(log); }));
    $$('[data-tog]', box).forEach(b => b.addEventListener('click', () => { const k = b.dataset.tog, i = M.days.length - 1 - M.days.findIndex(d => d.date === k); ui.dayOpen[k] = !(ui.dayOpen[k] ?? (i === 0)); ANIM_SAVE(log); const rows = $(`[data-day="${k}"] .rows`); if (rows && ANIM) printRows(rows, 18); }));
    $$('[data-go]', box).forEach(r => { const f = () => openTrade(+r.dataset.go, true); r.addEventListener('click', f); r.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); f(); } }); });
    $$('.day', box).forEach(a => when(a, instant => {
      const p = $('.dh .p', a), v = +p.dataset.v; if (!instant) countTo(p, v, x => sg(x), 800);
      printRows(a, 60); const rows = $('.rows', a); if (rows) setTimeout(() => printRows(rows, 40), 200);
    }, () => { hide(a); hide($('.rows', a)); }));
  }
  function ANIM_SAVE(fn) { const a = ANIM; ANIM = false; fn(); ANIM = a; }

  /* ---------- 4 trades ---------- */
  function trades() {
    const box = $('#trBody');
    const flt = (arr, key) => `<div>${arr.map(([v, l]) => `<button type="button" data-${key}="${v}" aria-pressed="${ui[key] === v}">${l}</button>`).join('')}</div>`;
    const list = M.trades.slice().reverse().filter(x => (ui.res === 'all' || (ui.res === 'win' ? x.pnl_net > 0 : x.pnl_net < 0)) && (ui.sess === 'all' || x.session === ui.sess));
    const N = 12, shown = ui.all ? list : list.slice(0, N);
    let h = `<div class="fl">${flt(t().fRes, 'res')}${flt(t().fSess, 'sess')}</div>`;
    h += `<div class="row c6 h">${t().cols6.map((c, j) => `<span class="${j === 9 ? 'x' : ''} ${WD6.includes(j) ? 'wd' : ''}">${c}</span>`).join('')}</div><div class="rows" id="trRows" data-an>`;
    h += shown.map(x => `<div class="row c6 t" role="button" tabindex="0" aria-expanded="${ui.open === x.id}" data-id="${x.id}"><span class="s">${x.id}</span><span>${shortDate(x.session_date)}</span><span>${x.entry_hms.slice(0, 5)}</span><span class="wd s">${t().sessS[x.session] || ''}</span><span>${x.side === 'long' ? t().long : t().short}</span><span class="wd">${num(x.entry_price)}</span><span class="wd">${num(x.exit_price)}</span><span class="wd s">${esc(x.dur_s_txt || '')}</span><span class="${cls(x.points)}">${sg(x.points)}</span><span class="x ${cls(x.pnl_net)}">${sg(x.pnl_net)}</span></div>${ui.open === x.id ? detailBox(x) : ''}`).join('');
    if (!list.length) h += `<div class="row"><span class="mu">${t().none}</span></div>`;
    h += '</div>';
    if (list.length > N) h += `<button class="more" id="trMore">${ui.all ? t().showLess : t().showAll(list.length)}</button>`;
    box.innerHTML = h;
    $$('[data-res]', box).forEach(b => b.addEventListener('click', () => { ui.res = b.dataset.res; ui.open = null; trades(); printRows($('#trRows'), 22); }));
    $$('[data-sess]', box).forEach(b => b.addEventListener('click', () => { ui.sess = b.dataset.sess; ui.open = null; trades(); printRows($('#trRows'), 22); }));
    const more = $('#trMore'); if (more) more.addEventListener('click', () => { ui.all = !ui.all; trades(); });
    $$('#trRows .row.t', box).forEach(r => { const f = () => openTrade(+r.dataset.id, false); r.addEventListener('click', f); r.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); f(); } }); });
    if (ui.open != null) fillDetail(ui.open);
    if (!ui.trSeen) { ui.trSeen = true; when($('#trRows'), () => printRows($('#trRows'), 28), () => hide($('#trRows'))); }
  }
  function openTrade(id, jump) {
    if (jump) { const x = M.trades.find(q => q.id === id); const vis = (ui.res === 'all' || (ui.res === 'win' ? x.pnl_net > 0 : x.pnl_net < 0)) && (ui.sess === 'all' || x.session === ui.sess); if (!vis) { ui.res = 'all'; ui.sess = 'all'; } const idx = M.trades.slice().reverse().findIndex(q => q.id === id); if (idx >= 12) ui.all = true; ui.open = id; }
    else ui.open = ui.open === id ? null : id;
    trades();
    const row = $(`#trRows [data-id="${id}"]`);
    if (row && jump) row.scrollIntoView({ behavior: ANIM ? 'smooth' : 'auto', block: 'center' });
  }
  function detailBox(x) {
    const kv = (l, v) => `<div class="kv"><span class="l">${l}</span><span>${v}</span></div>`;
    const z = x.vwap_z != null ? `${sg(x.vwap_z)}σ` : '—';
    return `<div class="det" id="det${x.id}"><div class="chart tchart" id="tc${x.id}"><div class="na">${t().loading}</div></div><div class="tcap">${t().chartCap}</div>
      <div class="two">${kv(t().entry, `${x.entry_hms} <span class="mu">@</span> ${num(x.entry_price)}`)}${kv(t().exit, `${x.exit_hms} <span class="mu">@</span> ${num(x.exit_price)}`)}
      ${kv(t().held, esc(x.dur_s_txt || ''))}${kv(t().points, `<span class="${cls(x.points)}">${sg(x.points)}</span>`)}
      ${kv(t().net, `<span class="${cls(x.pnl_net)}">${sg(x.pnl_net)}</span> <span class="mu">${t().fees.toLowerCase()} ${nf(x.fees || 0)}</span>`)}${kv(t().session, t().sess[x.session] || '')}
      ${kv(t().mae, `<span class="dn">${sg(x.mae_usd)}</span>`)}${kv(t().mfe, `<span class="up">${sg(x.mfe_usd)}</span>`)}
      ${kv(t().vwap, z)}${kv('QTY', `${x.qty} ${esc(x.instrument)}`)}</div></div>`;
  }
  function loadBars() { if (!barsP) barsP = fetch('data/bars.json', { cache: 'no-cache' }).then(r => r.json()).then(b => (BARS = b)).catch(() => (BARS = [])); return barsP; }
  function fillDetail(id) {
    const x = M.trades.find(q => q.id === id), host = $(`#tc${id}`); if (!host) return;
    const det = $(`#det${id}`); if (det && ANIM) printRows($('.two', det), 30);
    loadBars().then(() => { const h = $(`#tc${id}`); if (h) h.innerHTML = tradeChart(x, Math.max(280, Math.round(h.clientWidth || 340))); const ln = h && $('.ln', h); if (ln && ANIM) { ln.style.transition = 'none'; ln.style.setProperty('--off', 1); requestAnimationFrame(() => requestAnimationFrame(() => { ln.style.transition = ''; ln.style.setProperty('--off', 0); })); } });
  }
  function tradeChart(x, w) {
    const e0 = minOf(x.entry_time), e1 = minOf(x.exit_time), a = Math.floor(e0) - 25, b = Math.ceil(e1) + 15;
    const bs = (BARS || []).filter(q => q.d === x.session_date).map(q => ({ ...q, m: minOf(q.t) })).filter(q => q.m >= a && q.m <= b);
    if (bs.length < 4) return `<div class="na">${t().noBars}</div>`;
    const h = w > 760 ? 340 : w > 520 ? 270 : 220, pl = 2, pr = 62, pt = 10, pb = 22;
    let lo = Math.min(...bs.map(q => q.l), x.entry_price, x.exit_price), hi = Math.max(...bs.map(q => q.h), x.entry_price, x.exit_price);
    const pad = (hi - lo) * 0.1 + 1; lo -= pad; hi += pad;
    const m0 = bs[0].m, m1 = bs[bs.length - 1].m + 1, X = m => pl + (w - pl - pr) * (m - m0) / (m1 - m0), Y = v => pt + (h - pt - pb) * (hi - v) / (hi - lo), cw = (w - pl - pr) / (m1 - m0);
    let s = `<svg viewBox="0 0 ${w} ${h}" role="img" aria-label="#${x.id}"><defs><clipPath id="cp${x.id}"><rect x="${pl}" y="${pt}" width="${w - pl - pr}" height="${h - pt - pb}"/></clipPath></defs>`;
    const step = [1, 2, 2.5, 5, 10, 20, 25, 50, 100].find(v => (hi - lo) / v <= 5) || 100;
    for (let v = Math.ceil(lo / step) * step; v <= hi; v += step) s += `<line x1="${pl}" x2="${w - pr}" y1="${Y(v)}" y2="${Y(v)}" stroke="#1d1305"/><text x="${w - pr + 6}" y="${Y(v) + 3.5}" font-size="10" fill="#A08D6C">${nf(v, step < 1 ? 2 : 0)}</text>`;
    const every = (m1 - m0) / ((w - pl - pr) / 46) > 10 ? ((m1 - m0) / ((w - pl - pr) / 46) > 20 ? 30 : 20) : 10;
    bs.forEach(q => { const mm = +q.t.slice(14, 16); if (mm % every === 0) { const tt = q.t.slice(11, 16); s += `<line x1="${X(q.m + 0.5)}" x2="${X(q.m + 0.5)}" y1="${h - pb}" y2="${h - pb + 3}" stroke="#6E4608"/><text x="${X(q.m + 0.5)}" y="${h - 6}" font-size="9.5" fill="#A08D6C" text-anchor="middle">${tt}</text>`; } });
    const band = (k, dash, col) => { const pts = bs.filter(q => q.vw && q.sd).map(q => `${X(q.m + 0.5).toFixed(1)},${Y(q.vw + k * q.sd).toFixed(1)}`); if (pts.length > 1) s += `<polyline clip-path="url(#cp${x.id})" points="${pts.join(' ')}" fill="none" stroke="${col}" stroke-width="1" ${dash ? `stroke-dasharray="${dash}"` : ''}/>`; };
    band(2, '1 3', '#4a320a'); band(-2, '1 3', '#4a320a'); band(1, '3 3', '#6E4608'); band(-1, '3 3', '#6E4608'); band(0, '', '#FFA41C');
    bs.forEach(q => {
      const up = q.c >= q.o, col = up ? '#2E8A57' : '#A8423C', cx = X(q.m + 0.5);
      s += `<line x1="${cx}" x2="${cx}" y1="${Y(q.h)}" y2="${Y(q.l)}" stroke="${col}"/><rect x="${cx - cw * 0.32}" y="${Y(Math.max(q.o, q.c))}" width="${Math.max(1, cw * 0.64)}" height="${Math.max(1, Math.abs(Y(q.o) - Y(q.c)))}" fill="${col}"/>`;
    });
    const xe = X(e0), ye = Y(x.entry_price), xx = X(e1), yx = Y(x.exit_price), res = x.pnl_net > 0 ? '#3BD47A' : x.pnl_net < 0 ? '#FF5149' : '#A08D6C';
    s += `<path class="ln" pathLength="1" d="M${xe},${ye}L${xx},${yx}" stroke="${res}" stroke-width="1.6" stroke-dasharray="1" fill="none"/>`;
    const tri = x.side === 'long' ? `M${xe - 6},${ye + 9}L${xe + 6},${ye + 9}L${xe},${ye}Z` : `M${xe - 6},${ye - 9}L${xe + 6},${ye - 9}L${xe},${ye}Z`;
    s += `<path d="${tri}" fill="#F3E7CF"/><rect x="${xx - 4}" y="${yx - 4}" width="8" height="8" fill="${res}"/>`;
    const tag = (y, txt, bg, fg) => `<rect x="${w - pr + 2}" y="${y - 9}" width="${pr - 2}" height="18" fill="${bg}"/><text x="${w - pr + 6}" y="${y + 4}" font-size="10.5" font-weight="700" fill="${fg}">${txt}</text>`;
    s += tag(ye, nf(x.entry_price, 2), '#F3E7CF', '#000') + tag(Math.abs(yx - ye) < 18 ? yx + (yx > ye ? 18 : -18) : yx, nf(x.exit_price, 2), res, '#000');
    return s + '</svg>';
  }

  /* ---------- 5 stats ---------- */
  function stats() {
    if (window.R5S) { R5S.stats(); return; }
    const S = M.stats, box = $('#stBody');
    const rows = [[t().wr, `${nf(S.wr, 0)}%  <span class="mu">${S.w}/${S.n}</span>`], [t().pf, nf(S.pf, 2)], [t().aw, `<span class="up">${sg(S.aw)}</span>`], [t().al, `<span class="dn">${sg(S.al)}</span>`],
      [t().best, S.best ? `<span class="up">${sg(S.best.pnl_net)}</span>  <span class="mu">#${S.best.id}</span>` : '—'], [t().worst, S.worst ? `<span class="dn">${sg(S.worst.pnl_net)}</span>  <span class="mu">#${S.worst.id}</span>` : '—'],
      [t().hold, `${Math.round(S.hold / 60)} ${t().min}`], [t().feesPaid, nf(S.fees)]];
    const bars = (obj, keys, names) => { const mx = Math.max(1, ...keys.map(k => Math.abs(obj[k]?.net || 0))); return keys.filter(k => obj[k]).map(k => `<div class="bar"><span>${names[k]}</span><span class="mu">${obj[k].n}</span><span class="${cls(obj[k].net)}">${sg(obj[k].net)}</span><span class="g ${cls(obj[k].net)}" data-n="${obj[k].net / mx}"></span></div>`).join(''); };
    box.innerHTML = `<div id="stKv" data-an>${rows.map(([a, b]) => `<div class="st"><span>${a}</span><span class="dots"></span><span>${b}</span></div>`).join('')}</div>
      <div class="sub">${t().bySess}</div><div id="stS" data-an>${bars(S.sess, ['london', 'ny', 'asia'], { london: t().sess.london.toUpperCase(), ny: 'NEW YORK', asia: t().sess.asia.toUpperCase() })}</div>
      <div class="sub">${t().bySide}</div><div id="stD" data-an>${bars(S.side, ['long', 'short'], { long: t().long, short: t().short })}</div>`;
    const fillBars = (el, instant) => $$('.g', el).forEach(g => { const cols = Math.max(4, Math.floor(g.clientWidth / 7.2)), n = Math.max(1, Math.round(Math.abs(+g.dataset.n) * cols)); if (instant) g.textContent = '█'.repeat(n); else blockBar(g, n); });
    when($('#stKv'), () => printRows($('#stKv'), 45), () => hide($('#stKv')));
    when($('#stS'), instant => fillBars($('#stS'), instant || !ANIM)); when($('#stD'), instant => fillBars($('#stD'), instant || !ANIM));
  }

  /* ---------- page ---------- */
  function nexts() {
    const ids = IDS;
    ids.slice(0, -1).forEach((id, i) => {
      const sec = document.getElementById(id); let a = $('.next', sec);
      if (!a) { a = document.createElement('a'); a.className = 'next'; sec.appendChild(a); a.addEventListener('click', e => { e.preventDefault(); go(ids[i + 1]); }); }
      a.href = '#' + ids[i + 1]; a.innerHTML = `<span class="ar">\u25BC</span> ${t().next} <b>${i + 2}</b> ${t().heads[i + 1]}`;
    });
  }
  function render() {
    if (io) { pending.forEach(el => io.unobserve(el)); pending.clear(); }
    document.documentElement.lang = LANG;
    $$('.lang button').forEach(b => b.setAttribute('aria-pressed', b.dataset.lang === LANG ? 'true' : 'false'));
    $('#intro').textContent = t().intro; $('#foot').textContent = t().foot;
    heads(); keys(); status(); accounts(); balance(); log(); trades(); stats(); if (window.R5S) R5S.watch(); nexts();
    $$('.panel').forEach(sec => when(sec, instant => headIn(sec), () => headPrep(sec)));
  }
  function boot(done) {
    const ov = $('#boot'), pre = $('#bootTxt');
    if (!ANIM || document.hidden || sess.get('r5l-boot')) { done(); return; }
    sess.set('r5l-boot', '1'); BOOTING = true; ov.classList.add('on');
    const lines = t().boot({ n: M.trades.length, s: M.days.length, last: M.days.length ? dayLabel(M.days[M.days.length - 1].date) : '' });
    const full = lines.join('\n'); let k = 0, fin = false;
    const end = () => { if (fin) return; fin = true; pre.innerHTML = esc(full); ov.classList.add('done'); BOOTING = false; setTimeout(() => ov.remove(), 400); done(); };
    const t0 = performance.now(), total = 1000; // typed by elapsed time, so a slow or throttled timer cannot stretch it
    const id = setInterval(() => { k = Math.min(full.length, Math.ceil((performance.now() - t0) / total * full.length)); pre.innerHTML = esc(full.slice(0, k)) + '<i></i>'; if (k >= full.length) { clearInterval(id); setTimeout(end, 260); } }, 16);
    setTimeout(() => { clearInterval(id); end(); }, total + 900);
    ov.addEventListener('click', () => { clearInterval(id); end(); }); addEventListener('keydown', () => { clearInterval(id); end(); }, { once: true });
  }
  function bind() {
    $$('.lang button').forEach(b => b.addEventListener('click', () => { if (b.dataset.lang === LANG) return; LANG = b.dataset.lang; local.set('r5l-lang', LANG); const a = ANIM; ANIM = false; render(); ANIM = a; }));
    addEventListener('keydown', e => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const i = '123456'.indexOf(e.key); if (i >= 0 && !/INPUT|TEXTAREA|SELECT/.test(document.activeElement?.tagName || '')) { go(IDS[i]); }
      if (e.key === 'Escape' && ui.open != null) { ui.open = null; trades(); }
    });
    let rz; addEventListener('resize', () => { clearTimeout(rz); rz = setTimeout(() => { if (M) { drawEq(true); if (ui.open != null) fillDetail(ui.open); } }, 200); });
    setInterval(status, 1000);
  }
  async function main() {
    const get = n => fetch(`data/${n}.json`, { cache: 'no-cache' }).then(r => { if (!r.ok) throw new Error(n); return r.json(); });
    try {
      const [trades, days, rules, accounts] = await Promise.all(['trades', 'days', 'rules', 'accounts'].map(get));
      const meta = await get('meta').catch(() => ({}));
      const watch = await get('watch').catch(() => null);
      M = model({ trades, days, rules, accounts, meta }); M.watch = watch;
    } catch (e) { $('#intro').textContent = 'The journal could not load its data. Refresh the page to try again.'; return; }
    bind(); boot(() => { kick(); });
    render(); spy();
    if (location.hash) { const id = location.hash.slice(1); if (document.getElementById(id)) setTimeout(() => go(id), 50); }
    setTimeout(loadBars, 2500);
  }
  // shared with stats.js (statistics, account rules, weekly watch)
  window.R5 = { get M() { return M; }, get LANG() { return LANG; }, get ANIM() { return ANIM; }, get BARS() { return BARS; }, ui, t, nf, num, sg, usd, cls, esc, $, $$, when, hide, printRows, countTo, blockBar, typeIn, openTrade, go, loadBars, dayLabel, shortDate, minOf, ymd, firstSentences, rerender: () => { const a = ANIM; ANIM = false; render(); ANIM = a; } };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', main); else main();
})();
