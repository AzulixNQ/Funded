'use strict';
/* Road to Funded: page code. Fixed text lives in index.html; this file only computes and draws. */
const R = (window.RTF = window.RTF || {});
const P = () => dash.params() || {};
R.lang = () => (P().lang === 'en' ? 'en' : 'fr');
R.mode = () => (P().mode === 'gross' ? 'gross' : 'net');
R.day = () => P().day || null;
R.scope = () => R.day() || 'all';
R.rows = (id) => { const d = dash.data(id); return d.status === 'ok' ? d.data : []; };
const byEntry = (a, b) => (a.entry_time < b.entry_time ? -1 : a.entry_time > b.entry_time ? 1 : 0);
R.days = () => R.rows('days').slice().sort((a, b) => (a.session_date < b.session_date ? -1 : 1));
R.dayOrLatest = () => { if (R.day()) return R.day(); const d = R.days(); return d.length ? d[d.length - 1].session_date : null; };
R.trades = () => R.rows('trades').slice().sort(byEntry);
R.inScope = (t) => !R.day() || t.session_date === R.day();
R.tradeId = () => {
  const ts = R.trades().filter(R.inScope);
  const want = P().trade;
  if (want !== null && want !== undefined && ts.some((t) => t.id === +want)) return +want;
  return ts.length ? ts[ts.length - 1].id : null;
};

/* words used inside charts, tooltips and generated lists */
const T = {
  fr: {
    all: 'Tous les jours', day: 'Jour', dayShort: 'J', failed: 'Échec du chargement', noData: 'Pas encore de données',
    trade: 'Trade', pnl: 'P&L', cum: 'Cumul', dd: 'Drawdown', balance: 'Solde', worstOpen: 'Pire latent', target: 'Objectif',
    mll: 'Seuil MLL', lock: 'Verrou MLL', start: 'Départ', long: 'Long', short: 'Short',
    asia: 'Asie', london: 'Londres', ny: 'New York', win: 'Gain', be: 'BE', small_loss: 'Petite perte', stop: 'Stop',
    big_loss: 'Grosse perte', first: '1er de la journée', loss: 'Perte', in: 'Dans la zone', out: 'Hors zone', na: 'n/d',
    m3: 'sous −2σ', m2: '−2σ à −1σ', m1: '−1σ à VWAP', p1: 'VWAP à +1σ', p2: '+1σ à +2σ', p3: 'au-dessus de +2σ',
    hi: 'Haut Asie', lo: 'Bas Asie', poc: 'POC Asie', vah: 'VAH Asie', val: 'VAL Asie', none: 'Loin des niveaux Asie',
    lhi: 'Haut Londres', llo: 'Bas Londres', lpoc: 'POC Londres', lvah: 'VAH Londres', lval: 'VAL Londres',
    size: 'Taille ×10 (NQ)', mae: 'Excursion ≥ seuil', stopx: 'Perte au-delà du stop', revenge: 'Réentrée rapide après perte',
    entry: 'Entrée', exit: 'Sortie', dur: 'Durée', mfe: 'MFE', maeL: 'MAE', vwap: 'VWAP', z: 'Écart au VWAP', price: 'Prix',
    score: 'Note', peak: 'Pic', giveback: 'Rendu après le pic', trades: 'trades', wr: 'Win rate', count: 'Trades',
    capture: 'Capturé', mfeLeft: 'MFE non capturée', yes: 'oui', no: 'non', close: 'Clôture', session: 'Session',
    d1: '< 30 s', d2: '30 s à 2 min', d3: '2 à 5 min', d4: '5 à 15 min', d5: '> 15 min', MNQ: 'MNQ (micro)', NQ: 'NQ (mini)',
    wd: ['lun.', 'mar.', 'mer.', 'jeu.', 'ven.', 'sam.', 'dim.'], rank: 'Rang', perTrade: 'P&L du trade',
  },
  en: {
    all: 'All days', day: 'Day', dayShort: 'D', failed: 'Failed to load', noData: 'No data yet',
    trade: 'Trade', pnl: 'P&L', cum: 'Cumulative', dd: 'Drawdown', balance: 'Balance', worstOpen: 'Worst open', target: 'Target',
    mll: 'MLL floor', lock: 'MLL lock', start: 'Start', long: 'Long', short: 'Short',
    asia: 'Asia', london: 'London', ny: 'New York', win: 'Win', be: 'BE', small_loss: 'Small loss', stop: 'Stop',
    big_loss: 'Big loss', first: 'First of the day', loss: 'Loss', in: 'In the zone', out: 'Outside the zone', na: 'n/a',
    m3: 'below −2σ', m2: '−2σ to −1σ', m1: '−1σ to VWAP', p1: 'VWAP to +1σ', p2: '+1σ to +2σ', p3: 'above +2σ',
    hi: 'Asia high', lo: 'Asia low', poc: 'Asia POC', vah: 'Asia VAH', val: 'Asia VAL', none: 'Away from Asia levels',
    lhi: 'London high', llo: 'London low', lpoc: 'London POC', lvah: 'London VAH', lval: 'London VAL',
    size: 'Size ×10 (NQ)', mae: 'Excursion ≥ threshold', stopx: 'Loss beyond stop', revenge: 'Quick re-entry after a loss',
    entry: 'Entry', exit: 'Exit', dur: 'Duration', mfe: 'MFE', maeL: 'MAE', vwap: 'VWAP', z: 'Distance to VWAP', price: 'Price',
    score: 'Score', peak: 'Peak', giveback: 'Given back after peak', trades: 'trades', wr: 'Win rate', count: 'Trades',
    capture: 'Captured', mfeLeft: 'MFE not captured', yes: 'yes', no: 'no', close: 'Close', session: 'Session',
    d1: '< 30 s', d2: '30 s to 2 min', d3: '2 to 5 min', d4: '5 to 15 min', d5: '> 15 min', MNQ: 'MNQ (micro)', NQ: 'NQ (mini)',
    wd: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'], rank: 'Rank', perTrade: 'Trade P&L',
  },
};
R.t = (k) => { const v = T[R.lang()][k]; return v === undefined ? k : v; };
const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
R.dateLabel = (iso) => {
  if (!iso) return '—';
  const [, m, d] = String(iso).slice(0, 10).split('-');
  return R.lang() === 'en' ? MON[+m - 1] + ' ' + +d : d + '/' + m;
};
R.dayLabel = (row) => R.t('day') + ' ' + row.day_no + ' · ' + R.t('wd')[(row.weekday || 1) - 1] + ' ' + R.dateLabel(row.session_date);
R.dayNo = (iso) => { const r = R.rows('days').find((d) => d.session_date === iso); return r ? r.day_no : '?'; };
R.label = (dim, key) => {
  if (key === null || key === undefined || key === '') return '—';
  if (dim === 'hour') return key + 'h';
  if (dim === 'nth') return key.replace(/^0/, '').replace('-0', '-').replace('-', '–');
  if (dim === 'flags') return String(key).split(',').filter(Boolean).map((f) => R.t(f === 'stop' ? 'stopx' : f)).join(' · ');
  return R.t(key);
};

/* number formats: one style for both languages, as in Lucid and MotiveWave */
const nf = (d) => new Intl.NumberFormat('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });
const F0 = nf(0), F1 = nf(1), F2 = nf(2);
const sg = (v) => (v > 0 ? '+' : v < 0 ? '-' : '');
const ab = (v) => Math.abs(v);
R.fmt = (v, f) => {
  if (v === null || v === undefined || v === '' || (typeof v === 'number' && !isFinite(v))) return '—';
  switch (f) {
    case 'usd': return (v < 0 ? '-' : '') + '$' + F2.format(ab(v));
    case 'usds': return sg(v) + '$' + F2.format(ab(v));
    case 'usd0': return (v < 0 ? '-' : '') + '$' + F0.format(ab(v));
    case 'usd0s': return sg(v) + '$' + F0.format(ab(v));
    case 'pct0': return F0.format(v * 100) + '%';
    case 'pct1': return F1.format(v * 100) + '%';
    case 'x2': return F2.format(v) + '×';
    case 'r2': return sg(v) + F2.format(ab(v)) + 'R';
    case 'n0': return F0.format(v);
    case 'n1': return F1.format(v);
    case 'n2': return F2.format(v);
    case 'pts': return F2.format(v) + ' pts';
    case 'ptss': return sg(v) + F2.format(ab(v)) + ' pts';
    case 'px': return F2.format(v);
    case 'min1': return F1.format(v) + ' min';
    case 'z': return sg(v) + F2.format(ab(v)) + 'σ';
    case 'score': return F0.format(v) + '/10';
    case 'date': return R.dateLabel(v);
    case 'yn': return R.t(v ? 'yes' : 'no');
    case 'lbl': return R.t(v);
    case 'flags': return v ? R.label('flags', v) : '—';
    case 'text': return String(v);
    default: return typeof v === 'number' ? F2.format(v) : String(v);
  }
};
R.tone = (v) => (v > 0 ? 'up' : v < 0 ? 'dn' : '');

/* marks: data-pick lists the keys of data-where that follow the controls */
R.pickWhere = (el) => {
  const picks = (el.dataset.pick || '').split(/\s+/).filter(Boolean);
  const now = { scope: R.scope(), mode: R.mode(), id: String(R.tradeId()), session_date: R.dayOrLatest() || '' };
  const ent = (el.dataset.where || '').split('&').filter(Boolean).map((p) => p.split('=').map(decodeURIComponent)).filter(([k]) => !picks.includes(k));
  picks.forEach((k) => ent.push([k, now[k] === undefined ? '' : now[k]]));
  el.dataset.where = ent.map(([k, v]) => encodeURIComponent(k) + '=' + encodeURIComponent(v)).join('&');
  return ent;
};
R.match = (rows, ent) => rows.find((r) => ent.every(([k, v]) => String(r[k]) === String(v)));

/* drawing helpers */
R.mk = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text !== undefined) e.textContent = text; return e; };
R.ready = (el, ids) => {
  const ds = ids.map((id) => dash.data(id));
  if (ds.some((d) => ['error', 'missing', 'connect', 'declined'].includes(d.status))) {
    el.classList.remove('dash-skeleton');
    const f = R.mk('div', 'fail'); f.append(R.mk('i'), R.mk('span', '', R.t('failed'))); el.replaceChildren(f);
    return null;
  }
  if (ds.some((d) => d.status !== 'ok')) { el.classList.add('dash-skeleton'); el.replaceChildren(); return null; }
  el.classList.remove('dash-skeleton');
  return ds.map((d) => d.data);
};
R.empty = (el, h) => { el.replaceChildren(R.mk('div', 'fail', R.t('noData'))); el.style.minHeight = h + 'px'; };
R.box = (el, h) => {
  const w = Math.max(280, Math.round(el.clientWidth || 640));
  el.replaceChildren();
  el.style.minHeight = h + 'px';
  const svg = d3.select(el).append('svg').attr('width', '100%').attr('viewBox', '0 0 ' + w + ' ' + h).attr('class', 'ch');
  return { svg, w, h };
};
R.textW = (svg, texts, cls) => {
  const g = svg.append('g').attr('class', cls || '');
  let m = 0;
  texts.forEach((s) => { const t = g.append('text').text(s); m = Math.max(m, t.node().getComputedTextLength()); });
  g.remove();
  return Math.ceil(m);
};
R.tip = (el) => { const t = R.mk('div', 'rtf-tip'); t.hidden = true; el.appendChild(t); return t; };
R.tipShow = (el, tip, head, lines, x, y) => {
  tip.replaceChildren(R.mk('div', 'tip-h', head));
  lines.forEach(([k, v, c]) => { const r = R.mk('div', 'tip-r'); r.append(R.mk('span', '', k), R.mk('b', c || '', v)); tip.appendChild(r); });
  tip.hidden = false;
  const W = el.clientWidth, tw = tip.offsetWidth, th = tip.offsetHeight;
  let left = x + 14; if (left + tw > W - 4) left = x - tw - 14; if (left < 4) left = 4;
  let top = y - th - 12; if (top < 4) top = Math.min(y + 14, Math.max(4, el.clientHeight - th - 4));
  tip.style.left = left + 'px'; tip.style.top = top + 'px';
};
R.yGrid = (svg, y, x0, x1, ticks, fmt) => {
  const g = svg.append('g').attr('class', 'grid');
  ticks.forEach((t) => {
    g.append('line').attr('x1', x0).attr('x2', x1).attr('y1', y(t)).attr('y2', y(t));
    g.append('text').attr('x', x0 - 8).attr('y', y(t)).attr('dy', '0.32em').attr('text-anchor', 'end').text(fmt(t));
  });
};
R.select = (id, open) => {
  dash.setParams({ trade: id });
  if (open) { R.openTab('trades'); const c = document.getElementById('trade-card'); if (c) c.scrollIntoView({ block: 'start', behavior: 'smooth' }); }
};
R.rcClass = (t) => 'rc-' + (t ? t.result_class : 'be');
R.tradeTip = (t, extra) => {
  const k = R.mode() === 'gross' ? 'pnl_gross' : 'pnl_net';
  return [R.t('trade') + ' #' + t.id + ' · ' + R.dateLabel(t.session_date) + ' ' + t.entry_hms,
    [[R.t(t.side) + ' ' + t.qty + ' ' + t.instrument, R.t(t.session)],
      [R.t('pnl'), R.fmt(t[k], 'usds'), R.tone(t[k])],
      [R.t('dur'), t.dur_s_txt], [R.t('maeL') + ' / ' + R.t('mfe'), R.fmt(t.mae_usd, 'usd0') + ' / ' + R.fmt(t.mfe_usd, 'usd0')]]
      .concat(extra || [])];
};

/* ---------- calculations (each one is self-contained: readers can see it) ---------- */
dash.calc('perf', {
  title: 'KPIs de performance',
  description: 'Win rate, profit factor, espérance, R, drawdown, séries, durées et MAE/MFE pour tous les jours (scope=all) et chaque jour, en net et en brut. Gagnant = P&L > 0 ; R = perte moyenne de tous les trades.',
  inputs: ['trades'],
  fn: (trades) => {
    const sum = (a) => a.reduce((s, x) => s + x, 0);
    const avg = (a) => (a.length ? sum(a) / a.length : null);
    const days = [...new Set(trades.map((t) => t.session_date))].sort();
    const out = [];
    for (const mode of ['net', 'gross']) {
      const k = mode === 'net' ? 'pnl_net' : 'pnl_gross';
      const allLosses = trades.map((t) => t[k]).filter((x) => x < 0);
      const r = allLosses.length ? -avg(allLosses) : null;
      for (const scope of ['all', ...days]) {
        const ts = trades.filter((t) => scope === 'all' || t.session_date === scope).sort((a, b) => (a.entry_time < b.entry_time ? -1 : 1));
        const p = ts.map((t) => t[k]);
        const n = p.length;
        const w = p.filter((x) => x > 0), l = p.filter((x) => x < 0);
        const gw = sum(w), gl = -sum(l);
        let cum = 0, peak = 0, dd = 0, ws = 0, ls = 0, bw = 0, bl = 0;
        for (const x of p) {
          cum += x; peak = Math.max(peak, cum); dd = Math.max(dd, peak - cum);
          ws = x > 0 ? ws + 1 : 0; ls = x < 0 ? ls + 1 : 0; bw = Math.max(bw, ws); bl = Math.max(bl, ls);
        }
        const mean = avg(p);
        const sd = n > 1 ? Math.sqrt(sum(p.map((x) => (x - mean) ** 2)) / (n - 1)) : null;
        const side = (s) => ts.filter((t) => t.side === s);
        const caps = ts.filter((t) => t.pnl_gross > 0 && t.mfe_usd > 0).map((t) => t.pnl_gross / t.mfe_usd);
        out.push({
          scope, mode, trades: n, wins: w.length, losses: l.length, win_rate: n ? w.length / n : null,
          pnl: sum(p), gross_profit: gw, gross_loss: gl, profit_factor: gl > 0 ? gw / gl : null,
          avg_win: avg(w), avg_loss: avg(l), payoff: w.length && l.length ? avg(w) / -avg(l) : null,
          expectancy: mean, r_unit: r, expectancy_r: mean !== null && r ? mean / r : null,
          sqn: sd ? (Math.sqrt(n) * mean) / sd : null, best: n ? Math.max(...p) : null, worst: n ? Math.min(...p) : null,
          max_dd: dd, max_win_streak: bw, max_loss_streak: bl, fees: sum(ts.map((t) => t.fees)),
          n_long: side('long').length, pnl_long: sum(side('long').map((t) => t[k])),
          wr_long: side('long').length ? side('long').filter((t) => t[k] > 0).length / side('long').length : null,
          n_short: side('short').length, pnl_short: sum(side('short').map((t) => t[k])),
          wr_short: side('short').length ? side('short').filter((t) => t[k] > 0).length / side('short').length : null,
          avg_dur_min: n ? avg(ts.map((t) => t.duration_s)) / 60 : null,
          avg_dur_win_min: w.length ? avg(ts.filter((t) => t[k] > 0).map((t) => t.duration_s)) / 60 : null,
          avg_dur_loss_min: l.length ? avg(ts.filter((t) => t[k] < 0).map((t) => t.duration_s)) / 60 : null,
          avg_mae_pts: avg(ts.map((t) => t.mae_pts)), avg_mfe_pts: avg(ts.map((t) => t.mfe_pts)),
          capture: avg(caps), etd_total: sum(ts.map((t) => t.etd_usd)), in_zone: ts.filter((t) => t.in_zone).length,
        });
      }
    }
    return out;
  },
});

dash.calc('curve', {
  title: 'Courbe trade par trade',
  description: 'Pour chaque trade dans l’ordre : P&L cumulé (net et brut), drawdown depuis le pic, cumul de la journée, rang dans la journée, R multiple (R = perte moyenne) et pire latent (cumul net avant le trade + MAE).',
  inputs: ['trades'],
  fn: (trades) => {
    const ts = [...trades].sort((a, b) => (a.entry_time < b.entry_time ? -1 : 1));
    const avgLoss = (k) => { const l = ts.map((t) => t[k]).filter((x) => x < 0); return l.length ? -l.reduce((s, x) => s + x, 0) / l.length : null; };
    const rn = avgLoss('pnl_net'), rg = avgLoss('pnl_gross');
    let cn = 0, cg = 0, pn = 0, pg = 0;
    const day = {};
    return ts.map((t, i) => {
      const d = (day[t.session_date] = day[t.session_date] || { n: 0, g: 0, k: 0, pn: 0, pg: 0 });
      const before = cn;
      cn += t.pnl_net; cg += t.pnl_gross; pn = Math.max(pn, cn); pg = Math.max(pg, cg);
      d.n += t.pnl_net; d.g += t.pnl_gross; d.k += 1; d.pn = Math.max(d.pn, d.n); d.pg = Math.max(d.pg, d.g);
      return {
        id: t.id, seq: i + 1, session_date: t.session_date, nth: d.k, session: t.session,
        pnl_net: t.pnl_net, pnl_gross: t.pnl_gross, cum_net: cn, cum_gross: cg, dd_net: cn - pn, dd_gross: cg - pg,
        day_net: d.n, day_gross: d.g, day_dd_net: d.n - d.pn, day_dd_gross: d.g - d.pg,
        r_net: rn ? t.pnl_net / rn : null, r_gross: rg ? t.pnl_gross / rg : null,
        worst_open_net: before + t.mae_usd,
      };
    });
  },
});

dash.calc('daily', {
  title: 'Bilan par jour',
  description: 'Par journée Lucid et par mode : trades, gagnants, win rate, P&L, frais, meilleur et pire trade, pic du cumul de la journée, P&L rendu après ce pic et trades pris après.',
  inputs: ['trades'],
  fn: (trades) => {
    const out = [];
    const days = [...new Set(trades.map((t) => t.session_date))].sort();
    for (const mode of ['net', 'gross']) {
      const k = mode === 'net' ? 'pnl_net' : 'pnl_gross';
      for (const day of days) {
        const ts = trades.filter((t) => t.session_date === day).sort((a, b) => (a.entry_time < b.entry_time ? -1 : 1));
        const p = ts.map((t) => t[k]);
        let cum = 0, peak = 0, peakAt = 0, low = 0;
        p.forEach((x, i) => { cum += x; if (cum > peak) { peak = cum; peakAt = i + 1; } low = Math.min(low, cum); });
        const wins = p.filter((x) => x > 0).length;
        out.push({
          rid: day + '|' + mode, session_date: day, mode, trades: ts.length, wins, win_rate: wins / ts.length, pnl: cum,
          fees: ts.reduce((s, t) => s + t.fees, 0), best: Math.max(...p), worst: Math.min(...p), peak, peak_at: peakAt,
          giveback: peak - cum, after_peak: ts.length - peakAt, low, first_entry: ts[0].entry_hms,
          last_exit: ts.map((t) => t.exit_time).sort().pop().slice(11),
        });
      }
    }
    return out;
  },
});

dash.calc('groups', {
  title: 'Répartitions',
  description: 'Trades, win rate, P&L, moyenne, profit factor, MAE/MFE moyens et durée moyenne par session, sens, instrument, heure de Paris, rang dans la journée, durée, position par rapport au VWAP (σ), zone, niveau Asie proche, trade précédent et classe de résultat ; pour tous les jours et chaque jour, en net et en brut.',
  inputs: ['trades', 'rules'],
  fn: (trades, rules) => {
    const near = rules[0].level_near_pts;
    const dims = {
      session: (t) => t.session,
      side: (t) => t.side,
      instrument: (t) => t.instrument,
      hour: (t) => String(t.hour).padStart(2, '0'),
      nth: (t) => (t.nth <= 5 ? '01-05' : t.nth <= 10 ? '06-10' : t.nth <= 15 ? '11-15' : t.nth <= 20 ? '16-20' : '21+'),
      dur: (t) => (t.duration_s < 30 ? 'd1' : t.duration_s < 120 ? 'd2' : t.duration_s < 300 ? 'd3' : t.duration_s < 900 ? 'd4' : 'd5'),
      band: (t) => t.band || 'na',
      zone: (t) => (t.in_zone ? 'in' : 'out'),
      level: (t) => (t.asia_lvl === null || t.asia_lvl === undefined ? 'na' : Math.abs(t.asia_dist) <= near ? t.asia_lvl : 'none'),
      prev: (t) => t.prev,
      result: (t) => t.result_class,
    };
    const sum = (a) => a.reduce((s, x) => s + x, 0);
    const days = [...new Set(trades.map((t) => t.session_date))].sort();
    const out = [];
    for (const scope of ['all', ...days]) {
      const ts = trades.filter((t) => scope === 'all' || t.session_date === scope);
      for (const mode of ['net', 'gross']) {
        const k = mode === 'net' ? 'pnl_net' : 'pnl_gross';
        for (const [dim, f] of Object.entries(dims)) {
          const g = {};
          ts.forEach((t) => { const key = f(t); (g[key] = g[key] || []).push(t); });
          for (const [key, list] of Object.entries(g)) {
            const p = list.map((t) => t[k]);
            const w = p.filter((x) => x > 0), l = p.filter((x) => x < 0);
            out.push({
              rid: [scope, mode, dim, key].join('|'), scope, mode, dim, key, trades: list.length, wins: w.length,
              win_rate: w.length / list.length, pnl: sum(p), avg: sum(p) / list.length,
              profit_factor: l.length ? sum(w) / -sum(l) : null,
              avg_mae_pts: sum(list.map((t) => t.mae_pts)) / list.length,
              avg_mfe_pts: sum(list.map((t) => t.mfe_pts)) / list.length,
              avg_dur_min: sum(list.map((t) => t.duration_s)) / list.length / 60,
            });
          }
        }
      }
    }
    return out;
  },
});

dash.calc('challenge', {
  title: 'Suivi du challenge',
  description: 'Solde de fin de journée (départ + P&L net), plus haut solde de clôture, seuil MLL en EOD trailing (verrouillé quand une clôture dépasse le seuil de verrouillage), coussin, pire latent de la journée, progression, conformité (taille, clôture avant 16:45 ET, microscalping) et consistance des payouts.',
  inputs: ['trades', 'days', 'rules'],
  fn: (trades, days, rules) => {
    const r = rules[0];
    const ts = [...trades].sort((a, b) => (a.entry_time < b.entry_time ? -1 : 1));
    const dates = [...new Set(ts.map((t) => t.session_date))].sort();
    const floor = (hwm) => Math.min(hwm - r.max_loss, r.mll_lock_level);
    let bal = r.start_balance, hwm = r.start_balance;
    const out = [{ kind: 'start', session_date: '', balance: bal, hwm, mll: floor(hwm), cushion: bal - floor(hwm), progress: 0 }];
    const dayPnl = [];
    for (const d of dates) {
      const open = bal, mllIn = floor(hwm);
      let eq = open, worst = open;
      for (const t of ts.filter((x) => x.session_date === d)) { worst = Math.min(worst, eq + t.mae_usd); eq += t.pnl_net; worst = Math.min(worst, eq); }
      bal = eq; hwm = Math.max(hwm, bal); dayPnl.push(eq - open);
      const lucid = (days.find((x) => x.session_date === d) || {}).balance_lucid;
      out.push({
        kind: 'day', session_date: d, open, balance: bal, pnl: eq - open, worst_open: worst, mll_in_force: mllIn,
        worst_cushion: worst - mllIn, hwm, mll: floor(hwm), cushion: bal - floor(hwm),
        progress: (bal - r.start_balance) / r.profit_target, balance_lucid: lucid === undefined ? null : lucid,
      });
    }
    const pos = (x) => Math.max(0, x);
    const profit = bal - r.start_balance;
    const best = dayPnl.length ? Math.max(...dayPnl) : 0;
    const allWins = ts.reduce((s, t) => s + pos(t.pnl_gross), 0);
    const quickWins = ts.filter((t) => t.duration_s <= r.microscalp_max_s).reduce((s, t) => s + pos(t.pnl_gross), 0);
    const flatBreaks = ts.filter((t) => t.exit_et >= r.flat_by_et && t.exit_et < r.reopen_et).length;
    const maxMinis = Math.max(0, ...ts.filter((t) => t.instrument === 'NQ').map((t) => t.qty));
    const maxMicros = Math.max(0, ...ts.filter((t) => t.instrument === 'MNQ').map((t) => t.qty));
    const dayRows = out.filter((o) => o.kind === 'day');
    const toTarget = Math.max(0, r.start_balance + r.profit_target - bal);
    const avgDay = dates.length ? profit / dates.length : null;
    out.push({
      kind: 'now', session_date: dates.length ? dates[dates.length - 1] : '', balance: bal, profit, progress: profit / r.profit_target,
      to_target: toTarget, target_balance: r.start_balance + r.profit_target, hwm, mll: floor(hwm), cushion: bal - floor(hwm),
      locked: hwm > r.mll_lock_trigger, passed: profit >= r.profit_target, days: dates.length, trades: ts.length,
      avg_day: avgDay, est_days: avgDay > 0 ? toTarget / avgDay : null,
      best_day: best, best_day_share: profit > 0 ? best / profit : null,
      consistency_ok: profit > 0 ? best / profit <= r.payout_consistency : null,
      microscalp_share: allWins ? quickWins / allWins : 0, microscalp_ok: (allWins ? quickWins / allWins : 0) <= r.microscalp_max_share,
      max_minis: maxMinis, max_micros: maxMicros, size_ok: maxMinis <= r.max_minis && maxMicros <= r.max_micros,
      flat_breaks: flatBreaks, flat_ok: flatBreaks === 0,
      last_exit_et: ts.map((t) => t.exit_et).filter((x) => x < r.flat_by_et && x >= '09:30').sort().pop() || null,
      worst_cushion: dayRows.length ? Math.min(...dayRows.map((o) => o.worst_cushion)) : null,
      mll_ok: dayRows.every((o) => o.worst_open > o.mll_in_force), payout_room: Math.max(0, bal - r.payout_buffer),
    });
    return out;
  },
});

dash.calc('sessions', {
  title: 'Sessions et mental',
  description: 'Par jour et par session (Asie, Londres, New York) : trades, gagnants, P&L net et brut, pire MAE, trades à risque et ta note de discipline.',
  inputs: ['trades', 'days'],
  fn: (trades, days) => {
    const out = [];
    for (const d of [...days].sort((a, b) => (a.session_date < b.session_date ? -1 : 1))) {
      for (const s of ['asia', 'london', 'ny']) {
        const ts = trades.filter((t) => t.session_date === d.session_date && t.session === s);
        const score = d['score_' + s];
        if (!ts.length && (score === null || score === undefined)) continue;
        out.push({
          rid: d.session_date + '|' + s, session_date: d.session_date, session: s, trades: ts.length,
          wins: ts.filter((t) => t.pnl_gross > 0).length,
          win_rate: ts.length ? ts.filter((t) => t.pnl_gross > 0).length / ts.length : null,
          pnl_net: ts.reduce((a, t) => a + t.pnl_net, 0), pnl_gross: ts.reduce((a, t) => a + t.pnl_gross, 0),
          worst_mae: ts.length ? Math.min(...ts.map((t) => t.mae_usd)) : null,
          risky: ts.filter((t) => t.risk_flags).length, score: score === undefined ? null : score,
        });
      }
    }
    return out;
  },
});

/* ---------- controls (they only set params, classes, hidden and aria-*) ---------- */
const applyUi = () => {
  const en = R.lang() === 'en', mode = R.mode();
  document.querySelectorAll('.rtf').forEach((w) => w.classList.toggle('is-en', en));
  document.querySelectorAll('.rtf-lang').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.lang === (en ? 'en' : 'fr'))));
  document.querySelectorAll('.rtf-mode').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.mode === mode)));
};
document.querySelectorAll('.rtf-lang').forEach((b) => b.addEventListener('click', () => { dash.setParams({ lang: b.dataset.lang }); applyUi(); }));
document.querySelectorAll('.rtf-mode').forEach((b) => b.addEventListener('click', () => { dash.setParams({ mode: b.dataset.mode }); applyUi(); }));
dash.onData(applyUi);
applyUi();

R.openTab = (name) => {
  const panes = Array.from(document.querySelectorAll('.rtf-pane'));
  if (!name || !panes.some((p) => p.id === name)) return false;
  panes.forEach((p) => { p.hidden = p.id !== name; });
  document.querySelectorAll('.rtf-tab').forEach((b) => b.setAttribute('aria-selected', String(b.dataset.tab === name)));
  dash.setLink(name);
  return true;
};
document.querySelectorAll('.rtf-tab').forEach((b) => b.addEventListener('click', () => R.openTab(b.dataset.tab)));
if (!R.openTab((location.hash || '').slice(1))) R.openTab('challenge');

document.querySelectorAll('.rtf-step').forEach((b) => b.addEventListener('click', () => {
  const ids = R.trades().filter(R.inScope).map((t) => t.id);
  const i = ids.indexOf(R.tradeId());
  const j = Math.max(0, Math.min(ids.length - 1, i + Number(b.dataset.step)));
  if (ids[j] !== undefined) dash.setParams({ trade: ids[j] });
}));
R.q = '';
R.sort = { f: 'entry_time', dir: -1 };
document.querySelectorAll('.rtf-search').forEach((inp) => inp.addEventListener('input', () => { R.q = inp.value.trim().toLowerCase(); dash.draw('tradetable'); }));
document.querySelectorAll('.rtf-sort').forEach((b) => b.addEventListener('click', () => {
  const f = b.dataset.sort;
  R.sort = { f, dir: R.sort.f === f ? -R.sort.dir : b.dataset.num ? -1 : 1 };
  document.querySelectorAll('.rtf-sort').forEach((x) => {
    const th = x.closest('th');
    if (th) th.setAttribute('aria-sort', x === b ? (R.sort.dir > 0 ? 'ascending' : 'descending') : 'none');
  });
  dash.draw('tradetable');
}));
document.querySelectorAll('.rtf-open').forEach((b) => b.addEventListener('click', () => R.openTab(b.dataset.tab)));

/* values, lists and tables */
(function () {
'use strict';
const R = window.RTF;

/* one value: data-source + data-field (+ data-where / data-row), data-pick = keys that follow the controls,
   data-fieldm = field prefix completed by the mode (pnl -> pnl_net / pnl_gross), data-fmt = format */
const drawValue = (el) => {
  const d = dash.data(el.dataset.source);
  if (d.status !== 'ok') { el.textContent = '—'; return; }
  if (el.dataset.fieldm) el.dataset.field = el.dataset.fieldm + '_' + R.mode();
  let row;
  if (el.dataset.row !== undefined) row = d.data[Number(el.dataset.row)];
  else row = R.match(d.data, R.pickWhere(el));
  const v = row ? row[el.dataset.field] : null;
  el.textContent = R.fmt(v, el.dataset.fmt);
  if (el.dataset.tone !== undefined) { el.classList.toggle('up', v > 0); el.classList.toggle('dn', v < 0); }
};
dash.draw('v', drawValue);
dash.draw('tv', drawValue);

/* status icon for a yes/no field: class is-ok / is-bad / is-na / is-wait */
dash.draw('ok', (el) => {
  const d = dash.data(el.dataset.source);
  el.textContent = '—';
  el.className = 'ok is-na';
  if (d.status !== 'ok') return;
  const row = R.match(d.data, R.pickWhere(el));
  const v = row ? row[el.dataset.field] : null;
  if (v === true) el.className = 'ok ' + (el.dataset.good === 'false' ? 'is-wait' : 'is-ok');
  else if (v === false) el.className = 'ok ' + (el.dataset.good === 'false' ? 'is-ok' : el.dataset.soft !== undefined ? 'is-wait' : 'is-bad');
  el.textContent = v === null || v === undefined ? '—' : R.t(v ? 'yes' : 'no');
});

/* the day picker: its choices are data */
dash.draw('dayselect', (sel) => {
  const days = R.days().slice().reverse();
  sel.replaceChildren(new Option(R.t('all'), ''), ...days.map((d) => new Option(R.dayLabel(d), d.session_date)));
  sel.value = R.day() || '';
  sel.onchange = () => dash.setParams({ day: sel.value || null, trade: null });
});

/* text of the day: ressenti and its label */
dash.draw('note', (el) => {
  const day = R.dayOrLatest();
  const row = R.rows('days').find((d) => d.session_date === day);
  el.dataset.field = R.lang() === 'en' ? 'note_en' : 'note_fr';
  el.dataset.where = 'session_date=' + encodeURIComponent(day || '');
  el.textContent = row && row[el.dataset.field] ? row[el.dataset.field] : '—';
});
dash.draw('daylabel', (el) => {
  const day = R.dayOrLatest();
  const row = R.rows('days').find((d) => d.session_date === day);
  el.dataset.where = 'session_date=' + encodeURIComponent(day || '');
  el.textContent = row ? R.dayLabel(row) : '—';
});
dash.draw('tradetitle', (el) => {
  const id = R.tradeId();
  const t = R.trades().find((x) => x.id === id);
  el.dataset.where = 'id=' + (id === null ? '' : id);
  el.textContent = t ? '#' + t.id + ' · ' + R.t(t.side) + ' ' + t.qty + ' ' + t.instrument + ' · ' + R.dateLabel(t.session_date) + ' ' + t.entry_hms : '—';
});
dash.draw('pill', (el) => {
  const id = R.tradeId();
  const t = R.trades().find((x) => x.id === id);
  el.dataset.where = 'id=' + (id === null ? '' : id);
  el.className = 'pill ' + (t ? t.result_class : '');
  el.textContent = t ? R.t(t.result_class) : '—';
});

/* progress toward the profit target */
dash.draw('progress', (el) => {
  const got = R.ready(el, ['challenge', 'rules']);
  if (!got) return;
  const now = got[0].find((x) => x.kind === 'now');
  const r = got[1][0];
  el.replaceChildren();
  if (!now) return;
  const bar = R.mk('div', 'prog');
  const fill = R.mk('div', 'prog-fill' + (now.progress < 0 ? ' neg' : ''));
  fill.style.width = Math.max(0, Math.min(1, Math.abs(now.progress))) * 100 + '%';
  bar.append(fill);
  [0.25, 0.5, 0.75].forEach((q) => { const t = R.mk('i', 'prog-tick'); t.style.left = q * 100 + '%'; bar.append(t); });
  const sc = R.mk('div', 'prog-scale');
  [0, 0.25, 0.5, 0.75, 1].forEach((q) => sc.append(R.mk('span', '', R.fmt(r.start_balance + q * r.profit_target, 'usd0'))));
  el.append(bar, sc);
});

/* payout consistency: best day share of total profit vs the limit */
dash.draw('consist', (el) => {
  const got = R.ready(el, ['challenge', 'rules']);
  if (!got) return;
  const now = got[0].find((x) => x.kind === 'now');
  const r = got[1][0];
  el.replaceChildren();
  if (!now) return;
  const share = now.best_day_share === null ? 0 : now.best_day_share;
  const bar = R.mk('div', 'prog');
  const fill = R.mk('div', 'prog-fill' + (share > r.payout_consistency ? ' neg' : ''));
  fill.style.width = Math.min(1, share) * 100 + '%';
  const mark = R.mk('i', 'prog-mark');
  mark.style.left = r.payout_consistency * 100 + '%';
  bar.append(fill, mark);
  const sc = R.mk('div', 'prog-scale');
  sc.append(R.mk('span', '', '0%'), R.mk('span', '', R.fmt(r.payout_consistency, 'pct0')), R.mk('span', '', '100%'));
  el.append(bar, sc);
});

/* generic breakdown table body (thead in the page) */
const ORDER = {
  session: ['asia', 'london', 'ny'], side: ['long', 'short'], instrument: ['MNQ', 'NQ'],
  nth: ['01-05', '06-10', '11-15', '16-20', '21+'], dur: ['d1', 'd2', 'd3', 'd4', 'd5'],
  band: ['m3', 'm2', 'm1', 'p1', 'p2', 'p3', 'na'], zone: ['in', 'out'], level: ['hi', 'vah', 'poc', 'val', 'lo', 'none', 'na'],
  prev: ['first', 'win', 'be', 'loss'], result: ['win', 'be', 'small_loss', 'stop', 'big_loss'],
};
const cellBar = (v, max) => {
  const s = R.mk('span', 'cellbar');
  const i = R.mk('i', v >= 0 ? 'p' : 'n');
  i.style.width = (Math.min(1, Math.abs(v) / max) * 50) + '%';
  s.append(i);
  return s;
};
const td = (text, cls) => { const c = R.mk('td', cls || ''); if (text !== undefined) c.append(R.mk('b', '', text)); return c; };
dash.draw('gtable', (tb) => {
  const d = dash.data('groups');
  tb.replaceChildren();
  if (d.status !== 'ok') return;
  const dim = tb.dataset.dim, scope = R.scope(), mode = R.mode();
  const order = ORDER[dim];
  const rows = d.data.filter((g) => g.scope === scope && g.mode === mode && g.dim === dim)
    .sort((a, b) => (order ? order.indexOf(a.key) - order.indexOf(b.key) : a.key < b.key ? -1 : 1));
  const max = Math.max(1, ...rows.map((g) => Math.abs(g.pnl)));
  rows.forEach((g) => {
    const tr = R.mk('tr');
    tr.dataset.key = g.rid;
    const first = R.mk('td', 'l');
    if (dim === 'session') first.append(R.mk('i', 'dot ' + g.key), ' ');
    first.append(R.label(dim, g.key));
    const pnl = R.mk('td');
    pnl.append(cellBar(g.pnl, max), R.mk('b', R.tone(g.pnl), R.fmt(g.pnl, 'usds')));
    tr.append(first, td(R.fmt(g.trades, 'n0')), td(R.fmt(g.win_rate, 'pct0')), pnl, td(R.fmt(g.avg, 'usds')),
      td(R.fmt(g.profit_factor, 'x2'), 'hide-s'), td(R.fmt(g.avg_mae_pts, 'n1'), 'hide-m'), td(R.fmt(g.avg_mfe_pts, 'n1'), 'hide-m'),
      td(R.fmt(g.avg_dur_min, 'min1'), 'hide-m'));
    tb.append(tr);
  });
});

/* one row per day */
dash.draw('daytable', (tb) => {
  const d = dash.data('daily');
  tb.replaceChildren();
  if (d.status !== 'ok') return;
  const mode = R.mode();
  d.data.filter((x) => x.mode === mode).sort((a, b) => (a.session_date < b.session_date ? 1 : -1)).forEach((x) => {
    const tr = R.mk('tr');
    tr.dataset.key = x.rid;
    const day = R.rows('days').find((r) => r.session_date === x.session_date);
    tr.append(R.mk('td', 'l', day ? R.dayLabel(day) : x.session_date), td(R.fmt(x.trades, 'n0')), td(R.fmt(x.win_rate, 'pct0')),
      td(R.fmt(x.pnl, 'usds')), td(R.fmt(x.fees, 'usd'), 'hide-s'), td(R.fmt(x.best, 'usds'), 'hide-m'), td(R.fmt(x.worst, 'usds'), 'hide-m'),
      td(R.fmt(x.peak, 'usds'), 'hide-m'), td(R.fmt(x.giveback, 'usd'), 'hide-m'), td(R.fmt(x.after_peak, 'n0'), 'hide-m'));
    tr.children[3].firstChild.className = R.tone(x.pnl);
    tb.append(tr);
  });
});

/* sessions: P&L next to the discipline score */
dash.draw('sesstable', (tb) => {
  const d = dash.data('sessions');
  tb.replaceChildren();
  if (d.status !== 'ok') return;
  d.data.filter((x) => !R.day() || x.session_date === R.day()).sort((a, b) => (a.session_date < b.session_date ? 1 : a.session_date > b.session_date ? -1 : 0)).forEach((x) => {
    const tr = R.mk('tr');
    tr.dataset.key = x.rid;
    const first = R.mk('td', 'l');
    first.append(R.mk('i', 'dot ' + x.session), ' ', R.dateLabel(x.session_date) + ' · ' + R.t(x.session));
    tr.append(first, td(R.fmt(x.score, 'score')), td(R.fmt(x.trades, 'n0')), td(R.fmt(x.win_rate, 'pct0')),
      td(R.fmt(x.pnl_net, 'usds')), td(R.fmt(x.pnl_gross, 'usds'), 'hide-m'), td(R.fmt(x.worst_mae, 'usd'), 'hide-m'), td(R.fmt(x.risky, 'n0'), 'hide-m'));
    tr.children[4].firstChild.className = R.tone(x.pnl_net);
    tr.children[5].firstChild.className = R.tone(x.pnl_gross);
    tb.append(tr);
  });
});

/* trades that took the most risk */
dash.draw('risktable', (tb) => {
  const ts = R.trades().filter((t) => R.inScope(t) && t.risk_flags);
  tb.replaceChildren();
  const k = 'pnl_net';
  ts.reverse().forEach((t) => {
    const tr = R.mk('tr');
    tr.dataset.key = String(t.id);
    tr.addEventListener('click', () => R.select(t.id, true));
    const first = R.mk('td', 'l');
    first.append(R.mk('b', '', '#' + t.id));
    tr.append(first, R.mk('td', 'l hide-m', R.dateLabel(t.session_date) + ' ' + t.entry_hms.slice(0, 5)),
      R.mk('td', 'l', R.t(t.session)), R.mk('td', 'l', R.t(t.side) + ' ' + t.qty + ' ' + t.instrument),
      td(R.fmt(t.mae_usd, 'usd')), td(R.fmt(t[k], 'usds')), R.mk('td', 'l wrap', R.label('flags', t.risk_flags)));
    tr.children[5].firstChild.className = R.tone(t[k]);
    tb.append(tr);
  });
});

/* the full list of trades: search and sort happen on the rows the page already has */
dash.draw('tradetable', (tb) => {
  tb.replaceChildren();
  const all = R.trades();
  if (!all.length) return;
  const sel = R.tradeId();
  const q = R.q || '';
  const text = (t) => [t.id, t.session_date, t.entry_hms, R.t(t.session), R.t(t.side), t.instrument, R.t(t.result_class), R.label('flags', t.risk_flags)].join(' ').toLowerCase();
  const f = R.sort.f, dir = R.sort.dir;
  const rows = all.filter((t) => R.inScope(t) && (!q || text(t).includes(q)))
    .sort((a, b) => { const x = a[f], y = b[f]; if (x === y) return 0; if (x === null || x === undefined) return 1; if (y === null || y === undefined) return -1; return (x < y ? -1 : 1) * dir; });
  rows.forEach((t) => {
    const tr = R.mk('tr', t.id === sel ? 'sel' : '');
    tr.dataset.key = String(t.id);
    tr.addEventListener('click', () => R.select(t.id, true));
    const first = R.mk('td', 'l');
    first.append(R.mk('b', '', '#' + t.id));
    const res = R.mk('td', 'l');
    res.append(R.mk('span', 'pill ' + t.result_class, R.t(t.result_class)));
    const sess = R.mk('td', 'l hide-s');
    sess.append(R.mk('i', 'dot ' + t.session), ' ', R.t(t.session));
    tr.append(first, R.mk('td', 'l hide-s', R.dateLabel(t.session_date)), R.mk('td', 'l', t.entry_hms), sess,
      R.mk('td', 'l', R.t(t.side)), R.mk('td', 'l hide-s', t.instrument), td(R.fmt(t.qty, 'n0'), 'hide-s'),
      td(R.fmt(t.entry_price, 'px'), 'hide-s'), td(R.fmt(t.exit_price, 'px'), 'hide-s'), R.mk('td', '', t.dur_s_txt),
      td(R.fmt(t.points, 'n2'), 'hide-s'), td(R.fmt(t.pnl_net, 'usds')), td(R.fmt(t.pnl_gross, 'usds'), 'hide-s'),
      td(R.fmt(t.mae_usd, 'usd'), 'hide-s'), td(R.fmt(t.mfe_usd, 'usd'), 'hide-s'), td(R.fmt(t.capture, 'pct0'), 'hide-s'),
      td(R.fmt(t.vwap_z, 'z'), 'hide-s'), res);
    tr.children[11].firstChild.className = R.tone(t.pnl_net);
    tr.children[12].firstChild.className = R.tone(t.pnl_gross);
    tb.append(tr);
  });
});
})();

/* charts (d3); every figure comes from the datasets or the calculations above */
(function () {
'use strict';
const R = window.RTF;
const ln = (svg, x1, x2, y1, y2, color, w, dash_) => svg.append('line').attr('x1', x1).attr('x2', x2).attr('y1', y1).attr('y2', y2)
  .style('stroke', color).style('stroke-width', w || 1).style('stroke-dasharray', dash_ || null);
const lab = (svg, x, y, text, cls, anchor) => svg.append('text').attr('class', 'lab ' + (cls || '')).attr('x', x).attr('y', y)
  .attr('text-anchor', anchor || 'start').text(text);
const tT = (s) => Date.parse((s.length === 16 ? s.replace(' ', 'T') + ':00' : s) + 'Z') / 60000; /* Paris wall clock, in minutes */
const pk = () => 'pnl_' + R.mode();
const spread = (items, gap, lo, hi) => { /* keep labels apart vertically */
  items.sort((a, b) => a.y - b.y);
  items.forEach((it, i) => { if (i && it.y - items[i - 1].y < gap) it.y = items[i - 1].y + gap; });
  const over = items.length ? items[items.length - 1].y - hi : 0;
  if (over > 0) items.forEach((it) => { it.y = Math.max(lo, it.y - over); });
  return items;
};
const hover = (el, tip, node, fn) => node
  .on('mouseenter', (e, d) => { const [head, lines, x, y] = fn(d); R.tipShow(el, tip, head, lines, x, y); })
  .on('mouseleave', () => { tip.hidden = true; });

/* Challenge: balance trade by trade against the MLL floor and the target */
dash.draw('balpath', (el) => {
  const got = R.ready(el, ['curve', 'challenge', 'rules', 'trades', 'days']);
  if (!got) return;
  const [curve, ch, rules, trades] = got;
  const r = rules[0], H = 320;
  if (!curve.length) return R.empty(el, H);
  const { svg, w } = R.box(el, H);
  const start = r.start_balance, target = r.start_balance + r.profit_target;
  const byId = new Map(trades.map((t) => [t.id, t]));
  const days = ch.filter((c) => c.kind === 'day');
  const pts = curve.slice().sort((a, b) => a.seq - b.seq).map((c) => ({
    seq: c.seq, id: c.id, d: c.session_date, bal: start + c.cum_net, before: start + c.cum_net - c.pnl_net,
    wo: start + c.worst_open_net, t: byId.get(c.id),
  }));
  const lo = Math.min(...days.map((c) => c.mll_in_force), ...pts.map((p) => p.wo)) - 90;
  const hi = Math.max(target, ...pts.map((p) => p.bal)) + 90;
  const yb = H - 26;
  const y = d3.scaleLinear([lo, hi], [yb, 18]);
  const ticks = y.ticks(6);
  const ml = R.textW(svg, ticks.map((t) => R.fmt(t, 'usd0'))) + 16, mr = 12;
  const x = d3.scaleLinear([0, pts.length], [ml, w - mr]);
  R.yGrid(svg, y, ml, w - mr, ticks, (t) => R.fmt(t, 'usd0'));
  days.forEach((c, i) => {
    const ds = pts.filter((p) => p.d === c.session_date);
    if (!ds.length) return;
    const x0 = x(ds[0].seq - 1), x1 = x(ds[ds.length - 1].seq);
    svg.append('rect').attr('x', x0).attr('y', y(c.mll_in_force)).attr('width', Math.max(1, x1 - x0))
      .attr('height', Math.max(0, yb - y(c.mll_in_force))).style('fill', 'var(--loss)').style('opacity', 0.09);
    ln(svg, x0, x1, y(c.mll_in_force), y(c.mll_in_force), 'var(--loss)', 2);
    if (i > 0) ln(svg, x0, x0, 16, yb, 'var(--line2)', 1, '3 4');
    if (x1 - x0 > 18) lab(svg, (x0 + x1) / 2, H - 8, R.t('dayShort') + R.dayNo(c.session_date), '', 'middle');
  });
  if (days.length) lab(svg, ml + 6, y(days[0].mll_in_force) - 7, R.t('mll') + ' ' + R.fmt(days[0].mll_in_force, 'usd0'), 'r');
  ln(svg, ml, w - mr, y(target), y(target), 'var(--gain)', 1.5, '6 5');
  lab(svg, ml + 6, y(target) - 7, R.t('target') + ' ' + R.fmt(target, 'usd0'), 'g');
  if (r.mll_lock_level > lo && r.mll_lock_level < hi) {
    ln(svg, ml, w - mr, y(r.mll_lock_level), y(r.mll_lock_level), 'var(--muted)', 1, '2 4');
    lab(svg, ml + 6, y(r.mll_lock_level) - 7, R.t('lock') + ' ' + R.fmt(r.mll_lock_level, 'usd0'));
  }
  ln(svg, ml, w - mr, y(start), y(start), 'var(--line2)', 1);
  lab(svg, w - mr - 4, y(start) + 15, R.t('start') + ' ' + R.fmt(start, 'usd0'), '', 'end');
  pts.forEach((p) => { if (p.wo < p.before) ln(svg, x(p.seq), x(p.seq), y(p.before), y(p.wo), 'var(--loss)', 1.2).style('opacity', 0.6); });
  svg.append('path').datum([{ seq: 0, bal: start }].concat(pts)).attr('d', d3.line().x((p) => x(p.seq)).y((p) => y(p.bal)))
    .style('fill', 'none').style('stroke', 'var(--hl)').style('stroke-width', 2).style('stroke-linejoin', 'round').style('stroke-linecap', 'round');
  svg.append('g').selectAll('circle').data(pts).join('circle').attr('class', (p) => R.rcClass(p.t))
    .attr('cx', (p) => x(p.seq)).attr('cy', (p) => y(p.bal)).attr('r', 3.6).style('stroke', 'var(--panel)').style('stroke-width', 1.5);
  const tip = R.tip(el);
  const near = (e) => { const [mx] = d3.pointer(e, el); const s = Math.round(x.invert(mx)); return pts[Math.max(0, Math.min(pts.length - 1, s - 1))]; };
  svg.append('rect').attr('class', 'hit clk').attr('x', ml).attr('y', 0).attr('width', Math.max(0, w - mr - ml)).attr('height', yb)
    .on('mousemove', (e) => {
      const p = near(e);
      if (!p || !p.t) return;
      const [head, lines] = R.tradeTip(p.t, [[R.t('balance'), R.fmt(p.bal, 'usd')], [R.t('worstOpen'), R.fmt(p.wo, 'usd')]]);
      R.tipShow(el, tip, head, lines, x(p.seq), y(p.bal));
    })
    .on('mouseleave', () => { tip.hidden = true; })
    .on('click', (e) => { const p = near(e); if (p) R.select(p.id, true); });
});

/* Performance: cumulative P&L with drawdown, and each trade's P&L */
dash.draw('pnlchart', (el) => {
  const got = R.ready(el, ['curve', 'trades']);
  if (!got) return;
  const [curve, trades] = got;
  const H = 360, m = R.mode(), dayMode = !!R.day();
  const rows = curve.filter((c) => !dayMode || c.session_date === R.day()).sort((a, b) => a.seq - b.seq);
  if (!rows.length) return R.empty(el, H);
  const { svg, w } = R.box(el, H);
  const byId = new Map(trades.map((t) => [t.id, t]));
  const pts = rows.map((c, i) => ({
    i: i + 1, id: c.id, d: c.session_date, v: c['pnl_' + m], t: byId.get(c.id),
    cum: dayMode ? c['day_' + m] : c['cum_' + m], dd: dayMode ? c['day_dd_' + m] : c['dd_' + m],
  }));
  const yc = d3.scaleLinear([Math.min(0, ...pts.map((p) => p.cum)), Math.max(1, ...pts.map((p) => p.cum - p.dd))], [206, 14]).nice(5);
  const yv = d3.scaleLinear([Math.min(0, ...pts.map((p) => p.v)), Math.max(1, ...pts.map((p) => p.v))], [H - 28, 236]).nice(3);
  const tc = yc.ticks(5), tv = yv.ticks(3);
  const ml = R.textW(svg, tc.concat(tv).map((t) => R.fmt(t, 'usd0s'))) + 16, mr = 12;
  const x = d3.scaleBand(pts.map((p) => p.i), [ml, w - mr]).padding(0.25);
  const cx = (p) => x(p.i) + x.bandwidth() / 2;
  R.yGrid(svg, yc, ml, w - mr, tc, (t) => R.fmt(t, 'usd0s'));
  R.yGrid(svg, yv, ml, w - mr, tv, (t) => R.fmt(t, 'usd0s'));
  if (!dayMode) pts.forEach((p, i) => { if (i && p.d !== pts[i - 1].d) ln(svg, x(p.i) - (x.step() - x.bandwidth()) / 2, x(p.i) - (x.step() - x.bandwidth()) / 2, 8, H - 26, 'var(--line2)', 1, '3 4'); });
  svg.append('path').datum(pts).attr('d', d3.area().x(cx).y0(yc(0)).y1((p) => yc(p.cum))).style('fill', 'var(--gain)').style('opacity', 0.08);
  svg.append('path').datum(pts).attr('d', d3.area().x(cx).y0((p) => yc(p.cum - p.dd)).y1((p) => yc(p.cum))).style('fill', 'var(--loss)').style('opacity', 0.25);
  ln(svg, ml, w - mr, yc(0), yc(0), 'var(--line2)', 1);
  svg.append('path').datum(pts).attr('d', d3.line().x(cx).y((p) => yc(p.cum))).style('fill', 'none').style('stroke', 'var(--gain)')
    .style('stroke-width', 2).style('stroke-linejoin', 'round').style('stroke-linecap', 'round');
  svg.append('g').selectAll('rect').data(pts).join('rect').attr('x', (p) => x(p.i)).attr('width', x.bandwidth())
    .attr('y', (p) => yv(Math.max(0, p.v))).attr('height', (p) => Math.max(1, Math.abs(yv(p.v) - yv(0))))
    .attr('rx', Math.min(3, x.bandwidth() / 2)).style('fill', (p) => (p.v >= 0 ? 'var(--gain)' : 'var(--loss)'));
  ln(svg, ml, w - mr, yv(0), yv(0), 'var(--line2)', 1);
  const every = Math.max(1, Math.ceil(30 / x.step()));
  pts.forEach((p, i) => { if (i % every === 0) svg.append('text').attr('x', cx(p)).attr('y', H - 8).attr('text-anchor', 'middle').text('#' + p.id); });
  const tip = R.tip(el);
  const near = (e) => { const [mx] = d3.pointer(e, el); return pts[Math.max(0, Math.min(pts.length - 1, Math.floor((mx - ml) / x.step())))]; };
  svg.append('rect').attr('class', 'hit clk').attr('x', ml).attr('y', 0).attr('width', Math.max(0, w - mr - ml)).attr('height', H - 22)
    .on('mousemove', (e) => {
      const p = near(e);
      if (!p || !p.t) return;
      const [head, lines] = R.tradeTip(p.t, [[R.t('cum'), R.fmt(p.cum, 'usds'), R.tone(p.cum)], [R.t('dd'), R.fmt(p.dd, 'usd')]]);
      R.tipShow(el, tip, head, lines, cx(p), yc(p.cum));
    })
    .on('mouseleave', () => { tip.hidden = true; })
    .on('click', (e) => { const p = near(e); if (p) R.select(p.id, true); });
});

/* Performance: distribution of results in R */
dash.draw('rdist', (el) => {
  const got = R.ready(el, ['curve']);
  if (!got) return;
  const H = 240, m = R.mode();
  const vals = got[0].filter((c) => !R.day() || c.session_date === R.day()).map((c) => c['r_' + m]).filter((v) => v !== null && isFinite(v));
  if (!vals.length) return R.empty(el, H);
  const { svg, w } = R.box(el, H);
  const lo = Math.floor(Math.min(0, ...vals) * 2) / 2, hi = Math.ceil(Math.max(0.5, ...vals) * 2) / 2;
  const bins = d3.bin().domain([lo, hi]).thresholds(d3.range(lo + 0.5, hi - 1e-9, 0.5))(vals);
  const yb = H - 28;
  const y = d3.scaleLinear([0, Math.max(1, ...bins.map((b) => b.length))], [yb, 14]).nice();
  const ticks = y.ticks(Math.min(5, y.domain()[1]));
  const ml = R.textW(svg, ticks.map((t) => R.fmt(t, 'n0'))) + 16, mr = 14;
  const x = d3.scaleLinear([lo, hi], [ml, w - mr]);
  R.yGrid(svg, y, ml, w - mr, ticks.filter((t) => Number.isInteger(t)), (t) => R.fmt(t, 'n0'));
  svg.append('g').selectAll('rect').data(bins).join('rect').attr('x', (b) => x(b.x0) + 1).attr('width', (b) => Math.max(1, x(b.x1) - x(b.x0) - 2))
    .attr('y', (b) => y(b.length)).attr('height', (b) => yb - y(b.length)).attr('rx', 3)
    .style('fill', (b) => (b.x0 >= 0 ? 'var(--gain)' : 'var(--loss)')).style('opacity', 0.85);
  ln(svg, x(0), x(0), 10, yb, 'var(--hl)', 1.5, '4 3');
  const step = Math.max(1, Math.ceil(40 / (x(1) - x(0))));
  for (let v = Math.ceil(lo); v <= Math.floor(hi); v += step) svg.append('text').attr('x', x(v)).attr('y', H - 9).attr('text-anchor', 'middle').text(v === 0 ? '0' : (v > 0 ? '+' : '') + v + 'R');
});

/* Execution: MAE vs MFE in points */
dash.draw('maemfe', (el) => {
  const got = R.ready(el, ['trades']);
  if (!got) return;
  const H = 320, k = pk();
  const ts = got[0].filter(R.inScope);
  if (!ts.length) return R.empty(el, H);
  const { svg, w } = R.box(el, H);
  const yb = H - 30;
  const y = d3.scaleLinear([0, Math.max(5, ...ts.map((t) => t.mae_pts), ...ts.map((t) => t.mfe_pts)) * 1.06], [yb, 12]).nice();
  const ticks = y.ticks(6);
  const ml = R.textW(svg, ticks.map((t) => R.fmt(t, 'n0'))) + 16, mr = 14;
  const x = d3.scaleLinear(y.domain(), [ml, w - mr]);
  R.yGrid(svg, y, ml, w - mr, ticks, (t) => R.fmt(t, 'n0'));
  x.ticks(Math.max(3, Math.floor((w - ml) / 70))).forEach((t) => svg.append('text').attr('x', x(t)).attr('y', H - 10).attr('text-anchor', 'middle').text(R.fmt(t, 'n0')));
  ln(svg, x(0), x(y.domain()[1]), y(0), y(y.domain()[1]), 'var(--line2)', 1, '4 4');
  const rs = d3.scaleSqrt([0, Math.max(1, ...ts.map((t) => Math.abs(t[k])))], [3, 11]);
  const tip = R.tip(el);
  const dots = svg.append('g').selectAll('circle').data(ts.slice().sort((a, b) => Math.abs(b[k]) - Math.abs(a[k]))).join('circle')
    .attr('class', (t) => 'clk ' + R.rcClass(t)).attr('cx', (t) => x(t.mae_pts)).attr('cy', (t) => y(t.mfe_pts)).attr('r', (t) => rs(Math.abs(t[k])))
    .style('fill-opacity', 0.8).style('stroke', 'var(--panel)').style('stroke-width', 1.2)
    .on('click', (e, t) => R.select(t.id, true));
  hover(el, tip, dots, (t) => { const [h, l] = R.tradeTip(t, [['MAE / MFE (pts)', R.fmt(t.mae_pts, 'n2') + ' / ' + R.fmt(t.mfe_pts, 'n2')]]); return [h, l, x(t.mae_pts), y(t.mfe_pts)]; });
});

/* Execution: share of the best excursion kept by each winner */
dash.draw('capture', (el) => {
  const got = R.ready(el, ['trades']);
  if (!got) return;
  const ws = got[0].filter((t) => R.inScope(t) && t.pnl_gross > 0 && t.mfe_usd > 0).sort((a, b) => b.capture - a.capture);
  if (!ws.length) return R.empty(el, 160);
  const rowH = 21, H = ws.length * rowH + 34;
  const { svg, w } = R.box(el, H);
  const ml = R.textW(svg, ws.map((t) => '#' + t.id)) + 14, mr = R.textW(svg, ['100%'], 'lab') + 14;
  const x = d3.scaleLinear([0, Math.max(...ws.map((t) => t.mfe_usd))], [ml, w - mr]).nice();
  const xt = x.ticks(Math.max(2, Math.floor((w - ml - mr) / 80)));
  xt.forEach((v) => { ln(svg, x(v), x(v), 4, H - 24, 'var(--line)', 1); svg.append('text').attr('x', x(v)).attr('y', H - 8).attr('text-anchor', 'middle').text(R.fmt(v, 'usd0')); });
  const tip = R.tip(el);
  ws.forEach((t, i) => {
    const yy = 6 + i * rowH;
    svg.append('text').attr('x', ml - 8).attr('y', yy + 11).attr('text-anchor', 'end').text('#' + t.id);
    svg.append('rect').attr('x', ml).attr('y', yy + 2).attr('width', Math.max(1, x(t.mfe_usd) - ml)).attr('height', 13).attr('rx', 3)
      .style('fill', 'var(--panel2)').style('stroke', 'var(--line2)');
    svg.append('rect').attr('x', ml).attr('y', yy + 2).attr('width', Math.max(1, x(t.pnl_gross) - ml)).attr('height', 13).attr('rx', 3).style('fill', 'var(--gain)');
    lab(svg, x(t.mfe_usd) + 6, yy + 13, R.fmt(t.capture, 'pct0'));
    const hit = svg.append('rect').attr('class', 'hit clk').attr('x', 0).attr('y', yy).attr('width', w).attr('height', rowH).datum(t)
      .on('click', () => R.select(t.id, true));
    hover(el, tip, hit, () => { const [h, l] = R.tradeTip(t, [[R.t('capture'), R.fmt(t.capture, 'pct0')], [R.t('mfeLeft'), R.fmt(t.etd_usd, 'usd')]]); return [h, l, x(t.pnl_gross), yy + 8]; });
  });
});

/* Execution: holding time vs P&L */
dash.draw('durscatter', (el) => {
  const got = R.ready(el, ['trades']);
  if (!got) return;
  const H = 280, k = pk();
  const ts = got[0].filter(R.inScope);
  if (!ts.length) return R.empty(el, H);
  const { svg, w } = R.box(el, H);
  const yb = H - 28;
  const y = d3.scaleLinear([Math.min(0, ...ts.map((t) => t[k])), Math.max(1, ...ts.map((t) => t[k]))], [yb, 12]).nice();
  const ticks = y.ticks(5);
  const ml = R.textW(svg, ticks.map((t) => R.fmt(t, 'usd0s'))) + 16, mr = 18;
  const x = d3.scaleLog([1, Math.max(3600, ...ts.map((t) => t.duration_s))], [ml, w - mr]);
  R.yGrid(svg, y, ml, w - mr, ticks, (t) => R.fmt(t, 'usd0s'));
  let last = -1e9;
  [[1, '1 s'], [10, '10 s'], [60, '1 min'], [300, '5 min'], [900, '15 min'], [3600, '1 h']].forEach(([v, s]) => {
    const px = x(v);
    if (px - last < 48) return;
    last = px;
    ln(svg, px, px, 12, yb, 'var(--line)', 1);
    svg.append('text').attr('x', px).attr('y', H - 9).attr('text-anchor', 'middle').text(s);
  });
  ln(svg, ml, w - mr, y(0), y(0), 'var(--line2)', 1);
  const tip = R.tip(el);
  const dots = svg.append('g').selectAll('circle').data(ts).join('circle').attr('class', (t) => 'clk ' + R.rcClass(t))
    .attr('cx', (t) => x(Math.max(1, t.duration_s))).attr('cy', (t) => y(t[k])).attr('r', 5.5)
    .style('fill-opacity', 0.85).style('stroke', 'var(--panel)').style('stroke-width', 1.2).on('click', (e, t) => R.select(t.id, true));
  hover(el, tip, dots, (t) => { const [h, l] = R.tradeTip(t); return [h, l, x(Math.max(1, t.duration_s)), y(t[k])]; });
});

/* Timing: P&L by hour of entry (Paris time) */
const barsBy = (el, dim, H, keyLabel) => {
  const got = R.ready(el, ['groups', 'trades']);
  if (!got) return;
  const [groups, trades] = got;
  const order = dim === 'nth' ? ['01-05', '06-10', '11-15', '16-20', '21+'] : null;
  const rows = groups.filter((g) => g.scope === R.scope() && g.mode === R.mode() && g.dim === dim)
    .sort((a, b) => (order ? order.indexOf(a.key) - order.indexOf(b.key) : a.key < b.key ? -1 : 1));
  if (!rows.length) return R.empty(el, H);
  const { svg, w } = R.box(el, H);
  const yb = H - (dim === 'hour' ? 44 : 30);
  const y = d3.scaleLinear([Math.min(0, ...rows.map((g) => g.pnl)), Math.max(1, ...rows.map((g) => g.pnl))], [yb, 22]).nice();
  const ticks = y.ticks(5);
  const ml = R.textW(svg, ticks.map((t) => R.fmt(t, 'usd0s'))) + 16, mr = 10;
  const x = d3.scaleBand(rows.map((g) => g.key), [ml, w - mr]).padding(0.3);
  R.yGrid(svg, y, ml, w - mr, ticks, (t) => R.fmt(t, 'usd0s'));
  const tip = R.tip(el);
  const bars = svg.append('g').selectAll('rect').data(rows).join('rect').attr('x', (g) => x(g.key)).attr('width', x.bandwidth())
    .attr('y', (g) => y(Math.max(0, g.pnl))).attr('height', (g) => Math.max(1, Math.abs(y(g.pnl) - y(0)))).attr('rx', Math.min(4, x.bandwidth() / 2))
    .style('fill', (g) => (g.pnl >= 0 ? 'var(--gain)' : 'var(--loss)'));
  ln(svg, ml, w - mr, y(0), y(0), 'var(--line2)', 1);
  rows.forEach((g) => {
    svg.append('text').attr('class', 'lab').attr('x', x(g.key) + x.bandwidth() / 2).attr('y', y(Math.max(0, g.pnl)) - 6)
      .attr('text-anchor', 'middle').text(R.fmt(g.trades, 'n0'));
    svg.append('text').attr('x', x(g.key) + x.bandwidth() / 2).attr('y', yb + 16).attr('text-anchor', 'middle').text(keyLabel(g.key));
  });
  if (dim === 'hour') {
    rows.forEach((g) => {
      const c = {};
      trades.filter((t) => R.inScope(t) && String(t.hour).padStart(2, '0') === g.key).forEach((t) => { c[t.session] = (c[t.session] || 0) + 1; });
      const s = Object.keys(c).sort((a, b) => c[b] - c[a])[0];
      if (s) svg.append('rect').attr('class', 's-' + s).attr('x', x(g.key)).attr('y', H - 14).attr('width', x.bandwidth()).attr('height', 4).attr('rx', 2);
    });
  }
  hover(el, tip, bars, (g) => [keyLabel(g.key), [[R.t('count'), R.fmt(g.trades, 'n0')], [R.t('wr'), R.fmt(g.win_rate, 'pct0')],
    [R.t('pnl'), R.fmt(g.pnl, 'usds'), R.tone(g.pnl)]], x(g.key) + x.bandwidth() / 2, y(Math.max(0, g.pnl))]);
};
dash.draw('hourbars', (el) => barsBy(el, 'hour', 260, (k) => k + 'h'));
dash.draw('nthbars', (el) => barsBy(el, 'nth', 240, (k) => R.label('nth', k)));

/* Timing: the session with VWAP bands, Asian levels and every trade */
dash.draw('daychart', (el) => {
  const got = R.ready(el, ['bars', 'days', 'trades']);
  if (!got) return;
  const [bars, days, trades] = got;
  const H = 430, day = R.dayOrLatest();
  const bs = bars.filter((b) => b.d === day).sort((a, b) => (a.t < b.t ? -1 : 1));
  if (!bs.length) return R.empty(el, H);
  const { svg, w } = R.box(el, H);
  const drow = days.find((d) => d.session_date === day) || {};
  const ts = trades.filter((t) => t.session_date === day);
  const tm = bs.map((b) => tT(b.t));
  const vb = bs.map((b, i) => ({ t: tm[i] + 0.5, vw: b.vw, sd: b.sd, c: b.c, s: b.t })).filter((b, i) => i >= 5 && b.sd > 0);
  const lv = ['hi', 'vah', 'poc', 'val', 'lo'].map((k) => ({ k, v: drow['asia_' + k] })).filter((l) => typeof l.v === 'number');
  const lo = Math.min(...bs.map((b) => b.l), ...vb.map((b) => b.vw - 2 * b.sd), ...lv.map((l) => l.v));
  const hi = Math.max(...bs.map((b) => b.h), ...vb.map((b) => b.vw + 2 * b.sd), ...lv.map((l) => l.v));
  const yb = H - 26, pad = (hi - lo) * 0.03;
  const y = d3.scaleLinear([lo - pad, hi + pad], [yb, 22]);
  const ticks = y.ticks(7);
  const ml = R.textW(svg, ticks.map((t) => R.fmt(t, 'n0'))) + 14;
  const mr = lv.length ? Math.min(140, R.textW(svg, lv.map((l) => R.t(l.k)), 'lab') + 16) : 12;
  const x = d3.scaleLinear([tm[0], tm[tm.length - 1] + 1], [ml, w - mr]);
  let s0 = 0;
  for (let i = 1; i <= bs.length; i++) {
    if (i === bs.length || bs[i].s !== bs[s0].s) {
      const x0 = x(tm[s0]), x1 = x(tm[i - 1] + 1);
      svg.append('rect').attr('class', 's-' + bs[s0].s).attr('x', x0).attr('y', 18).attr('width', Math.max(1, x1 - x0)).attr('height', yb - 18).style('opacity', 0.07);
      if (x1 - x0 > 60) svg.append('text').attr('class', 'lab s-' + bs[s0].s).attr('x', x0 + 6).attr('y', 12).text(R.t(bs[s0].s));
      s0 = i;
    }
  }
  R.yGrid(svg, y, ml, w - mr, ticks, (t) => R.fmt(t, 'n0'));
  const band = (a, b) => d3.area().x((p) => x(p.t)).y0((p) => y(p.vw + a * p.sd)).y1((p) => y(p.vw + b * p.sd));
  [[1, 2], [-2, -1]].forEach(([a, b]) => svg.append('path').datum(vb).attr('d', band(a, b)).style('fill', 'var(--warn)').style('opacity', 0.09));
  [-2, -1, 1, 2].forEach((k) => svg.append('path').datum(vb).attr('d', d3.line().x((p) => x(p.t)).y((p) => y(p.vw + k * p.sd)))
    .style('fill', 'none').style('stroke', 'var(--pink)').style('stroke-width', 1).style('stroke-dasharray', '4 4').style('opacity', 0.7));
  svg.append('path').datum(vb).attr('d', d3.line().x((p) => x(p.t)).y((p) => y(p.vw))).style('fill', 'none').style('stroke', 'var(--hl)')
    .style('stroke-width', 1.5).style('stroke-dasharray', '6 4');
  svg.append('path').datum(bs.map((b, i) => [tm[i] + 0.5, b.c])).attr('d', d3.line().x((p) => x(p[0])).y((p) => y(p[1])))
    .style('fill', 'none').style('stroke', 'var(--fg2)').style('stroke-width', 1.2).style('stroke-linejoin', 'round');
  const endAsia = bs.findIndex((b) => b.s !== 'asia');
  if (endAsia > 0 && lv.length) {
    const xa = x(tm[endAsia]);
    const items = lv.map((l) => ({ l, y: y(l.v) + 4 }));
    lv.forEach((l) => ln(svg, xa, w - mr, y(l.v), y(l.v), 'var(--asia)', l.k === 'poc' ? 1.6 : 1, l.k === 'hi' || l.k === 'lo' ? null : '3 3'));
    spread(items, 12, 12, yb).forEach((it) => lab(svg, w - mr + 6, it.y, R.t(it.l.k), 'v'));
  }
  const tip = R.tip(el);
  const cross = ln(svg, 0, 0, 18, yb, 'var(--muted)', 1, '2 3').style('opacity', 0);
  svg.append('rect').attr('class', 'hit').attr('x', ml).attr('y', 18).attr('width', Math.max(0, w - mr - ml)).attr('height', yb - 18)
    .on('mousemove', (e) => {
      const [mx] = d3.pointer(e, el);
      const i = Math.max(0, Math.min(bs.length - 1, d3.bisectLeft(tm, x.invert(mx)) - 1));
      const b = bs[i];
      cross.attr('x1', x(tm[i] + 0.5)).attr('x2', x(tm[i] + 0.5)).style('opacity', 1);
      const z = b.sd > 0 ? (b.c - b.vw) / b.sd : null;
      R.tipShow(el, tip, b.t.slice(11) + ' · ' + R.t(b.s), [[R.t('close'), R.fmt(b.c, 'px')], [R.t('vwap'), R.fmt(b.vw, 'px')], [R.t('z'), R.fmt(z, 'z')]], x(tm[i] + 0.5), y(b.c));
    })
    .on('mouseleave', () => { tip.hidden = true; cross.style('opacity', 0); });
  const g = svg.append('g');
  ts.forEach((t) => {
    const xe = x(tT(t.entry_time)), xx = x(tT(t.exit_time)), cls = R.rcClass(t), up = t.side === 'long';
    g.append('line').attr('class', cls).attr('x1', xe).attr('x2', xx).attr('y1', y(t.entry_price)).attr('y2', y(t.exit_price)).style('stroke', 'currentColor').style('stroke-width', 1.6);
    g.append('circle').attr('class', cls).attr('cx', xx).attr('cy', y(t.exit_price)).attr('r', 3).style('stroke', 'var(--panel)');
    const m = g.append('path').attr('class', 'clk ' + cls).attr('d', d3.symbol(d3.symbolTriangle, 64)())
      .attr('transform', 'translate(' + xe + ',' + (y(t.entry_price) + (up ? 9 : -9)) + ') rotate(' + (up ? 0 : 180) + ')')
      .style('stroke', 'var(--bg)').style('stroke-width', 1).datum(t).on('click', () => R.select(t.id, true));
    hover(el, tip, m, () => { const [h, l] = R.tradeTip(t, [[R.t('z'), R.fmt(t.vwap_z, 'z')]]); return [h, l, xe, y(t.entry_price)]; });
  });
  const spanH = (tm[tm.length - 1] - tm[0]) / 60;
  const step = [1, 2, 3, 4, 6].find((k) => ((w - ml - mr) / Math.max(1, spanH)) * k >= 64) || 6;
  bs.forEach((b, i) => {
    if (b.t.slice(14, 16) === '00' && +b.t.slice(11, 13) % step === 0) svg.append('text').attr('x', x(tm[i])).attr('y', H - 8).attr('text-anchor', 'middle').text(b.t.slice(11, 16));
  });
});

/* Timing: where each entry was against the session VWAP, in standard deviations */
dash.draw('zplot', (el) => {
  const got = R.ready(el, ['trades']);
  if (!got) return;
  const H = 214;
  const ts = got[0].filter((t) => R.inScope(t) && typeof t.vwap_z === 'number');
  if (!ts.length) return R.empty(el, H);
  const { svg, w } = R.box(el, H);
  const ml = R.textW(svg, [R.t('long'), R.t('short')], 'lab') + 20, mr = 18;
  const lim = Math.max(3, Math.ceil(Math.max(...ts.map((t) => Math.abs(t.vwap_z)))));
  const x = d3.scaleLinear([-lim, lim], [ml, w - mr]);
  const rows = { long: 66, short: 146 };
  [[-2, -1], [1, 2]].forEach(([a, b]) => svg.append('rect').attr('x', x(a)).attr('width', x(b) - x(a)).attr('y', 22).attr('height', H - 48).style('fill', 'var(--warn)').style('opacity', 0.11));
  const lstep = (x(1) - x(0)) < 38 ? 2 : 1;
  for (let z = -lim; z <= lim; z++) {
    ln(svg, x(z), x(z), 22, H - 26, z === 0 ? 'var(--hl)' : 'var(--line2)', z === 0 ? 1.5 : 1, z === 0 ? '6 4' : '3 4');
    if (z % lstep === 0) svg.append('text').attr('x', x(z)).attr('y', H - 9).attr('text-anchor', 'middle').text(z === 0 ? 'VWAP' : (z > 0 ? '+' : '-') + Math.abs(z) + 'σ');
  }
  Object.keys(rows).forEach((s) => lab(svg, ml - 14, rows[s] + 4, R.t(s), '', 'end'));
  const tip = R.tip(el);
  ['long', 'short'].forEach((s) => {
    const placed = [];
    ts.filter((t) => t.side === s).sort((a, b) => a.vwap_z - b.vwap_z).forEach((t) => {
      const cx = x(Math.max(-lim, Math.min(lim, t.vwap_z)));
      let dy = 0, n = 0;
      while (placed.some((p) => Math.abs(p.x - cx) < 11 && Math.abs(p.dy - dy) < 11) && n < 14) { n += 1; dy = (n % 2 ? 1 : -1) * Math.ceil(n / 2) * 11; }
      placed.push({ x: cx, dy });
      const c = svg.append('circle').attr('class', 'clk ' + R.rcClass(t)).attr('cx', cx).attr('cy', rows[s] + dy).attr('r', 5.5)
        .style('stroke', 'var(--panel)').style('stroke-width', 1.2).datum(t).on('click', () => R.select(t.id, true));
      hover(el, tip, c, () => { const [h, l] = R.tradeTip(t, [[R.t('z'), R.fmt(t.vwap_z, 'z')], [R.t('vwap'), R.fmt(t.vwap, 'px')]]); return [h, l, cx, rows[s] + dy]; });
    });
  });
});

/* Discipline: P&L of each session next to its score */
dash.draw('scorechart', (el) => {
  const got = R.ready(el, ['sessions']);
  if (!got) return;
  const H = 270, k = pk();
  const order = { asia: 0, london: 1, ny: 2 };
  const rows = got[0].filter((s) => !R.day() || s.session_date === R.day())
    .sort((a, b) => (a.session_date < b.session_date ? -1 : a.session_date > b.session_date ? 1 : order[a.session] - order[b.session]));
  if (!rows.length) return R.empty(el, H);
  const { svg, w } = R.box(el, H);
  const yb = H - 44;
  const y = d3.scaleLinear([Math.min(0, ...rows.map((s) => s[k])), Math.max(1, ...rows.map((s) => s[k]))], [yb, 24]).nice();
  const ys = d3.scaleLinear([0, 10], [yb, 24]);
  const ticks = y.ticks(5);
  const ml = R.textW(svg, ticks.map((t) => R.fmt(t, 'usd0s'))) + 16, mr = R.textW(svg, ['10/10']) + 18;
  const x = d3.scaleBand(rows.map((s) => s.rid), [ml, w - mr]).padding(0.38);
  R.yGrid(svg, y, ml, w - mr, ticks, (t) => R.fmt(t, 'usd0s'));
  [0, 5, 10].forEach((s) => svg.append('text').attr('x', w - mr + 10).attr('y', ys(s)).attr('dy', '0.32em').text(s + '/10'));
  ln(svg, ml, w - mr, y(0), y(0), 'var(--line2)', 1);
  const tip = R.tip(el);
  const bars = svg.append('g').selectAll('rect').data(rows).join('rect').attr('class', (s) => 's-' + s.session)
    .attr('x', (s) => x(s.rid)).attr('width', x.bandwidth()).attr('y', (s) => y(Math.max(0, s[k])))
    .attr('height', (s) => Math.max(1, Math.abs(y(s[k]) - y(0)))).attr('rx', Math.min(4, x.bandwidth() / 2)).style('opacity', 0.85);
  rows.forEach((s, i) => {
    const cx = x(s.rid) + x.bandwidth() / 2;
    if (typeof s.score === 'number') {
      svg.append('path').attr('d', d3.symbol(d3.symbolDiamond, 90)()).attr('transform', 'translate(' + cx + ',' + ys(s.score) + ')')
        .style('fill', 'var(--hl)').style('stroke', 'var(--bg)').style('stroke-width', 1.5);
      lab(svg, cx + 10, ys(s.score) + 4, R.fmt(s.score, 'score'), 'hl');
    }
    if (x.step() >= 64) svg.append('text').attr('class', 'lab s-' + s.session).attr('x', cx).attr('y', yb + 16).attr('text-anchor', 'middle').text(R.t(s.session));
    else svg.append('rect').attr('class', 's-' + s.session).attr('x', x(s.rid)).attr('y', yb + 8).attr('width', x.bandwidth()).attr('height', 4).attr('rx', 2);
    if (!i || rows[i - 1].session_date !== s.session_date) svg.append('text').attr('x', x(s.rid)).attr('y', H - 8).text(R.dateLabel(s.session_date));
  });
  hover(el, tip, bars, (s) => [R.dateLabel(s.session_date) + ' · ' + R.t(s.session), [[R.t('score'), R.fmt(s.score, 'score')],
    [R.t('count'), R.fmt(s.trades, 'n0')], [R.t('pnl'), R.fmt(s[k], 'usds'), R.tone(s[k])], [R.t('maeL') + ' max', R.fmt(s.worst_mae, 'usd')]],
    x(s.rid) + x.bandwidth() / 2, y(Math.max(0, s[k]))]);
});

/* Discipline: the day's running P&L, its peak and what was given back */
dash.draw('intraday', (el) => {
  const got = R.ready(el, ['curve', 'daily', 'trades']);
  if (!got) return;
  const [curve, daily, trades] = got;
  const H = 290, m = R.mode(), day = R.dayOrLatest();
  const rows = curve.filter((c) => c.session_date === day).sort((a, b) => a.nth - b.nth);
  if (!rows.length) return R.empty(el, H);
  const { svg, w } = R.box(el, H);
  const sum = daily.find((d) => d.session_date === day && d.mode === m);
  const byId = new Map(trades.map((t) => [t.id, t]));
  const pts = [{ n: 0, v: 0 }].concat(rows.map((c) => ({ n: c.nth, v: c['day_' + m], id: c.id, s: c.session, t: byId.get(c.id) })));
  const yb = H - 28;
  const y = d3.scaleLinear([Math.min(0, ...pts.map((p) => p.v)), Math.max(1, ...pts.map((p) => p.v))], [yb, 26]).nice();
  const ticks = y.ticks(5);
  const ml = R.textW(svg, ticks.map((t) => R.fmt(t, 'usd0s'))) + 16, mr = 16;
  const x = d3.scaleLinear([0, rows.length], [ml, w - mr]);
  R.yGrid(svg, y, ml, w - mr, ticks, (t) => R.fmt(t, 'usd0s'));
  ln(svg, ml, w - mr, y(0), y(0), 'var(--line2)', 1);
  if (sum && sum.peak > 0) {
    ln(svg, x(sum.peak_at), w - mr, y(sum.peak), y(sum.peak), 'var(--hl)', 1, '4 4');
    svg.append('circle').attr('cx', x(sum.peak_at)).attr('cy', y(sum.peak)).attr('r', 8).style('fill', 'none').style('stroke', 'var(--hl)').style('stroke-width', 1.5);
    const px = Math.max(ml + 50, Math.min(w - mr - 50, x(sum.peak_at)));
    lab(svg, px, y(sum.peak) - 14, R.t('peak') + ' ' + R.fmt(sum.peak, 'usds'), 'hl', 'middle');
  }
  svg.append('path').datum(pts).attr('d', d3.line().x((p) => x(p.n)).y((p) => y(p.v))).style('fill', 'none').style('stroke', 'var(--fg2)')
    .style('stroke-width', 2).style('stroke-linejoin', 'round');
  const tip = R.tip(el);
  const dots = svg.append('g').selectAll('circle').data(pts.slice(1)).join('circle').attr('class', (p) => 'clk s-' + p.s)
    .attr('cx', (p) => x(p.n)).attr('cy', (p) => y(p.v)).attr('r', 4.5).style('stroke', 'var(--panel)').style('stroke-width', 1.5)
    .on('click', (e, p) => R.select(p.id, true));
  hover(el, tip, dots, (p) => { const [h, l] = R.tradeTip(p.t, [[R.t('cum'), R.fmt(p.v, 'usds'), R.tone(p.v)]]); return [h, l, x(p.n), y(p.v)]; });
  const every = Math.max(1, Math.ceil(26 / ((w - ml - mr) / Math.max(1, rows.length))));
  rows.forEach((c) => { if (c.nth % every === 0 || c.nth === 1) svg.append('text').attr('x', x(c.nth)).attr('y', H - 8).attr('text-anchor', 'middle').text(c.nth); });
});

/* Trades: the selected trade on its 1-minute candles */
dash.draw('tradechart', (el) => {
  const got = R.ready(el, ['bars', 'trades', 'days']);
  if (!got) return;
  const [bars, trades, days] = got;
  const H = 450, id = R.tradeId();
  const t = trades.find((x) => x.id === id);
  if (!t) return R.empty(el, H);
  const all = bars.filter((b) => b.d === t.session_date).sort((a, b) => (a.t < b.t ? -1 : 1));
  const te = tT(t.entry_time), tx = tT(t.exit_time), span = tx - te;
  let bs = all.filter((b) => { const v = tT(b.t); return v >= te - Math.max(30, span * 0.6) && v <= tx + Math.max(20, span * 0.4); });
  if (bs.length < 8) bs = all;
  if (!bs.length) return R.empty(el, H);
  const { svg, w } = R.box(el, H);
  const tm = bs.map((b) => tT(b.t));
  const lo0 = Math.min(...bs.map((b) => b.l), t.min_price), hi0 = Math.max(...bs.map((b) => b.h), t.max_price);
  const pad = (hi0 - lo0) * 0.1 + 2, yb = H - 26;
  const y = d3.scaleLinear([lo0 - pad, hi0 + pad], [yb, 14]);
  const ticks = y.ticks(7);
  const ml = R.textW(svg, ticks.map((v) => R.fmt(v, 'n0'))) + 14;
  const mr = R.textW(svg, ['VWAP', '+2σ', R.t('lpoc')], 'lab') + 16;
  const x = d3.scaleLinear([tm[0], tm[tm.length - 1] + 1], [ml, w - mr]);
  const bw = Math.max(1, (x(tm[0] + 1) - x(tm[0])) * 0.68);
  svg.append('defs').append('clipPath').attr('id', 'rtf-clip-trade').append('rect').attr('x', ml).attr('y', 14).attr('width', Math.max(0, w - mr - ml)).attr('height', yb - 14);
  svg.append('rect').attr('x', x(te)).attr('width', Math.max(2, x(tx) - x(te))).attr('y', 14).attr('height', yb - 14).style('fill', 'var(--hl)').style('opacity', 0.07);
  R.yGrid(svg, y, ml, w - mr, ticks, (v) => R.fmt(v, 'n0'));
  const gc = svg.append('g').attr('clip-path', 'url(#rtf-clip-trade)');
  const vb = bs.map((b, i) => ({ t: tm[i] + 0.5, vw: b.vw, sd: b.sd })).filter((b) => b.sd > 0);
  const band = (a, b) => d3.area().x((p) => x(p.t)).y0((p) => y(p.vw + a * p.sd)).y1((p) => y(p.vw + b * p.sd));
  [[1, 2], [-2, -1]].forEach(([a, b]) => gc.append('path').datum(vb).attr('d', band(a, b)).style('fill', 'var(--warn)').style('opacity', 0.1));
  [-2, -1, 1, 2].forEach((k) => gc.append('path').datum(vb).attr('d', d3.line().x((p) => x(p.t)).y((p) => y(p.vw + k * p.sd)))
    .style('fill', 'none').style('stroke', 'var(--pink)').style('stroke-width', 1.1).style('stroke-dasharray', '4 4'));
  gc.append('path').datum(vb).attr('d', d3.line().x((p) => x(p.t)).y((p) => y(p.vw))).style('fill', 'none').style('stroke', 'var(--hl)').style('stroke-width', 1.6).style('stroke-dasharray', '6 4');
  const drow = days.find((d) => d.session_date === t.session_date) || {};
  const lv = [];
  if (t.session !== 'asia') ['hi', 'vah', 'poc', 'val', 'lo'].forEach((k) => { const v = drow['asia_' + k]; if (typeof v === 'number') lv.push({ k, v }); });
  if (t.session === 'ny') ['hi', 'vah', 'poc', 'val', 'lo'].forEach((k) => { const v = drow['london_' + k]; if (typeof v === 'number') lv.push({ k: 'l' + k, v }); });
  const yd = y.domain();
  const right = [];
  lv.filter((l) => l.v > yd[0] && l.v < yd[1]).forEach((l) => {
    ln(gc, ml, w - mr, y(l.v), y(l.v), l.k[0] === 'l' && l.k !== 'lo' ? 'var(--london)' : 'var(--asia)', l.k.endsWith('poc') ? 1.4 : 1, '2 3').style('opacity', 0.85);
    right.push({ y: y(l.v) + 4, text: R.t(l.k), cls: 'v' });
  });
  const lastB = vb[vb.length - 1];
  if (lastB) [[0, 'VWAP', 'hl'], [1, '+1σ', ''], [2, '+2σ', ''], [-1, '-1σ', ''], [-2, '-2σ', '']].forEach(([k, s, c]) => {
    const v = lastB.vw + k * lastB.sd;
    if (v > yd[0] && v < yd[1]) right.push({ y: y(v) + 4, text: s, cls: c });
  });
  spread(right, 12, 12, yb).forEach((it) => lab(svg, w - mr + 6, it.y, it.text, it.cls));
  bs.forEach((b, i) => {
    const cx = x(tm[i] + 0.5), col = b.c >= b.o ? 'var(--up)' : 'var(--down)';
    gc.append('line').attr('x1', cx).attr('x2', cx).attr('y1', y(b.h)).attr('y2', y(b.l)).style('stroke', col).style('stroke-width', 1);
    gc.append('rect').attr('x', cx - bw / 2).attr('width', bw).attr('y', y(Math.max(b.o, b.c))).attr('height', Math.max(1, Math.abs(y(b.o) - y(b.c)))).style('fill', col);
  });
  const fav = t.side === 'long' ? t.max_price : t.min_price, adv = t.side === 'long' ? t.min_price : t.max_price;
  ln(svg, x(te), x(tx), y(fav), y(fav), 'var(--gain)', 1.2, '2 3');
  ln(svg, x(te), x(tx), y(adv), y(adv), 'var(--loss)', 1.2, '2 3');
  ln(svg, x(te), x(tx), y(t.entry_price), y(t.entry_price), 'var(--fg)', 1, '5 4').style('opacity', 0.6);
  const cls = R.rcClass(t), up = t.side === 'long';
  svg.append('line').attr('class', cls).attr('x1', x(te)).attr('x2', x(tx)).attr('y1', y(t.entry_price)).attr('y2', y(t.exit_price)).style('stroke', 'currentColor').style('stroke-width', 2);
  svg.append('path').attr('class', cls).attr('d', d3.symbol(d3.symbolTriangle, 110)())
    .attr('transform', 'translate(' + x(te) + ',' + (y(t.entry_price) + (up ? 11 : -11)) + ') rotate(' + (up ? 0 : 180) + ')').style('stroke', 'var(--bg)').style('stroke-width', 1.2);
  svg.append('circle').attr('class', cls).attr('cx', x(tx)).attr('cy', y(t.exit_price)).attr('r', 4.5).style('stroke', 'var(--bg)').style('stroke-width', 1.2);
  const notes = spread([
    { y: y(t.exit_price) + 4, text: R.t('exit') + ' ' + R.fmt(t.exit_price, 'px'), cls: '' },
    { y: y(fav) + 4, text: 'MFE ' + R.fmt(t.mfe_pts, 'n2') + ' pts', cls: 'g' },
    { y: y(adv) + 4, text: 'MAE ' + R.fmt(t.mae_pts, 'n2') + ' pts', cls: 'r' },
  ], 13, 16, yb);
  const nx = x(tx) + 10, fitsRight = nx + 110 < w - mr;
  notes.forEach((n) => lab(svg, fitsRight ? nx : x(tx) - 10, n.y, n.text, n.cls, fitsRight ? 'start' : 'end'));
  const roomLeft = x(te) - ml > 124;
  lab(svg, roomLeft ? x(te) - 12 : x(te) + 12, y(t.entry_price) + (up ? 24 : -18), R.t('entry') + ' ' + R.fmt(t.entry_price, 'px'), '', roomLeft ? 'end' : 'start');
  const tip = R.tip(el);
  const cross = ln(svg, 0, 0, 14, yb, 'var(--muted)', 1, '2 3').style('opacity', 0);
  svg.append('rect').attr('class', 'hit').attr('x', ml).attr('y', 14).attr('width', Math.max(0, w - mr - ml)).attr('height', yb - 14)
    .on('mousemove', (e) => {
      const [mx] = d3.pointer(e, el);
      const i = Math.max(0, Math.min(bs.length - 1, d3.bisectLeft(tm, x.invert(mx)) - 1));
      const b = bs[i];
      cross.attr('x1', x(tm[i] + 0.5)).attr('x2', x(tm[i] + 0.5)).style('opacity', 1);
      R.tipShow(el, tip, b.t.slice(11), [['O / H', R.fmt(b.o, 'px') + ' / ' + R.fmt(b.h, 'px')], ['L / C', R.fmt(b.l, 'px') + ' / ' + R.fmt(b.c, 'px')],
        [R.t('vwap'), R.fmt(b.vw, 'px')], [R.t('z'), R.fmt(b.sd > 0 ? (b.c - b.vw) / b.sd : null, 'z')]], x(tm[i] + 0.5), y(b.c));
    })
    .on('mouseleave', () => { tip.hidden = true; cross.style('opacity', 0); });
  const spanMin = tm[tm.length - 1] - tm[0];
  const step = [5, 10, 15, 30, 60].find((k) => ((w - ml - mr) / Math.max(1, spanMin)) * k >= 56) || 60;
  bs.forEach((b, i) => { if (+b.t.slice(14, 16) % step === 0) svg.append('text').attr('x', x(tm[i])).attr('y', H - 8).attr('text-anchor', 'middle').text(b.t.slice(11, 16)); });
});
})();
