/* Road to 5 Live : les indicateurs en orbite (23/11 au soir).
   Les 12 indicateurs de la tier list (sans le RR théorique : on n'a pas les stops et TP prévus) tournent autour du trou
   noir comme des planètes, plus près quand ils comptent plus (S au plus près, D au plus loin). On clique sur une planète :
   la fenêtre « Indicateurs » montre sa valeur, ce qu'elle veut dire et son graphique.
   Calculs : sur tous les trades du journal (depuis le 28/10). Sharpe et VaR sur le P&L de chaque jour de trading.
   Style de marché : chaque séance (Asie, Londres, New York) est classée avec ses bougies 1 min : très volatile si ses
   bougies sont bien plus grandes que d'habitude pour cette séance, en tendance si le prix a fait du chemin dans un sens
   (efficacité = déplacement net / chemin parcouru), sinon en range. Needs app.js (window.R5) and espace.js (window.ESP). */
(function () {
  'use strict';
  const X = window.R5; if (!X) return;
  const { $, esc, nf, usd } = X;
  const fr = () => X.LANG === 'fr';
  const L = (en, f) => (fr() ? f : en);
  const sum = a => a.reduce((s, x) => s + x, 0), avg = a => (a.length ? sum(a) / a.length : 0);
  const sd = a => { if (a.length < 2) return 0; const m = avg(a); return Math.sqrt(sum(a.map(x => (x - m) ** 2)) / (a.length - 1)); };
  const quant = (a, q) => { if (!a.length) return 0; const s = a.slice().sort((x, y) => x - y), i = (s.length - 1) * q, lo = Math.floor(i), hi = Math.ceil(i); return s[lo] + (s[hi] - s[lo]) * (i - lo); };
  const sg = v => (v > 0 ? '+' : v < 0 ? '−' : '') + nf(Math.abs(v));
  const cl = v => (v > 0 ? 'up' : v < 0 ? 'dn' : '');
  const TIERS = { S: { r: 5.4, c: '#C9B8FF' }, A: { r: 8.3, c: '#8FB5FF' }, B: { r: 11.2, c: '#7FD8FF' }, C: { r: 14.0, c: '#FF8FC8' }, D: { r: 16.8, c: '#B8B4D8' } };
  let STY = null, sel = 'esp';

  /* ---------------- le style de marché de chaque séance ---------------- */
  function styles(bars) {
    if (!bars || !bars.length) return null;
    const g = {};
    bars.forEach(b => { const k = b.d + '|' + b.s; (g[k] = g[k] || []).push(b); });
    const S = Object.entries(g).filter(([, v]) => v.length >= 20).map(([k, v]) => {
      v.sort((a, b) => (a.t < b.t ? -1 : 1));
      const hi = Math.max(...v.map(b => b.h)), lo = Math.min(...v.map(b => b.l));
      const net = Math.abs(v[v.length - 1].c - v[0].o), mr = avg(v.map(b => b.h - b.l));
      const [d, s] = k.split('|');
      return { d, s, dir: hi > lo ? net / (hi - lo) : 0, mr, n: v.length, move: v[v.length - 1].c - v[0].o };
    });
    const med = {}; ['asia', 'london', 'ny'].forEach(s => { const m = S.filter(x => x.s === s).map(x => x.mr); med[s] = m.length ? quant(m, 0.5) : 1; });
    S.forEach(x => { x.vr = x.mr / (med[x.s] || 1); x.k = x.vr >= 1.4 ? 'vol' : x.dir >= 0.5 ? 'trend' : 'range'; });
    const by = {}; S.forEach(x => { by[x.d + '|' + x.s] = x; });
    const res = { trend: [], range: [], vol: [] };
    X.M.trades.forEach(t => { const x = by[t.session_date + '|' + t.session]; if (x) res[x.k].push(t.pnl_net); });
    const last = S.slice().sort((a, b) => (a.d + a.s < b.d + b.s ? -1 : 1)).pop();
    return { S, by, res, last };
  }
  const NOMSTY = () => ({ trend: L('Trend', 'Tendance'), range: L('Range', 'Range'), vol: L('Volatile', 'Volatil') });

  /* ---------------- les 12 indicateurs ---------------- */
  function calc() {
    const M = X.M, T = M.trades, P = T.map(t => t.pnl_net);
    const wn = P.filter(x => x > 0), ls = P.filter(x => x < 0);
    const R = ls.length ? -avg(ls) : 0;
    const byDay = {}; T.forEach(t => { byDay[t.session_date] = (byDay[t.session_date] || 0) + t.pnl_net; });
    const days = Object.keys(byDay).sort().map(d => ({ d, v: +byDay[d].toFixed(2) })), DV = days.map(x => x.v);
    // le Sharpe : tous les jours ouvrés depuis le premier trade (un jour sans trade compte pour 0)
    const ouv = []; if (days.length) { const d0 = new Date(days[0].d + 'T12:00:00Z'), d1 = new Date(days[days.length - 1].d + 'T12:00:00Z'); for (let d = d0; d <= d1; d = new Date(d.getTime() + 864e5)) { const w = d.getUTCDay(); if (w > 0 && w < 6) ouv.push(byDay[d.toISOString().slice(0, 10)] || 0); } }
    const shD = sd(ouv) ? avg(ouv) / sd(ouv) : 0, sh = shD * Math.sqrt(252);
    const var95 = quant(DV, 0.05), varT = quant(P, 0.05);
    let bw = 0, bl = 0, cw = 0, cl2 = 0; const seq = [];
    P.forEach(v => { if (v > 0) { cw++; cl2 = 0; seq.push(1); } else if (v < 0) { cl2++; cw = 0; seq.push(-1); } else { seq.push(0); } bw = Math.max(bw, cw); bl = Math.max(bl, cl2); });
    const curS = cw ? `${cw}W` : cl2 ? `${cl2}L` : '—';
    const mfe = T.map(t => t.mfe_usd).filter(v => v != null), mae = T.map(t => t.mae_usd).filter(v => v != null);
    const cap = T.filter(t => t.pnl_net > 0 && t.capture != null).map(t => t.capture);
    const gw = sum(wn), gl = -sum(ls);
    const ndays = days.length;
    const sty = STY;
    let styV = L('loading…', 'calcul…'), styN = '', styBest = null;
    if (sty) {
      const N = NOMSTY(), rows = Object.entries(sty.res).filter(([, v]) => v.length).map(([k, v]) => ({ k, n: v.length, e: avg(v), net: sum(v), w: v.filter(x => x > 0).length }));
      const ok = rows.filter(r => r.n >= 5).sort((a, b) => b.e - a.e);
      styBest = ok[0] || rows.sort((a, b) => b.e - a.e)[0];
      styV = styBest ? N[styBest.k] : '—';
      styN = (styBest ? L(`your best: ${sg(styBest.e)} $ per trade`, `ton meilleur : ${sg(styBest.e)} $ par trade`) : '') + (sty.last ? ' · ' + L('last session: ', 'dernière séance : ') + N[sty.last.k].toLowerCase() : '');
    }
    return [
      { id: 'esp', tier: 'S', n: L('Expectancy', 'Espérance'), v: sg(avg(P)) + ' $', c: cl(avg(P)), s: R ? L(`${sg(avg(P) / R)} R per trade (R = average loss)`, `${sg(avg(P) / R)} R par trade (R = perte moyenne)`) : '',
        x: L('What one trade brings on average, losses included. Above zero, the method pays over time.', 'Ce que rapporte un trade en moyenne, pertes comprises. Au-dessus de zéro, la méthode paie sur la durée.'), ch: () => chBars(P, avg(P)) },
      { id: 'sharpe', tier: 'S', n: L('Sharpe ratio', 'Ratio de Sharpe'), v: nf(sh, 2), c: sh >= 1 ? 'up' : sh < 0 ? 'dn' : '', s: L(`annualized · ${nf(shD, 2)} per day · ${ouv.length} weekdays (no trade = 0)`, `annualisé · ${nf(shD, 2)} par jour · ${ouv.length} jours ouvrés (sans trade = 0)`),
        x: L('Average daily P&L divided by how much it swings, scaled to a year (×√252). Above 1 is good, above 2 is very good. On so few days it is inflated: it will come down as the bad days arrive.', 'Le P&L moyen par jour divisé par ses écarts, ramené à l’année (×√252). Au-dessus de 1 c’est bien, au-dessus de 2 très bien. Sur si peu de jours il est gonflé : il redescendra avec les mauvais jours.'), ch: () => chBars(DV, avg(DV), days.map(x => x.d.slice(5))) },
      { id: 'style', tier: 'S', n: L('Market style', 'Style de marché'), v: styV, c: '', s: styN,
        x: L('Each session (Asia, London, New York) is classified from its 1-minute candles: volatile when its candles are 40 % bigger than usual for that session, trend when the price ends more than half its range away from where it started, range otherwise. Here: your results in each style.', 'Chaque séance (Asie, Londres, New York) est classée avec ses bougies 1 min : volatile quand ses bougies sont 40 % plus grandes que d’habitude pour cette séance, tendance quand le prix finit à plus de la moitié de son amplitude de son point de départ, range sinon. Ici : tes résultats dans chaque style.'), ch: () => chStyle() },
      { id: 'wr', tier: 'A', n: L('Win rate', 'Taux de réussite'), v: nf(T.length ? wn.length / T.length * 100 : 0, 0) + ' %', c: '', s: L(`${wn.length} won · ${ls.length} lost · ${T.length - wn.length - ls.length} flat`, `${wn.length} gagnés · ${ls.length} perdus · ${T.length - wn.length - ls.length} nuls`),
        x: L('The share of winning trades. Alone it says little: it has to be read with the real risk reward.', 'La part des trades gagnants. Seul, il ne dit pas grand-chose : il se lit avec le risk reward réel.'), ch: () => chDonut(wn.length, ls.length, T.length - wn.length - ls.length) },
      { id: 'rr', tier: 'A', n: L('Real risk reward', 'Risk reward réel'), v: R ? nf(avg(wn) / R, 2) : '—', c: '', s: L(`average win ${usd(avg(wn))} · average loss ${usd(-R)}`, `gain moyen ${usd(avg(wn))} · perte moyenne ${usd(-R)}`),
        x: L('Average win divided by average loss, on what really happened. With a 50 % win rate, it has to stay above 1.', 'Le gain moyen divisé par la perte moyenne, sur ce qui s’est vraiment passé. Avec 50 % de réussite, il doit rester au-dessus de 1.'), ch: () => chDuo(avg(wn), R, L('avg win', 'gain moyen'), L('avg loss', 'perte moyenne')) },
      { id: 'mfe', tier: 'A', n: 'MFE', v: '+' + nf(avg(mfe)) + ' $', c: 'up', s: cap.length ? L(`on winners you keep ${nf(avg(cap) * 100, 0)} % of the best move`, `sur tes gains, tu gardes ${nf(avg(cap) * 100, 0)} % du meilleur mouvement`) : '',
        x: L('Maximum favorable excursion: the most a trade was up before it closed, on average. Far above the result = exits too early.', 'Le plus haut gain atteint pendant le trade, en moyenne. Très au-dessus du résultat = des sorties trop tôt.'), ch: () => chPairs(T.map(t => [t.mfe_usd || 0, t.pnl_net])) },
      { id: 'mae', tier: 'A', n: 'MAE', v: sg(avg(mae)) + ' $', c: 'dn', s: mae.length ? L(`worst: ${usd(Math.min(...mae))}`, `pire : ${usd(Math.min(...mae))}`) : '',
        x: L('Maximum adverse excursion: how far a trade went against you before it closed, on average. It tells if the stops are well placed.', 'Le plus loin qu’un trade est allé contre toi avant d’être fermé, en moyenne. Il dit si les stops sont bien placés.'), ch: () => chPairs(T.map(t => [t.mae_usd || 0, t.pnl_net])) },
      { id: 'pf', tier: 'B', n: 'Profit factor', v: gl ? nf(gw / gl, 2) : '—', c: gl && gw / gl >= 1 ? 'up' : 'dn', s: L(`${usd(gw)} won for ${usd(gl)} lost`, `${usd(gw)} gagnés pour ${usd(gl)} perdus`),
        x: L('Everything won divided by everything lost. Above 1 the account grows; 1.5 and more is solid.', 'Tout ce qui est gagné divisé par tout ce qui est perdu. Au-dessus de 1 le compte monte ; 1,5 et plus, c’est solide.'), ch: () => chDuo(gw, gl, L('won', 'gagné'), L('lost', 'perdu')) },
      { id: 'nb', tier: 'B', n: L('Trades', 'Nombre de trades'), v: String(T.length), c: '', s: L(`${ndays} days · ${nf(T.length / Math.max(1, ndays), 1)} per day`, `${ndays} jours · ${nf(T.length / Math.max(1, ndays), 1)} par jour`),
        x: L('How many trades the numbers rest on. Under 100, every statistic here is still fragile.', 'Sur combien de trades reposent les chiffres. Sous 100, toutes les stats d’ici restent fragiles.'), ch: () => chCount(days.map(x => [x.d.slice(5), T.filter(t => t.session_date === x.d).length])) },
      { id: 'var', tier: 'C', n: L('VaR 95 %', 'VaR 95 %'), v: usd(var95), c: 'dn', s: L(`per trade: ${usd(varT)}`, `par trade : ${usd(varT)}`),
        x: L('Value at risk: on 95 % of days, the loss stays smaller than this (measured on your own days). The 5 % of other days can be worse.', 'Valeur à risque : 95 % des jours, la perte reste plus petite que ça (mesuré sur tes propres jours). Les 5 % d’autres jours peuvent être pires.'), ch: () => chHist(DV, var95) },
      { id: 'pnl', tier: 'C', n: 'P&L', v: usd(sum(P), 2, true), c: cl(sum(P)), s: L(`net of fees · ${T.length} trades`, `net de frais · ${T.length} trades`),
        x: L('Profit and loss of all logged trades, fees included. The result, not the process: that is why it is only in tier C.', 'Le gain ou la perte de tous les trades enregistrés, frais compris. Le résultat, pas le processus : c’est pour ça qu’il n’est qu’en C.'), ch: () => chCurve(P) },
      { id: 'series', tier: 'D', n: L('Streaks', 'Séries'), v: `${bw}W · ${bl}L`, c: '', s: L(`longest winning · losing · now ${curS}`, `plus longue gagnante · perdante · en cours ${curS}`),
        x: L('The longest runs of wins and losses in a row. Mostly chance: useful to know what a bad run looks like.', 'Les plus longues suites de gains et de pertes. Surtout du hasard : utile pour savoir à quoi ressemble une mauvaise passe.'), ch: () => chSeq(seq) }
    ];
  }

  /* ---------------- les petits graphiques (SVG) ---------------- */
  const Wc = 520, Hc = 130;
  const svg = (inner, h = Hc) => `<svg viewBox="0 0 ${Wc} ${h}" preserveAspectRatio="none" class="ind-svg">${inner}</svg>`;
  const G = 'var(--up)', Rr = 'var(--dn)', V = 'var(--amb)';
  function chBars(vals, mean, labels) {
    if (!vals.length) return '';
    const mx = Math.max(...vals.map(Math.abs), 1), bw = Wc / vals.length, y0 = Hc / 2;
    let s = vals.map((v, i) => { const h = Math.abs(v) / mx * (Hc / 2 - 8); return `<rect x="${(i * bw + bw * 0.18).toFixed(1)}" y="${(v >= 0 ? y0 - h : y0).toFixed(1)}" width="${(bw * 0.64).toFixed(1)}" height="${Math.max(1, h).toFixed(1)}" rx="2" fill="${v >= 0 ? G : Rr}" opacity=".85"/>`; }).join('');
    const ym = y0 - mean / mx * (Hc / 2 - 8);
    s += `<line x1="0" x2="${Wc}" y1="${y0}" y2="${y0}" stroke="rgba(255,255,255,.18)"/><line x1="0" x2="${Wc}" y1="${ym.toFixed(1)}" y2="${ym.toFixed(1)}" stroke="${V}" stroke-dasharray="6 5" stroke-width="2"/>`;
    return svg(s);
  }
  function chDonut(w, l, b) {
    const n = w + l + b || 1, r = 48, c = 2 * Math.PI * r; let off = 0;
    const seg = (v, col) => { const L2 = v / n * c, o = `<circle cx="65" cy="65" r="${r}" fill="none" stroke="${col}" stroke-width="16" stroke-dasharray="${L2.toFixed(1)} ${(c - L2).toFixed(1)}" stroke-dashoffset="${(-off).toFixed(1)}" transform="rotate(-90 65 65)"/>`; off += L2; return o; };
    return svg(seg(w, G) + seg(l, Rr) + seg(b, 'rgba(255,255,255,.35)') + `<text x="160" y="58" class="t1">${w} / ${n}</text><text x="160" y="86" class="t2">${esc(L('won / trades', 'gagnés / trades'))}</text>`);
  }
  function chDuo(a, b, la, lb) {
    const mx = Math.max(a, b, 1), w1 = a / mx * (Wc - 170), w2 = b / mx * (Wc - 170);
    return svg(`<text x="0" y="40" class="t2">${esc(la)}</text><rect x="150" y="24" width="${w1.toFixed(1)}" height="24" rx="5" fill="${G}"/><text x="${(156 + w1).toFixed(0)}" y="42" class="t3">${esc(usd(a))}</text>
      <text x="0" y="98" class="t2">${esc(lb)}</text><rect x="150" y="82" width="${w2.toFixed(1)}" height="24" rx="5" fill="${Rr}"/><text x="${(156 + w2).toFixed(0)}" y="100" class="t3">${esc(usd(-b))}</text>`);
  }
  function chPairs(pr) {
    if (!pr.length) return '';
    const mx = Math.max(...pr.map(p => Math.max(Math.abs(p[0]), Math.abs(p[1]))), 1), bw = Wc / pr.length, y0 = Hc / 2;
    return svg(pr.map((p, i) => { const h = Math.abs(p[0]) / mx * (Hc / 2 - 6), hr = Math.abs(p[1]) / mx * (Hc / 2 - 6), x = i * bw;
      return `<rect x="${(x + bw * 0.15).toFixed(1)}" y="${(p[0] >= 0 ? y0 - h : y0).toFixed(1)}" width="${(bw * 0.7).toFixed(1)}" height="${Math.max(1, h).toFixed(1)}" fill="${p[0] >= 0 ? G : Rr}" opacity=".28"/><rect x="${(x + bw * 0.38).toFixed(1)}" y="${(p[1] >= 0 ? y0 - hr : y0).toFixed(1)}" width="${(bw * 0.24).toFixed(1)}" height="${Math.max(1, hr).toFixed(1)}" fill="${p[1] >= 0 ? G : Rr}"/>`; }).join('') + `<line x1="0" x2="${Wc}" y1="${y0}" y2="${y0}" stroke="rgba(255,255,255,.18)"/>`);
  }
  function chCount(rows) {
    const mx = Math.max(...rows.map(r => r[1]), 1), bw = Wc / rows.length;
    return svg(rows.map((r, i) => { const h = r[1] / mx * (Hc - 26); return `<rect x="${(i * bw + bw * 0.2).toFixed(1)}" y="${(Hc - 18 - h).toFixed(1)}" width="${(bw * 0.6).toFixed(1)}" height="${h.toFixed(1)}" rx="3" fill="${V}" opacity=".85"/><text x="${(i * bw + bw / 2).toFixed(1)}" y="${Hc - 3}" class="t4">${r[1]}</text>`; }).join(''));
  }
  function chHist(DV, v95) {
    if (!DV.length) return '';
    const lo = Math.min(...DV, v95), hi = Math.max(...DV), nb = 12, w = (hi - lo) / nb || 1, c = new Array(nb).fill(0);
    DV.forEach(v => { c[Math.min(nb - 1, Math.floor((v - lo) / w))]++; });
    const mx = Math.max(...c, 1), bw = Wc / nb, xv = (v95 - lo) / (hi - lo || 1) * Wc;
    return svg(c.map((k, i) => { const h = k / mx * (Hc - 24); const mid = lo + (i + 0.5) * w; return `<rect x="${(i * bw + 2).toFixed(1)}" y="${(Hc - 10 - h).toFixed(1)}" width="${(bw - 4).toFixed(1)}" height="${h.toFixed(1)}" rx="3" fill="${mid < 0 ? Rr : G}" opacity=".8"/>`; }).join('') +
      `<line x1="${xv.toFixed(1)}" x2="${xv.toFixed(1)}" y1="6" y2="${Hc - 6}" stroke="${V}" stroke-width="2.5" stroke-dasharray="5 4"/><text x="${(xv + 8).toFixed(1)}" y="18" class="t3">VaR</text>`);
  }
  function chCurve(P) {
    let c = 0; const pts = [0].concat(P.map(v => (c += v)));
    const lo = Math.min(...pts), hi = Math.max(...pts), sx = Wc / (pts.length - 1 || 1), sy = v => Hc - 8 - (v - lo) / (hi - lo || 1) * (Hc - 16);
    const d = X.smoothPath(pts.map((v, i) => [i * sx, sy(v)]));
    return svg(`<defs>${X.curveDefs('indg', 0, Wc)}</defs><path d="${d}L${Wc},${Hc}L0,${Hc}Z" fill="url(#indg)"/><path d="${d}" fill="none" stroke="url(#indgs)" stroke-width="8" stroke-opacity=".5" filter="url(#indgb)"/><path d="${d}" fill="none" stroke="url(#indgs)" stroke-width="2.6" stroke-linecap="round"/><line x1="0" x2="${Wc}" y1="${sy(0).toFixed(1)}" y2="${sy(0).toFixed(1)}" stroke="rgba(255,255,255,.2)" stroke-dasharray="4 4"/>`);
  }
  function chSeq(seq) {
    const n = seq.length || 1, per = Math.ceil(n / 2), bw = Wc / per;
    return svg(seq.map((v, i) => `<circle cx="${((i % per) * bw + bw / 2).toFixed(1)}" cy="${i < per ? 40 : 90}" r="${Math.min(7, bw * 0.36).toFixed(1)}" fill="${v > 0 ? G : v < 0 ? Rr : 'rgba(255,255,255,.4)'}"/>`).join(''));
  }
  function chStyle() {
    if (!STY) return `<p class="note">${esc(L('Loading the 1-minute candles…', 'Chargement des bougies 1 min…'))}</p>`;
    const N = NOMSTY(), rows = ['trend', 'range', 'vol'].map(k => { const v = STY.res[k]; return { k, n: v.length, net: sum(v), e: avg(v), w: v.filter(x => x > 0).length }; });
    const mx = Math.max(...rows.map(r => Math.abs(r.net)), 1);
    return svg(rows.map((r, i) => { const y = 14 + i * 40, w = Math.abs(r.net) / mx * (Wc - 330);
      return `<text x="0" y="${y + 17}" class="t2">${esc(N[r.k])}</text><text x="118" y="${y + 17}" class="t4l">${r.n} tr · ${r.n ? nf(r.w / r.n * 100, 0) : 0} %</text><rect x="230" y="${y + 3}" width="${Math.max(2, w).toFixed(1)}" height="20" rx="4" fill="${r.net >= 0 ? G : Rr}" opacity=".85"/><text x="${(238 + w).toFixed(0)}" y="${y + 18}" class="t3">${esc(usd(r.net, 2, true))}</text>`; }).join(''), 134);
  }

  /* ---------------- la fenêtre « Indicateurs » ---------------- */
  let LIST = [];
  function meta() { return L('the tier list, live', 'la tier list, en direct'); }
  function render() {
    const box = $('#indBody'); if (!box || !X.M) return;
    LIST = calc();
    const I = LIST.find(x => x.id === sel) || LIST[0];
    const T = X.M.trades.length;
    box.innerHTML = `<div class="ind-top">
        <div class="ind-tier t-${I.tier}">${I.tier}</div>
        <div><div class="ind-n">${esc(I.n)}</div><div class="ind-big ${I.c}">${esc(I.v)}</div><div class="ind-s">${esc(I.s)}</div></div>
      </div>
      <p class="ind-x">${esc(I.x)}</p>
      <div class="ind-ch">${I.ch()}</div>
      <div class="ind-l">${['S', 'A', 'B', 'C', 'D'].map(t => `<div class="ind-row"><span class="ind-t t-${t}">${t}</span><div class="ind-chips">${LIST.filter(x => x.tier === t).map(x => `<button type="button" class="ind-chip${x.id === sel ? ' on' : ''}" data-ind="${x.id}"><span>${esc(x.n)}</span><b class="${x.c}">${esc(x.v)}</b></button>`).join('')}</div></div>`).join('')}</div>
      <p class="note ind-note">${esc(L(`On your ${T} logged trades since Oct 28. Sharpe and VaR use the P&L of each trading day. The planets orbit the black hole: the closer, the more the metric matters (tier S near the horizon). Theoretical risk reward left out: the planned stops and targets are not in the data.`, `Sur tes ${T} trades enregistrés depuis le 28/10. Sharpe et VaR utilisent le P&L de chaque jour de trading. Les planètes tournent autour du trou noir : plus elles sont proches, plus l’indicateur compte (tier S près de l’horizon). Risk reward théorique laissé de côté : les stops et TP prévus ne sont pas dans les données.`))}</p>`;
    box.querySelectorAll('[data-ind]').forEach(b => b.addEventListener('click', () => choisir(b.dataset.ind)));
    planetes();
  }
  function choisir(id) {
    sel = id; render();
    if (window.ESP && ESP.actif && ESP.station !== 'ind') X.go('ind');
  }

  /* ---------------- les planètes ---------------- */
  let PL = [], couche = null;
  function planetes() {
    const esp = document.getElementById('espace'); if (!esp || !window.ESP || !ESP.actif) return;
    if (!couche) { couche = document.createElement('div'); couche.className = 'orbite'; esp.appendChild(couche); ESP.surFrame(cadre); }
    const parTier = {}; LIST.forEach(x => { (parTier[x.tier] = parTier[x.tier] || []).push(x); });
    couche.innerHTML = LIST.map(x => `<button type="button" class="planete t-${x.tier}${x.id === sel ? ' on' : ''}" data-pl="${x.id}" tabindex="-1"><i class="sph"></i><span class="pl-t"><em>${x.tier}</em>${esc(x.n)}</span><b class="pl-v ${x.c}">${esc(x.v)}</b></button>`).join('');
    PL = LIST.map(x => { const k = parTier[x.tier].indexOf(x), n = parTier[x.tier].length; return { id: x.id, el: couche.querySelector(`[data-pl="${x.id}"]`), r: TIERS[x.tier].r, ph: k / n * Math.PI * 2 + { S: 0.3, A: 1.1, B: 2.2, C: 0.6, D: 3.5 }[x.tier], tier: x.tier }; });
    PL.forEach(p => { p.el.addEventListener('click', () => choisir(p.id)); p.el.addEventListener('pointerenter', () => { p.hov = 1; }); p.el.addEventListener('pointerleave', () => { p.hov = 0; }); });
  }
  let vis = 0, tO = 0;
  const INC = 0.42, ROT = 0.5;   // le plan des orbites, penché par rapport au disque
  function posPl(p) {
    const a = p.ph + tO * 1.5 * Math.pow(p.r, -1.5);
    const x = p.r * Math.cos(a), z = p.r * Math.sin(a);
    const y1 = -z * Math.sin(INC), z1 = z * Math.cos(INC);
    return [x * Math.cos(ROT) + z1 * Math.sin(ROT), y1, -x * Math.sin(ROT) + z1 * Math.cos(ROT)];
  }
  function cadre(B, dt) {
    if (!couche) return;
    const cible = ESP.station === 'ind' ? (ESP.vol ? 0.35 : 1) : 0;
    vis += (cible - vis) * (1 - Math.exp(-dt * 3));
    couche.style.opacity = vis.toFixed(3);
    couche.style.visibility = vis < 0.02 ? 'hidden' : 'visible';
    if (vis < 0.02) return;
    if (!PL.some(p => p.hov)) tO += dt;
    const kRef = B.F / 24;
    PL.forEach(p => {
      const P = ESP.projeter(B, posPl(p));
      if (!P) { p.el.style.opacity = 0; return; }
      const s = Math.max(0.45, Math.min(1.5, P.k / kRef));
      p.el.style.transform = `translate(${P.x.toFixed(1)}px,${P.y.toFixed(1)}px) scale(${s.toFixed(3)})`;
      p.el.style.opacity = P.cache ? 0.06 : 1;
      p.el.style.zIndex = String(1000 - Math.round(P.z * 10));
    });
    // les orbites, dessinées sur la toile du vent
    const c = document.getElementById('vitesse'); if (!c) return;
    const g = c.getContext('2d'), k = c.width / innerWidth;
    g.save(); g.globalCompositeOperation = 'lighter';
    Object.entries(TIERS).forEach(([t, o]) => {
      g.beginPath(); let first = true;
      for (let i = 0; i <= 96; i++) {
        const a = i / 96 * Math.PI * 2, x = o.r * Math.cos(a), z = o.r * Math.sin(a), y1 = -z * Math.sin(INC), z1 = z * Math.cos(INC);
        const P = ESP.projeter(B, [x * Math.cos(ROT) + z1 * Math.sin(ROT), y1, -x * Math.sin(ROT) + z1 * Math.cos(ROT)]);
        if (!P || P.cache) { first = true; continue; }
        if (first) { g.moveTo(P.x * k, P.y * k); first = false; } else g.lineTo(P.x * k, P.y * k);
      }
      g.strokeStyle = o.c; g.globalAlpha = 0.28 * vis; g.lineWidth = 1.3 * k; g.setLineDash([3 * k, 6 * k]); g.stroke();
    });
    g.restore();
  }

  // le style de marché attend les bougies 1 min (chargées par app.js)
  function bougies() {
    const p = X.loadBars ? X.loadBars() : null;
    if (p && p.then) p.then(() => { STY = styles(X.BARS); render(); }).catch(() => {});
  }
  const att = setInterval(() => { if (X.M) { clearInterval(att); bougies(); } }, 200);
  window.R5I = { render, meta, choisir, get styles() { return STY; } };
})();
