/* Road to 5 Live: statistics (filters + 5 tabs), account rules and payouts, weekly market watch.
   Needs app.js (window.R5). All numbers are computed here from data/*.json. */
(() => {
  'use strict';
  const X = window.R5; if (!X) return;
  const { $, $$, esc } = X;
  const MINUS = '−';

  /* ---------- words ---------- */
  const W = {
    en: {
      tabs: [['perf', 'PERF'], ['exec', 'EXEC'], ['time', 'TIMING'], ['mind', 'MIND'], ['rules', 'RULES']],
      acct: 'ACCOUNT', all: 'ALL', period: 'PERIOD', sess: 'SESSION', mode: 'P&L',
      net: 'NET', gross: 'GROSS', allTime: 'All time', month: 'Month', week: 'Week of', day: 'Day',
      sessS: { all: 'ALL', asia: 'ASIA', london: 'LDN', ny: 'NY' }, sessL: { asia: 'Asia', london: 'London', ny: 'New York' },
      none: 'No trade in this selection.', scopeAll: 'All accounts: a trade copied on several accounts counts once, its dollars are added up.',
      // perf
      kpis: 'KEY NUMBERS', wrS: 'WIN %', pnl: 'P&L', trades: 'Trades', wr: 'Win rate', pf: 'Profit factor', exp: 'Expectancy per trade', rUnit: 'R (average loss)',
      payoff: 'Avg win / avg loss', aw: 'Average win', al: 'Average loss', best: 'Best trade', worst: 'Worst trade', mdd: 'Max drawdown',
      wStreak: 'Longest winning streak', lStreak: 'Longest losing streak', curStreak: 'Current streak', fees: 'Fees',
      curve: 'P&L CURVE AND P&L PER TRADE', inR: 'RESULTS IN R', inRNote: r => `Trades per half R. 1 R = your average loss (${r}).`,
      split: 'LONG VS SHORT, MICRO VS MINI', daily: 'DAY BY DAY', peak: 'Peak', given: 'Given back', after: 'After peak',
      wday: 'BY WEEKDAY', wdays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'], byWeek: 'BY WEEK', byMonth: 'BY MONTH',
      classes: 'RESULT CLASSES', classNote: r => `Per micro: break-even within ±$${r.be_usd}, small loss down to −$${r.stop_min_usd}, stop between −$${r.stop_min_usd} and −$${r.stop_max_usd}, big loss beyond.`,
      cls: { win: 'Win', be: 'Break-even', small_loss: 'Small loss', stop: 'Stop', big_loss: 'Big loss' },
      long: 'LONG', short: 'SHORT', micro: 'MNQ (micro)', mini: 'NQ (mini)', avg: 'Avg', n: 'N', date: 'DATE',
      // exec
      maeAvg: 'Average MAE', mfeAvg: 'Average MFE', mae1: 'against you before the exit', mfe1: 'in your favour at best', capture: 'Average capture', capture1: 'P&L ÷ MFE of winners',
      etd: 'MFE not captured', etd1: 'what the market offered past your exits', hold: 'Average hold', holdW: 'winners', holdL: 'losers',
      maeMfe: 'MAE VS MFE (POINTS)', maeMfeNote: 'Each dot is a trade: how far it went against you (left) and for you (up).',
      keep: 'WHAT YOU KEEP FROM EACH WINNER', keepNote: 'Share of the best open profit you kept at the exit.',
      holdPnl: 'HOLD TIME VS P&L', holdPnlNote: 'Log scale, from 1 second to 1 hour.', byHold: 'BY HOLD TIME',
      dur: { d1: '< 30 s', d2: '30 s – 2 min', d3: '2 – 5 min', d4: '5 – 15 min', d5: '> 15 min' },
      // timing
      bySess: 'BY SESSION', sessChart: 'THE SESSION AND YOUR TRADES', sessChartNote: 'Session VWAP with its 1σ and 2σ bands, Asia levels, your entries (▲ long, ▼ short) and exits. Tap a trade to open it.',
      byHour: 'P&L BY ENTRY HOUR (PARIS)', byHourNote: 'Number above the bar: trades. Colour under the bar: session.',
      vsVwap: 'YOUR ENTRIES VS THE VWAP', vsVwapNote: 'Distance to the session VWAP at entry, in standard deviations.',
      byBand: 'BY POSITION VS VWAP', inZone: (a, b) => `In your zone (−2σ to −1σ for a long, +1σ to +2σ for a short): ${a} of ${b} trades.`,
      band: { m3: 'below −2σ', m2: '−2σ to −1σ', m1: '−1σ to VWAP', p1: 'VWAP to +1σ', p2: '+1σ to +2σ', p3: 'above +2σ', na: 'no VWAP' },
      zoneIn: 'In the zone', zoneOut: 'Outside', nearAsia: 'NEAR AN ASIA LEVEL', nearAsiaNote: pts => `London and New York entries within ${pts} points of an Asian session level.`,
      lvl: { hi: 'Asia high', lo: 'Asia low', poc: 'Asia POC', vah: 'Asia VAH', val: 'Asia VAL', none: 'Away from the levels', na: 'No level' },
      // mind
      scoreVs: 'YOUR SCORE VS YOUR P&L, BY SESSION', scoreVsNote: 'Bars: session P&L. Squares: your discipline score out of 10.',
      sessDetail: 'SESSIONS IN DETAIL', score: 'Score', worstMae: 'Worst MAE', risky: 'Risky',
      dayFlow: 'YOUR DAY, TRADE AFTER TRADE', dayFlowTxt: (pk, at, gb, n) => `Peak ${pk} at trade ${at}, then ${gb} given back over the next ${n} trade${n > 1 ? 's' : ''}.`, dayFlowTop: pk => `Closed at the day high (${pk}).`,
      byRank: 'P&L BY THE TRADE’S RANK IN THE DAY', byRankNote: 'Do the last trades of the day cost more than they bring?',
      riskyT: 'RISKY TRADES', riskyNote: r => `A trade is risky when it went $${r.risky_mae_usd} or more against you, used NQ size, lost beyond the stop, or came less than ${r.revenge_min} min after a loss.`,
      flags: { size: 'NQ size', mae: `big excursion`, stop: 'loss beyond stop', revenge: 'quick re-entry after a loss' },
      afterWL: 'AFTER A WIN, AFTER A LOSS', prev: { first: 'First of the day', win: 'After a win', loss: 'After a loss', be: 'After a break-even' },
      afterLL: 'AFTER LOSSES IN A ROW', afterLLNote: 'The next trade of the same day, after 2 or 3 losses in a row.', afterN: n => `After ${n} losses in a row`,
      noScore: 'No score yet.',
      // rules
      status: 'ACCOUNT', balance: 'Balance', hwm: 'Highest close', profit: 'Profit', of: 'of', floorL: 'MLL floor',
      floorNote: (ml, lock, trig) => `trails the highest close by ${ml}, locks at ${lock} once a close tops ${trig}`,
      cushNow: 'Cushion now', cushWorst: 'Worst cushion', cushWorst1: 'lowest point, open P&L included', daysT: 'Days traded',
      toMake: 'Still to make', pace: d => `≈ ${d} days at this pace`, target: 'TARGET', perDay: 'Average per day', bestDay: 'Best day',
      rules: 'EVALUATION RULES', rTarget: t => `Profit target +${t}`, rMll: m => `Max loss ${m}, end-of-day trailing`, rSize: (a, b) => `Max size ${a} minis / ${b} micros`,
      rFlat: f => `Flat by ${f} ET`, rMicro: (s, p) => `Microscalping: profit from trades of ${s} s or less, max ${p}`,
      largest: 'largest', latest: 'latest exit', worstC: 'worst cushion',
      payouts: 'PAYOUTS (ONCE FUNDED)', buffer: 'Balance to keep', above: 'Above it today', reqMin: 'Min request', reqMax: 'Max request', reqMax1: 'first payout, then each of the next ones', request: 'Request', reqTxt: (a, b, c) => `min ${a}, max ${b} for the first payout, then ${c}`,
      cycle: 'Min profit per cycle', split: 'Split', delay: 'Paid within', bdays: n => `${n} business days`, methods: 'crypto (BTC, ETH, LTC, USDT, USDC) or WorkMarket',
      consist: 'PAYOUT CONSISTENCY', consistTxt: (s, l) => `Best day: ${s} of the profit. Limit once funded: ${l}. It does not count during the evaluation.`,
      notStarted: n => `Account #${n} has not started yet. It starts when I buy its evaluation.`, openStats: n => `Open the stats of account #${n}`,
      accStats: 'THIS ACCOUNT', stage: { eval: 'Evaluation', funded: 'Funded', payout: 'Funded, paid out', live: 'Live', none: 'Not started' },
      // watch
      wMeta: w => `week of ${w}`, wMetaNone: 'first one on Monday', wNone: d => `The first weekly watch comes out on Monday, ${d}.`,
      wHow: 'HOW IT WORKS', wHowTxt: 'Every Monday I read what banks, hedge funds and sentiment surveys say about US stocks for the week, plus the events that can move the Nasdaq. Each source gets a score from −2 (very bearish) to +2 (very bullish). The gauge is the weighted average, from −100 to +100.',
      wWeights: 'Weights: banks 30%, hedge funds and positioning 25%, sentiment surveys 15%, events of the week 15%, Nasdaq context 15%.',
      wPublic: 'Public sources only, summed up in my own words. Not financial advice.',
      bear: 'BEARISH', neutral: 'NEUTRAL', bull: 'BULLISH', cats: { banks: 'BANKS', funds: 'HEDGE FUNDS AND POSITIONING', surveys: 'SENTIMENT SURVEYS', events: 'EVENTS OF THE WEEK', nq: 'NASDAQ CONTEXT' },
      tags: { '-2': 'BEAR+', '-1': 'BEAR', '0': 'NEUTRAL', '1': 'BULL', '2': 'BULL+' }, events: 'CALENDAR (PARIS TIME)', history: 'PAST WEEKS', nqWeek: 'NQ week', right: 'Right?',
      published: d => `Published ${d}`, imp: ['', 'low', 'medium', 'high'], open: 'Read'
    },
    fr: {
      tabs: [['perf', 'PERF'], ['exec', 'EXÉC.'], ['time', 'TIMING'], ['mind', 'MENTAL'], ['rules', 'RÈGLES']],
      acct: 'COMPTE', all: 'TOUS', period: 'PÉRIODE', sess: 'SESSION', mode: 'P&L',
      net: 'NET', gross: 'BRUT', allTime: 'Depuis le début', month: 'Mois', week: 'Semaine du', day: 'Jour',
      sessS: { all: 'TOUTES', asia: 'ASIE', london: 'LDN', ny: 'NY' }, sessL: { asia: 'Asie', london: 'Londres', ny: 'New York' },
      none: 'Aucun trade dans cette sélection.', scopeAll: 'Tous les comptes : un trade copié sur plusieurs comptes compte une fois, ses dollars sont additionnés.',
      kpis: 'CHIFFRES CLÉS', wrS: 'RÉUSS.', pnl: 'P&L', trades: 'Trades', wr: 'Taux de réussite', pf: 'Profit factor', exp: 'Espérance par trade', rUnit: 'R (perte moyenne)',
      payoff: 'Gain moyen / perte moyenne', aw: 'Gain moyen', al: 'Perte moyenne', best: 'Meilleur trade', worst: 'Pire trade', mdd: 'Drawdown max',
      wStreak: 'Plus longue série gagnante', lStreak: 'Plus longue série perdante', curStreak: 'Série en cours', fees: 'Frais',
      curve: 'COURBE DE P&L ET P&L PAR TRADE', inR: 'RÉSULTATS EN R', inRNote: r => `Trades par demi-R. 1 R = ta perte moyenne (${r}).`,
      split: 'LONG OU SHORT, MICRO OU MINI', daily: 'JOUR PAR JOUR', peak: 'Pic', given: 'Rendu', after: 'Après le pic',
      wday: 'PAR JOUR DE LA SEMAINE', wdays: ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'], byWeek: 'PAR SEMAINE', byMonth: 'PAR MOIS',
      classes: 'CLASSES DE RÉSULTAT', classNote: r => `Par micro : point mort entre −${r.be_usd} $ et +${r.be_usd} $, petite perte jusqu’à −${r.stop_min_usd} $, stop entre −${r.stop_min_usd} $ et −${r.stop_max_usd} $, grosse perte au-delà.`,
      cls: { win: 'Gain', be: 'Point mort', small_loss: 'Petite perte', stop: 'Stop', big_loss: 'Grosse perte' },
      long: 'LONG', short: 'SHORT', micro: 'MNQ (micro)', mini: 'NQ (mini)', avg: 'Moy.', n: 'N', date: 'DATE',
      maeAvg: 'MAE moyenne', mfeAvg: 'MFE moyenne', mae1: 'contre toi avant la sortie', mfe1: 'en ta faveur au mieux', capture: 'Capture moyenne', capture1: 'P&L ÷ MFE des gagnants',
      etd: 'MFE non capturée', etd1: 'ce que le marché offrait après tes sorties', hold: 'Durée moyenne', holdW: 'gagnants', holdL: 'perdants',
      maeMfe: 'MAE ET MFE (POINTS)', maeMfeNote: 'Chaque point est un trade : jusqu’où il est allé contre toi (à gauche) et pour toi (en haut).',
      keep: 'CE QUE TU GARDES DE CHAQUE GAGNANT', keepNote: 'Part du meilleur gain latent gardée à la sortie.',
      holdPnl: 'DURÉE ET P&L', holdPnlNote: 'Échelle logarithmique, de 1 seconde à 1 heure.', byHold: 'PAR DURÉE DE TRADE',
      dur: { d1: '< 30 s', d2: '30 s – 2 min', d3: '2 – 5 min', d4: '5 – 15 min', d5: '> 15 min' },
      bySess: 'PAR SESSION', sessChart: 'LA SÉANCE ET TES TRADES', sessChartNote: 'VWAP de séance avec ses bandes 1σ et 2σ, niveaux de l’Asie, tes entrées (▲ long, ▼ short) et tes sorties. Touche un trade pour l’ouvrir.',
      byHour: 'P&L PAR HEURE D’ENTRÉE (PARIS)', byHourNote: 'Chiffre au-dessus de la barre : nombre de trades. Couleur dessous : la session.',
      vsVwap: 'TES ENTRÉES FACE AU VWAP', vsVwapNote: 'Écart au VWAP de séance à l’entrée, en écarts-types.',
      byBand: 'PAR POSITION FACE AU VWAP', inZone: (a, b) => `Dans ta zone (−2σ à −1σ pour un long, +1σ à +2σ pour un short) : ${a} trades sur ${b}.`,
      band: { m3: 'sous −2σ', m2: '−2σ à −1σ', m1: '−1σ au VWAP', p1: 'VWAP à +1σ', p2: '+1σ à +2σ', p3: 'au-dessus de +2σ', na: 'pas de VWAP' },
      zoneIn: 'Dans la zone', zoneOut: 'Hors zone', nearAsia: 'PRÈS D’UN NIVEAU ASIE', nearAsiaNote: pts => `Entrées de Londres et de New York à moins de ${pts} points d’un niveau de la session asiatique.`,
      lvl: { hi: 'Haut Asie', lo: 'Bas Asie', poc: 'POC Asie', vah: 'VAH Asie', val: 'VAL Asie', none: 'Loin des niveaux', na: 'Pas de niveau' },
      scoreVs: 'TA NOTE ET TON P&L, PAR SESSION', scoreVsNote: 'Barres : P&L de la session. Carrés : ta note de discipline sur 10.',
      sessDetail: 'SESSIONS EN DÉTAIL', score: 'Note', worstMae: 'Pire MAE', risky: 'À risque',
      dayFlow: 'TA JOURNÉE, TRADE APRÈS TRADE', dayFlowTxt: (pk, at, gb, n) => `Pic à ${pk} au trade ${at}, puis ${gb} rendus sur les ${n} trade${n > 1 ? 's' : ''} suivant${n > 1 ? 's' : ''}.`, dayFlowTop: pk => `Clôture au plus haut de la journée (${pk}).`,
      byRank: 'P&L SELON LE RANG DU TRADE DANS LA JOURNÉE', byRankNote: 'Les derniers trades de la journée coûtent-ils plus qu’ils ne rapportent ?',
      riskyT: 'TRADES À RISQUE', riskyNote: r => `Un trade est à risque s’il est allé ${r.risky_mae_usd} $ ou plus contre toi, en taille NQ, avec une perte au-delà du stop, ou moins de ${r.revenge_min} min après une perte.`,
      flags: { size: 'taille NQ', mae: 'grosse excursion', stop: 'perte au-delà du stop', revenge: 'réentrée rapide après une perte' },
      afterWL: 'APRÈS UN GAIN, APRÈS UNE PERTE', prev: { first: '1er de la journée', win: 'Après un gain', loss: 'Après une perte', be: 'Après un point mort' },
      afterLL: 'APRÈS DES PERTES D’AFFILÉE', afterLLNote: 'Le trade suivant, dans la même journée, après 2 ou 3 pertes d’affilée.', afterN: n => `Après ${n} pertes d’affilée`,
      noScore: 'Pas encore de note.',
      status: 'COMPTE', balance: 'Solde', hwm: 'Plus haute clôture', profit: 'Profit', of: 'sur', floorL: 'Plancher MLL',
      floorNote: (ml, lock, trig) => `suit la plus haute clôture à ${ml}, se bloque à ${lock} dès qu’une clôture dépasse ${trig}`,
      cushNow: 'Marge actuelle', cushWorst: 'Pire marge', cushWorst1: 'point le plus bas, latent compris', daysT: 'Jours tradés',
      toMake: 'Reste à faire', pace: d => `≈ ${d} jours à ce rythme`, target: 'OBJECTIF', perDay: 'Moyenne par jour', bestDay: 'Meilleur jour',
      rules: 'RÈGLES DE L’ÉVALUATION', rTarget: t => `Objectif de profit +${t}`, rMll: m => `Perte max ${m}, trailing de fin de journée`, rSize: (a, b) => `Taille max ${a} minis / ${b} micros`,
      rFlat: f => `À plat avant ${f} ET`, rMicro: (s, p) => `Microscalping : profit des trades de ${s} s ou moins, max ${p}`,
      largest: 'plus grosse', latest: 'dernière sortie', worstC: 'pire marge',
      payouts: 'PAYOUTS (UNE FOIS FUNDED)', buffer: 'Solde à garder', above: 'Au-dessus aujourd’hui', reqMin: 'Demande min', reqMax: 'Demande max', reqMax1: 'premier payout, puis chacun des suivants', request: 'Demande', reqTxt: (a, b, c) => `min ${a}, max ${b} pour le premier payout, puis ${c}`,
      cycle: 'Profit min par cycle', split: 'Partage', delay: 'Payé sous', bdays: n => `${n} jours ouvrés`, methods: 'crypto (BTC, ETH, LTC, USDT, USDC) ou WorkMarket',
      consist: 'CONSISTANCE DES PAYOUTS', consistTxt: (s, l) => `Meilleur jour : ${s} du profit. Limite une fois funded : ${l}. Elle ne compte pas pendant l’évaluation.`,
      notStarted: n => `Le compte #${n} n’a pas encore commencé. Il démarre quand j’achète son évaluation.`, openStats: n => `Voir les stats du compte #${n}`,
      accStats: 'CE COMPTE', stage: { eval: 'Évaluation', funded: 'Funded', payout: 'Funded, payout reçu', live: 'Live', none: 'Pas commencé' },
      wMeta: w => `semaine du ${w}`, wMetaNone: 'première lundi', wNone: d => `La première veille sort le lundi ${d}.`,
      wHow: 'COMMENT ÇA MARCHE', wHowTxt: 'Chaque lundi, je lis ce que disent les banques, les hedge funds et les sondages de sentiment sur les actions US pour la semaine, et les annonces qui peuvent faire bouger le Nasdaq. Chaque source reçoit une note de −2 (très bearish) à +2 (très bullish). La jauge est la moyenne pondérée, de −100 à +100.',
      wWeights: 'Poids : banques 30 %, hedge funds et positionnement 25 %, sondages 15 %, annonces de la semaine 15 %, contexte du Nasdaq 15 %.',
      wPublic: 'Sources publiques uniquement, résumées avec mes mots. Ceci n’est pas un conseil financier.',
      bear: 'BEARISH', neutral: 'NEUTRE', bull: 'BULLISH', cats: { banks: 'BANQUES', funds: 'HEDGE FUNDS ET POSITIONNEMENT', surveys: 'SONDAGES DE SENTIMENT', events: 'ANNONCES DE LA SEMAINE', nq: 'CONTEXTE DU NASDAQ' },
      tags: { '-2': 'BEAR+', '-1': 'BEAR', '0': 'NEUTRE', '1': 'BULL', '2': 'BULL+' }, events: 'CALENDRIER (HEURE DE PARIS)', history: 'SEMAINES PASSÉES', nqWeek: 'NQ semaine', right: 'Juste ?',
      published: d => `Publiée ${d}`, imp: ['', 'faible', 'moyen', 'fort'], open: 'Lire'
    }
  };
  const w = () => W[X.LANG];

  /* ---------- state, scope ---------- */
  const S = { tab: 'perf', acct: 'all', period: 'all', sess: 'all', mode: 'net', day: null };
  const sum = a => a.reduce((s, x) => s + x, 0);
  const avg = a => (a.length ? sum(a) / a.length : null);
  const acctOf = t => t.account || 1;
  const P = t => (S.mode === 'gross' ? t.pnl_gross : t.pnl_net);
  const byTime = (a, b) => (a.entry_time < b.entry_time ? -1 : 1);
  const monday = d => { const x = X.ymd(d), k = (x.getUTCDay() + 6) % 7; x.setUTCDate(x.getUTCDate() - k); return x.toISOString().slice(0, 10); };
  const loc = () => (X.LANG === 'fr' ? 'fr-FR' : 'en-US');
  const fmtDate = (d, o) => new Intl.DateTimeFormat(loc(), Object.assign({ timeZone: 'UTC' }, o)).format(X.ymd(d));
  const monthLabel = m => fmtDate(m + '-01', { month: 'long', year: 'numeric' });
  const shortDay = d => fmtDate(d, { day: 'numeric', month: 'short' });
  const nf = (v, d = 2) => (v == null || !isFinite(v) ? '—' : X.nf(v, d));
  const sg = (v, d = 2) => (v == null || !isFinite(v) ? '—' : X.sg(v, d));
  const pc = (v, d = 0) => (v == null || !isFinite(v) ? '—' : X.nf(v * 100, d) + (X.LANG === 'fr' ? ' %' : '%'));
  const cl = v => X.cls(v || 0);
  const blocks = (v, mx, n = 14) => '█'.repeat(v ? Math.max(1, Math.round(Math.abs(v) / (mx || 1) * n)) : 0);

  // one row per trade; on "all accounts", copies of the same trade (same copy_id) count once and their dollars add up
  function aggregate(ts) {
    const g = new Map();
    ts.forEach(t => {
      const k = t.copy_id != null ? 'c' + t.copy_id : 't' + t.id + ':' + acctOf(t);
      const o = g.get(k);
      if (!o) g.set(k, Object.assign({}, t, { n_acct: 1 }));
      else ['pnl_net', 'pnl_gross', 'fees', 'mae_usd', 'mfe_usd', 'etd_usd'].forEach(f => { o[f] = +((o[f] || 0) + (t[f] || 0)).toFixed(2); }), o.n_acct++;
    });
    return [...g.values()];
  }
  function scoped(o = {}) {
    let ts = X.M.trades;
    ts = S.acct === 'all' ? aggregate(ts) : ts.filter(t => acctOf(t) === +S.acct);
    if (!o.noPeriod && S.period !== 'all') {
      const [k, v] = [S.period.slice(0, 1), S.period.slice(2)];
      ts = ts.filter(t => (k === 'm' ? t.session_date.slice(0, 7) === v : k === 'w' ? monday(t.session_date) === v : t.session_date === v));
    }
    if (!o.noSess && S.sess !== 'all') ts = ts.filter(t => t.session === S.sess);
    return ts.slice().sort(byTime);
  }

  /* ---------- small UI kit ---------- */
  const kv = (l, v, c = '') => `<div class="st"><span>${l}</span><span class="dots"></span><span class="${c}">${v}</span></div>`;
  const sub = (txt, note) => `<div class="sub">${txt}</div>${note ? `<p class="hint">${note}</p>` : ''}`;
  // cols: [label, css width, right-aligned]; rows: arrays of html cells; row.go = trade id to open
  function table(cols, rows, min = 0) {
    const tpl = cols.map(c => c[1] || '1fr').join(' ');
    const head = `<div class="tr th" style="grid-template-columns:${tpl}">${cols.map(c => `<span class="${c[2] ? 'x' : ''}">${c[0]}</span>`).join('')}</div>`;
    const body = rows.map(r => `<div class="tr${r.go ? ' t' : ''}"${r.go ? ` role="button" tabindex="0" data-open="${r.go}"` : ''} style="grid-template-columns:${tpl}">${r.map((c, j) => `<span class="${cols[j][2] ? 'x' : ''}">${c}</span>`).join('')}</div>`).join('');
    return `<div class="tw"><div class="tbl" style="min-width:${min}px">${head}<div class="blk">${body}</div></div></div>`;
  }
  const group = (ts, f) => { const g = {}; ts.forEach(t => { const k = f(t); (g[k] = g[k] || []).push(t); }); return g; };
  const stat = list => { const p = list.map(P), wn = p.filter(x => x > 0), ls = p.filter(x => x < 0); return { n: list.length, w: wn.length, wr: list.length ? wn.length / list.length : null, pnl: sum(p), avg: avg(p), pf: ls.length ? sum(wn) / -sum(ls) : null }; };
  function groupTable(ts, keyFn, order, label, extra) {
    const g = group(ts, keyFn), keys = (order || Object.keys(g).sort()).filter(k => g[k]);
    const mx = Math.max(1, ...keys.map(k => Math.abs(stat(g[k]).pnl)));
    const rows = keys.map(k => { const s = stat(g[k]); return [label(k), String(s.n), pc(s.wr), `<span class="${cl(s.pnl)}">${sg(s.pnl)}</span>`, `<span class="${cl(s.avg)}">${sg(s.avg)}</span>`, `<span class="g ${cl(s.pnl)}">${blocks(s.pnl, mx, 10)}</span>`].concat(extra ? extra(g[k]) : []); });
    return table([['', '1.3fr'], [w().n, '34px', 1], [w().wrS, '58px', 1], [w().pnl, '76px', 1], [w().avg.toUpperCase(), '66px', 1], ['', '1fr']], rows, 420);
  }

  /* ---------- charts (SVG strings drawn at the real width) ---------- */
  const CH = new Map(); let chId = 0;
  const chart = (fn, h) => { const id = 'ch' + (++chId); CH.set(id, { fn, h }); return `<div class="chart sch" data-ch="${id}"></div>`; };
  function drawCharts(root) {
    $$('[data-ch]', root).forEach(el => {
      const c = CH.get(el.dataset.ch); if (!c) return;
      const wd = Math.max(280, Math.round(el.clientWidth || 340)), h = typeof c.h === 'function' ? c.h(wd) : c.h;
      el.innerHTML = c.fn(wd, h);
      const ln = $$('.ln', el); if (X.ANIM && ln.length) { ln.forEach(l => { l.style.transition = 'none'; l.style.setProperty('--off', 1); }); requestAnimationFrame(() => requestAnimationFrame(() => ln.forEach(l => { l.style.transition = ''; l.style.setProperty('--off', 0); }))); }
    });
  }
  const C = { amb: '#FFA41C', up: '#3BD47A', dn: '#FF5149', mute: '#A08D6C', grid: '#2A1B03', txt: '#F3E7CF', asia: '#8C7CFF', london: '#FFA41C', ny: '#2EC5FF' };
  const svg = (wd, h, body, label) => `<svg viewBox="0 0 ${wd} ${h}" role="img" aria-label="${esc(label || '')}">${body}</svg>`;
  const txt = (x, y, s, o = {}) => `<text x="${x}" y="${y}" font-size="${o.fs || 10}" fill="${o.c || C.mute}"${o.a ? ` text-anchor="${o.a}"` : ''}${o.b ? ' font-weight="700"' : ''}>${s}</text>`;
  const ticks = (lo, hi, n = 4) => { const span = hi - lo || 1, raw = span / n, mag = Math.pow(10, Math.floor(Math.log10(raw))), st = [1, 2, 2.5, 5, 10].map(k => k * mag).find(k => span / k <= n + 1) || mag * 10; const out = []; for (let v = Math.ceil(lo / st) * st; v <= hi + 1e-9; v += st) out.push(+v.toFixed(6)); return out; };

  function curveChart(ts) {
    return chart((wd, h) => {
      const pl = 4, pr = 54, top = 10, h1 = Math.round(h * 0.62), gap = 16, h2 = h - h1 - gap - 18;
      let c = 0; const cum = ts.map(t => (c += P(t)));
      const lo = Math.min(0, ...cum), hi = Math.max(0, ...cum), X1 = i => pl + (wd - pl - pr) * (i + 0.5) / ts.length;
      const Y1 = v => top + (h1 - top) * (hi - v) / ((hi - lo) || 1);
      let b = ticks(lo, hi).map(v => `<line x1="${pl}" x2="${wd - pr}" y1="${Y1(v)}" y2="${Y1(v)}" stroke="${C.grid}"/>${txt(wd - pr + 6, Y1(v) + 3.5, nf(v, 0))}`).join('');
      b += `<line x1="${pl}" x2="${wd - pr}" y1="${Y1(0)}" y2="${Y1(0)}" stroke="${C.mute}" stroke-dasharray="1 3"/>`;
      b += `<path class="ln" pathLength="1" d="${cum.map((v, i) => `${i ? 'L' : 'M'}${X1(i).toFixed(1)},${Y1(v).toFixed(1)}`).join('')}" fill="none" stroke="${C.amb}" stroke-width="1.8"/>`;
      const mx = Math.max(1, ...ts.map(t => Math.abs(P(t)))), y0 = h1 + gap + h2 / 2, bw = Math.max(1.5, (wd - pl - pr) / ts.length * 0.62);
      b += `<line x1="${pl}" x2="${wd - pr}" y1="${y0}" y2="${y0}" stroke="${C.grid}"/>`;
      ts.forEach((t, i) => { const v = P(t), hh = Math.abs(v) / mx * h2 / 2; b += `<rect x="${X1(i) - bw / 2}" y="${v >= 0 ? y0 - hh : y0}" width="${bw}" height="${Math.max(1, hh)}" fill="${v >= 0 ? C.up : C.dn}"><title>#${t.id} ${sg(v)}</title></rect>`; });
      b += txt(wd - pr + 6, y0 - h2 / 2 + 8, '+' + nf(mx, 0)) + txt(wd - pr + 6, y0 + h2 / 2, MINUS + nf(mx, 0));
      return svg(wd, h, b, w().curve);
    }, wd => (wd > 700 ? 300 : 230));
  }
  function barsChart(items, o = {}) { // items: [{label, v, n, col}] vertical bars around 0
    return chart((wd, h) => {
      const pl = 4, pr = 4, top = 16, bot = 30, mx = Math.max(1, ...items.map(i => Math.abs(i.v))), hasNeg = items.some(i => i.v < 0);
      const y0 = hasNeg ? top + (h - top - bot) / 2 : h - bot, scale = (hasNeg ? (h - top - bot) / 2 : h - top - bot) / mx, cw = (wd - pl - pr) / items.length, bw = Math.min(42, cw * 0.62);
      let b = `<line x1="${pl}" x2="${wd - pr}" y1="${y0}" y2="${y0}" stroke="${C.grid}"/>`;
      items.forEach((it, i) => {
        const x = pl + cw * i + cw / 2, hh = Math.abs(it.v) * scale;
        b += `<rect x="${x - bw / 2}" y="${it.v >= 0 ? y0 - hh : y0}" width="${bw}" height="${Math.max(1, hh)}" fill="${it.col || (it.v >= 0 ? C.up : C.dn)}"><title>${esc(it.label)} ${o.fmt ? o.fmt(it.v) : sg(it.v)}</title></rect>`;
        if (it.n != null) b += txt(x, (it.v >= 0 ? y0 - hh : y0 + hh + 10) - (it.v >= 0 ? 4 : 0), it.n, { a: 'middle', fs: 9.5, c: C.txt });
        if (it.strip) b += `<rect x="${x - bw / 2}" y="${h - bot + 4}" width="${bw}" height="3" fill="${it.strip}"/>`;
        b += txt(x, h - 8, esc(it.label), { a: 'middle', fs: 9.5 });
      });
      return svg(wd, h, b, o.label);
    }, o.h || 170);
  }
  function scatterChart(pts, o) { // pts: [{x, y, col, id}]; o: {xlo, xhi, ylo, yhi, xlab, ylab, logx, xt, yt}
    return chart((wd, h) => {
      const pl = 4, pr = 50, top = 10, bot = 26;
      const fx = o.logx ? v => Math.log10(Math.max(1, v)) : v => v;
      const xlo = fx(o.xlo), xhi = fx(o.xhi), Xs = v => pl + (wd - pl - pr) * (fx(v) - xlo) / ((xhi - xlo) || 1), Ys = v => top + (h - top - bot) * (o.yhi - v) / ((o.yhi - o.ylo) || 1);
      let b = (o.yt || ticks(o.ylo, o.yhi)).map(v => `<line x1="${pl}" x2="${wd - pr}" y1="${Ys(v)}" y2="${Ys(v)}" stroke="${v === 0 ? '#4a320a' : C.grid}"/>${txt(wd - pr + 6, Ys(v) + 3.5, o.yf ? o.yf(v) : nf(v, 0))}`).join('');
      (o.xt || ticks(o.xlo, o.xhi)).forEach(v => { b += `<line x1="${Xs(v)}" x2="${Xs(v)}" y1="${top}" y2="${h - bot}" stroke="${C.grid}"/>` + txt(Xs(v), h - 9, o.xf ? o.xf(v) : nf(v, 0), { a: 'middle' }); });
      pts.forEach(p => { b += `<circle cx="${Xs(p.x).toFixed(1)}" cy="${Ys(p.y).toFixed(1)}" r="3.4" fill="${p.col}" fill-opacity=".85" data-open="${p.id}" style="cursor:pointer"><title>#${p.id}</title></circle>`; });
      if (o.xlab) b += txt(pl + 2, h - bot - 4, o.xlab, { fs: 9 });
      if (o.ylab) b += txt(pl + 2, top + 9, o.ylab, { fs: 9 });
      return svg(wd, h, b, o.label);
    }, wd => (wd > 700 ? 300 : 240));
  }

  /* ---------- PERF ---------- */
  function perf(ts) {
    const R = X.M.R, p = ts.map(P), n = p.length, wn = p.filter(x => x > 0), ls = p.filter(x => x < 0);
    const allLoss = scoped({ noPeriod: true, noSess: true }).map(P).filter(x => x < 0), rUnit = allLoss.length ? -avg(allLoss) : null;
    let c = 0, pk = 0, dd = 0, ws = 0, lsk = 0, bw = 0, bl = 0; p.forEach(x => { c += x; pk = Math.max(pk, c); dd = Math.max(dd, pk - c); ws = x > 0 ? ws + 1 : 0; lsk = x < 0 ? lsk + 1 : 0; bw = Math.max(bw, ws); bl = Math.max(bl, lsk); });
    const cur = ws ? `${ws} ${X.LANG === 'fr' ? 'gagnant' + (ws > 1 ? 's' : '') : 'win' + (ws > 1 ? 's' : '')}` : lsk ? `${lsk} ${X.LANG === 'fr' ? 'perdant' + (lsk > 1 ? 's' : '') : 'loss' + (lsk > 1 ? 'es' : '')}` : '—';
    const exp = avg(p), best = ts.reduce((a, t) => (!a || P(t) > P(a) ? t : a), null), worst = ts.reduce((a, t) => (!a || P(t) < P(a) ? t : a), null);
    let h = sub(w().kpis) + `<div class="blk">` + [
      kv(w().pnl + ` (${S.mode === 'gross' ? w().gross : w().net})`, `<b class="${cl(sum(p))}">${sg(sum(p))}</b>`),
      kv(w().trades, `${n}  <span class="mu">${wn.length} / ${ls.length}</span>`), kv(w().wr, pc(n ? wn.length / n : null)),
      kv(w().pf, ls.length ? nf(sum(wn) / -sum(ls)) : '—'), kv(w().exp, `<span class="${cl(exp)}">${sg(exp)}</span>${rUnit && exp != null ? `  <span class="mu">${sg(exp / rUnit)}R</span>` : ''}`),
      kv(w().rUnit, rUnit ? nf(rUnit) : '—'), kv(w().payoff, wn.length && ls.length ? nf(avg(wn) / -avg(ls)) : '—'),
      kv(w().aw, `<span class="up">${sg(avg(wn))}</span>`), kv(w().al, `<span class="dn">${sg(avg(ls))}</span>`),
      kv(w().best, best ? `<span class="up">${sg(P(best))}</span>  <span class="mu">#${best.id}</span>` : '—'), kv(w().worst, worst ? `<span class="dn">${sg(P(worst))}</span>  <span class="mu">#${worst.id}</span>` : '—'),
      kv(w().mdd, `<span class="dn">${sg(-dd)}</span>`), kv(w().wStreak, String(bw)), kv(w().lStreak, String(bl)), kv(w().curStreak, cur), kv(w().fees, nf(sum(ts.map(t => t.fees || 0))))
    ].join('') + '</div>';
    h += sub(w().curve) + curveChart(ts);
    if (rUnit) {
      const bk = {}; ts.forEach(t => { const r = Math.max(-3, Math.min(4, Math.floor(P(t) / rUnit / 0.5) * 0.5)); bk[r] = (bk[r] || 0) + 1; });
      const keys = Object.keys(bk).map(Number).sort((a, b) => a - b), items = [];
      for (let r = keys[0]; r <= keys[keys.length - 1]; r += 0.5) items.push({ label: (r > 0 ? '+' : r < 0 ? MINUS : '') + nf(Math.abs(r), 1), v: bk[r] || 0, n: bk[r] || '', col: r >= 0 ? C.up : C.dn });
      h += sub(w().inR, w().inRNote(nf(rUnit))) + barsChart(items, { fmt: v => String(v), label: w().inR });
    }
    h += sub(w().split) + groupTable(ts, t => t.side, ['long', 'short'], k => w()[k]) + groupTable(ts, t => (t.instrument === 'NQ' ? 'mini' : 'micro'), ['micro', 'mini'], k => w()[k]);
    // day by day
    const days = group(ts, t => t.session_date), dk = Object.keys(days).sort().reverse();
    h += sub(w().daily) + table([[w().date, '74px'], [w().n, '34px', 1], ['WIN %', '56px', 1], [w().pnl, '78px', 1], [w().fees.toUpperCase(), '56px', 1], [w().peak.toUpperCase(), '70px', 1], [w().given.toUpperCase(), '70px', 1], [w().after.toUpperCase(), '1fr', 1]],
      dk.map(d => { const l = days[d].sort(byTime), pp = l.map(P); let cc = 0, pkk = 0, at = 0; pp.forEach((x, i) => { cc += x; if (cc > pkk) { pkk = cc; at = i + 1; } }); const s = stat(l);
        return [shortDay(d), String(s.n), pc(s.wr), `<span class="${cl(s.pnl)}">${sg(s.pnl)}</span>`, nf(sum(l.map(t => t.fees || 0))), sg(pkk), `<span class="${pkk - cc > 0 ? 'dn' : ''}">${pkk - cc > 0 ? MINUS + nf(pkk - cc) : nf(0)}</span>`, String(l.length - at)]; }), 560);
    h += sub(w().wday) + groupTable(ts, t => String((X.ymd(t.session_date).getUTCDay() + 6) % 7), ['0', '1', '2', '3', '4', '5', '6'], k => w().wdays[+k]);
    h += sub(w().byWeek) + groupTable(ts, t => monday(t.session_date), Object.keys(group(ts, t => monday(t.session_date))).sort().reverse(), k => shortDay(k));
    h += sub(w().byMonth) + groupTable(ts, t => t.session_date.slice(0, 7), Object.keys(group(ts, t => t.session_date.slice(0, 7))).sort().reverse(), k => monthLabel(k));
    h += sub(w().classes, w().classNote(R)) + groupTable(ts, t => t.result_class || 'be', ['win', 'be', 'small_loss', 'stop', 'big_loss'], k => w().cls[k]);
    return h;
  }

  /* ---------- EXEC ---------- */
  const durKey = t => (t.duration_s < 30 ? 'd1' : t.duration_s < 120 ? 'd2' : t.duration_s < 300 ? 'd3' : t.duration_s < 900 ? 'd4' : 'd5');
  function exec(ts) {
    const wins = ts.filter(t => P(t) > 0), losses = ts.filter(t => P(t) < 0);
    const caps = ts.filter(t => t.pnl_gross > 0 && t.mfe_usd > 0).map(t => Math.min(1, t.pnl_gross / t.mfe_usd));
    const m = v => (v == null ? '—' : nf(v / 60, 1) + ' min');
    let h = sub(w().kpis) + '<div class="blk">' + [
      kv(w().maeAvg, `${nf(avg(ts.map(t => t.mae_pts)))} pts  <span class="mu">${sg(avg(ts.map(t => t.mae_usd)))}</span>`), `<p class="hint">${w().mae1}</p>`,
      kv(w().mfeAvg, `${nf(avg(ts.map(t => t.mfe_pts)))} pts  <span class="mu">${sg(avg(ts.map(t => t.mfe_usd)))}</span>`), `<p class="hint">${w().mfe1}</p>`,
      kv(w().capture, pc(avg(caps))), `<p class="hint">${w().capture1}</p>`,
      kv(w().etd, `<span class="dn">${sg(sum(ts.map(t => t.etd_usd || 0)))}</span>`), `<p class="hint">${w().etd1}</p>`,
      kv(w().hold, m(avg(ts.map(t => t.duration_s)))), kv(w().hold + ', ' + w().holdW, m(avg(wins.map(t => t.duration_s)))), kv(w().hold + ', ' + w().holdL, m(avg(losses.map(t => t.duration_s))))
    ].join('') + '</div>';
    const mx = Math.max(10, ...ts.map(t => Math.max(t.mae_pts || 0, t.mfe_pts || 0)));
    h += sub(w().maeMfe, w().maeMfeNote) + scatterChart(ts.map(t => ({ x: t.mae_pts || 0, y: t.mfe_pts || 0, col: P(t) > 0 ? C.up : P(t) < 0 ? C.dn : C.mute, id: t.id })), { xlo: 0, xhi: mx * 1.05, ylo: 0, yhi: mx * 1.05, xlab: 'MAE', ylab: 'MFE', label: w().maeMfe });
    const kb = [0, 0, 0, 0]; caps.forEach(c => { kb[Math.min(3, Math.floor(c * 4))]++; });
    h += sub(w().keep, w().keepNote) + barsChart(['0–25%', '25–50%', '50–75%', '75–100%'].map((l, i) => ({ label: l, v: kb[i], n: kb[i] || '', col: C.amb })), { fmt: v => String(v), h: 150, label: w().keep });
    const pv = ts.map(P), lim = Math.max(10, ...pv.map(Math.abs));
    h += sub(w().holdPnl, w().holdPnlNote) + scatterChart(ts.map(t => ({ x: Math.max(1, t.duration_s), y: P(t), col: P(t) > 0 ? C.up : P(t) < 0 ? C.dn : C.mute, id: t.id })),
      { xlo: 1, xhi: 3600, ylo: -lim * 1.1, yhi: lim * 1.1, logx: true, xt: [1, 10, 60, 300, 900, 3600], xf: v => (v < 60 ? v + 's' : v / 60 + 'm'), label: w().holdPnl });
    h += sub(w().byHold) + groupTable(ts, durKey, ['d1', 'd2', 'd3', 'd4', 'd5'], k => w().dur[k]);
    return h;
  }

  /* ---------- TIMING ---------- */
  function sessionChart(day, ts) {
    return chart((wd, h) => {
      const bars = (X.BARS || []).filter(b => b.d === day);
      if (bars.length < 10) return `<div class="na">${X.LANG === 'fr' ? 'Chargement des bougies…' : 'Loading the candles…'}</div>`;
      const dd = X.M.days.find(d => d.date === day) || {}, raw = (X.M.rawDays || []).find(d => d.session_date === day) || {};
      const lv = [['hi', raw.asia_hi], ['lo', raw.asia_lo], ['poc', raw.asia_poc], ['vah', raw.asia_vah], ['val', raw.asia_val]].filter(([, v]) => v != null);
      const pl = 2, pr = 58, top = 8, bot = 22, m0 = X.minOf(bars[0].t), m1 = X.minOf(bars[bars.length - 1].t) + 1;
      let lo = Math.min(...bars.map(b => b.l)), hi = Math.max(...bars.map(b => b.h)); const pad = (hi - lo) * 0.06; lo -= pad; hi += pad;
      const Xs = m => pl + (wd - pl - pr) * (m - m0) / (m1 - m0), Ys = v => top + (h - top - bot) * (hi - v) / (hi - lo);
      let b = `<defs><clipPath id="sc${day}"><rect x="${pl}" y="${top}" width="${wd - pl - pr}" height="${h - top - bot}"/></clipPath></defs>`;
      ticks(lo, hi, 4).forEach(v => { b += `<line x1="${pl}" x2="${wd - pr}" y1="${Ys(v)}" y2="${Ys(v)}" stroke="#1d1305"/>${txt(wd - pr + 6, Ys(v) + 3.5, nf(v, 0))}`; });
      bars.forEach(q => { const hh = +q.t.slice(11, 13), mm = +q.t.slice(14, 16); if (mm === 0 && hh % 3 === 0) b += txt(Xs(X.minOf(q.t)), h - 7, q.t.slice(11, 16), { a: 'middle', fs: 9.5 }); });
      const line = (f, col, dash) => { const pts = bars.filter(q => f(q) != null && isFinite(f(q))).map(q => `${Xs(X.minOf(q.t) + 0.5).toFixed(1)},${Ys(f(q)).toFixed(1)}`); return pts.length > 1 ? `<polyline clip-path="url(#sc${day})" points="${pts.join(' ')}" fill="none" stroke="${col}" stroke-width="1"${dash ? ` stroke-dasharray="${dash}"` : ''}/>` : ''; };
      b += line(q => q.vw + 2 * q.sd, '#4a320a', '1 3') + line(q => q.vw - 2 * q.sd, '#4a320a', '1 3') + line(q => q.vw + q.sd, '#6E4608', '3 3') + line(q => q.vw - q.sd, '#6E4608', '3 3');
      let lastY = -99; lv.slice().sort((p, q) => q[1] - p[1]).forEach(([k, v]) => { if (v > lo && v < hi) { const y = Ys(v); b += `<line x1="${pl}" x2="${wd - pr}" y1="${y}" y2="${y}" stroke="${C.asia}" stroke-opacity=".55" stroke-dasharray="2 4"/>`; if (y - lastY > 11) { b += txt(pl + 2, y - 3, w().lvl[k], { fs: 8.5, c: C.asia }); lastY = y; } } });
      b += line(q => q.c, '#CFC3AA') + line(q => q.vw, C.amb);
      ts.filter(t => t.session_date === day).forEach(t => {
        const xe = Xs(X.minOf(t.entry_time)), ye = Ys(t.entry_price), xx = Xs(X.minOf(t.exit_time)), yx = Ys(t.exit_price), col = P(t) > 0 ? C.up : P(t) < 0 ? C.dn : C.mute;
        const tri = t.side === 'long' ? `M${xe - 4.5},${ye + 7}L${xe + 4.5},${ye + 7}L${xe},${ye}Z` : `M${xe - 4.5},${ye - 7}L${xe + 4.5},${ye - 7}L${xe},${ye}Z`;
        b += `<g data-open="${t.id}" style="cursor:pointer"><title>#${t.id} ${sg(P(t))}</title><line x1="${xe}" y1="${ye}" x2="${xx}" y2="${yx}" stroke="${col}" stroke-width="1.2"/><path d="${tri}" fill="${C.txt}"/><rect x="${xx - 3}" y="${yx - 3}" width="6" height="6" fill="${col}"/></g>`;
      });
      return svg(wd, h, b, w().sessChart + ' ' + day);
    }, wd => (wd > 700 ? 340 : 250));
  }
  function timing(ts) {
    const R = X.M.R;
    let h = sub(w().bySess) + groupTable(ts, t => t.session, ['asia', 'london', 'ny'], k => w().sessL[k], null);
    const days = [...new Set(ts.map(t => t.session_date))].sort();
    if (days.length) {
      if (!S.day || !days.includes(S.day)) S.day = days[days.length - 1];
      h += sub(w().sessChart, w().sessChartNote) + `<div class="fl daysel">${days.map(d => `<button type="button" data-sday="${d}" aria-pressed="${S.day === d}">${shortDay(d)}</button>`).join('')}</div>` + sessionChart(S.day, ts);
    }
    const hrs = group(ts, t => t.hour), hk = Object.keys(hrs).map(Number).sort((a, b) => a - b);
    h += sub(w().byHour, w().byHourNote) + barsChart(hk.map(k => { const l = hrs[k], s = sum(l.map(P)), ses = group(l, t => t.session), top = Object.keys(ses).sort((a, b) => ses[b].length - ses[a].length)[0]; return { label: String(k).padStart(2, '0') + 'h', v: s, n: l.length, strip: C[top] }; }), { label: w().byHour });
    const zb = {}; ts.forEach(t => { if (t.vwap_z == null) return; const k = Math.max(-3, Math.min(2.5, Math.floor(t.vwap_z / 0.5) * 0.5)); (zb[k] = zb[k] || { n: 0, p: 0 }); zb[k].n++; zb[k].p += P(t); });
    const zk = []; for (let k = -3; k <= 2.5; k += 0.5) zk.push(k);
    h += sub(w().vsVwap, w().vsVwapNote) + barsChart(zk.map(k => ({ label: (k > 0 ? '+' : k < 0 ? MINUS : '') + nf(Math.abs(k), 1), v: zb[k] ? zb[k].n : 0, n: zb[k] ? zb[k].n : '', col: zb[k] ? (zb[k].p >= 0 ? C.up : C.dn) : C.grid })), { fmt: v => String(v), label: w().vsVwap });
    h += sub(w().byBand, w().inZone(ts.filter(t => t.in_zone).length, ts.length)) + groupTable(ts, t => t.band || 'na', ['m3', 'm2', 'm1', 'p1', 'p2', 'p3', 'na'], k => w().band[k]) + groupTable(ts, t => (t.in_zone ? 'in' : 'out'), ['in', 'out'], k => (k === 'in' ? w().zoneIn : w().zoneOut));
    const near = R.level_near_pts, ln = ts.filter(t => t.session !== 'asia');
    h += sub(w().nearAsia, w().nearAsiaNote(near)) + groupTable(ln, t => (t.asia_lvl == null ? 'na' : Math.abs(t.asia_dist) <= near ? t.asia_lvl : 'none'), ['hi', 'lo', 'poc', 'vah', 'val', 'none', 'na'], k => w().lvl[k]);
    return h;
  }

  /* ---------- MIND ---------- */
  function mind(ts) {
    const R = X.M.R, raw = X.M.rawDays || [];
    const rows = []; raw.slice().sort((a, b) => (a.session_date < b.session_date ? 1 : -1)).forEach(d => ['asia', 'london', 'ny'].forEach(s => {
      const l = ts.filter(t => t.session_date === d.session_date && t.session === s), sc = d['score_' + s];
      if (!l.length && sc == null) return;
      if (S.period !== 'all' && !l.length) return;
      rows.push({ d: d.session_date, s, sc, n: l.length, pnl: sum(l.map(P)), mae: l.length ? Math.min(...l.map(t => t.mae_usd)) : null, risky: l.filter(t => t.risk_flags).length });
    }));
    let h = '';
    const scored = rows.filter(r => r.sc != null).slice().reverse();
    if (scored.length) {
      h += sub(w().scoreVs, w().scoreVsNote) + chart((wd, hh) => {
        const pl = 4, pr = 40, top = 14, bot = 30, mx = Math.max(1, ...scored.map(r => Math.abs(r.pnl))), y0 = top + (hh - top - bot) / 2, sc = (hh - top - bot) / 2 / mx, cw = (wd - pl - pr) / scored.length, bw = Math.min(30, cw * 0.55);
        const Ys = v => top + (hh - top - bot) * (10 - v) / 10;
        let b = `<line x1="${pl}" x2="${wd - pr}" y1="${y0}" y2="${y0}" stroke="${C.grid}"/>` + [0, 5, 10].map(v => txt(wd - pr + 6, Ys(v) + 3.5, v + '/10', { c: C.amb, fs: 9 })).join('');
        scored.forEach((r, i) => { const x = pl + cw * i + cw / 2, hgt = Math.abs(r.pnl) * sc; b += `<rect x="${x - bw / 2}" y="${r.pnl >= 0 ? y0 - hgt : y0}" width="${bw}" height="${Math.max(1, hgt)}" fill="${r.pnl >= 0 ? C.up : C.dn}" fill-opacity=".8"/><rect x="${x - 4}" y="${Ys(r.sc) - 4}" width="8" height="8" fill="${C.amb}"><title>${r.sc}/10</title></rect>` + txt(x, hh - 16, w().sessS[r.s], { a: 'middle', fs: 8.5 }) + txt(x, hh - 5, shortDay(r.d), { a: 'middle', fs: 8.5 }); });
        return svg(wd, hh, b, w().scoreVs);
      }, 200);
    } else h += sub(w().scoreVs) + `<p class="hint">${w().noScore}</p>`;
    h += sub(w().sessDetail) + table([[w().date, '70px'], [w().sess, '62px'], [w().score.toUpperCase(), '56px', 1], [w().n, '34px', 1], [w().pnl, '78px', 1], [w().worstMae.toUpperCase(), '84px', 1], [w().risky.toUpperCase(), '1fr', 1]],
      rows.map(r => [shortDay(r.d), w().sessS[r.s], r.sc == null ? '—' : `<span class="am">${nf(r.sc, r.sc % 1 ? 1 : 0)}</span>`, String(r.n), `<span class="${cl(r.pnl)}">${sg(r.pnl)}</span>`, r.mae == null ? '—' : `<span class="dn">${sg(r.mae)}</span>`, r.risky ? `<span class="dn">${r.risky}</span>` : '0']), 480);
    // your day, trade after trade
    const days = group(ts, t => t.session_date), dk = Object.keys(days).sort().reverse();
    h += sub(w().dayFlow) + dk.map(d => {
      const l = days[d].sort(byTime); let c = 0, pk = 0, at = 0; const cum = l.map((t, i) => { c += P(t); if (c > pk) { pk = c; at = i + 1; } return c; });
      const gb = pk - c, note = gb > 0.001 ? w().dayFlowTxt(sg(pk), at, MINUS + nf(gb), l.length - at) : w().dayFlowTop(sg(pk));
      return `<div class="flow"><div class="flow-h"><b>${shortDay(d)}</b><span class="${cl(c)}">${sg(c)}</span></div>` + chart((wd, hh) => {
        const pl = 2, pr = 2, lo = Math.min(0, ...cum), hi = Math.max(0, ...cum), Xs = i => pl + (wd - pl - pr) * (i + 1) / (cum.length + 0.5), Ys = v => 6 + (hh - 12) * (hi - v) / ((hi - lo) || 1);
        let b = `<line x1="${pl}" x2="${wd - pr}" y1="${Ys(0)}" y2="${Ys(0)}" stroke="${C.grid}"/>`;
        b += `<path class="ln" pathLength="1" d="M${pl},${Ys(0)}${cum.map((v, i) => `L${Xs(i).toFixed(1)},${Ys(v).toFixed(1)}`).join('')}" fill="none" stroke="${C.amb}" stroke-width="1.5"/>`;
        l.forEach((t, i) => { b += `<circle cx="${Xs(i)}" cy="${Ys(cum[i])}" r="2.6" fill="${C[t.session]}" data-open="${t.id}" style="cursor:pointer"><title>#${t.id} ${sg(P(t))}</title></circle>`; });
        if (at) b += `<line x1="${Xs(at - 1)}" x2="${Xs(at - 1)}" y1="${Ys(pk) - 6}" y2="${Ys(pk) + 6}" stroke="${C.txt}"/>`;
        return svg(wd, hh, b, d);
      }, 78) + `<p class="hint">${note}</p></div>`;
    }).join('');
    h += sub(w().byRank, w().byRankNote) + groupTable(ts, t => (t.nth <= 5 ? 'a' : t.nth <= 10 ? 'b' : t.nth <= 15 ? 'c' : t.nth <= 20 ? 'd' : 'e'), ['a', 'b', 'c', 'd', 'e'], k => ({ a: '1–5', b: '6–10', c: '11–15', d: '16–20', e: '21+' }[k]));
    const risky = ts.filter(t => t.risk_flags).slice().reverse();
    h += sub(w().riskyT, w().riskyNote(R)) + (risky.length ? table([['#', '34px'], [w().date, '96px'], [X.LANG === 'fr' ? 'POURQUOI' : 'WHY', '1fr'], [w().pnl, '78px', 1]],
      risky.map(t => Object.assign([`<span class="mu">${t.id}</span>`, `${shortDay(t.session_date)} ${t.entry_hms.slice(0, 5)}`, t.risk_flags.split(',').filter(Boolean).map(f => w().flags[f] || f).join(', '), `<span class="${cl(P(t))}">${sg(P(t))}</span>`], { go: t.id })), 380) : `<p class="hint">—</p>`);
    h += sub(w().afterWL) + groupTable(ts, t => t.prev || 'first', ['first', 'win', 'loss', 'be'], k => w().prev[k]);
    // after k losses in a row, same day
    const seq = group(ts, t => t.session_date), aft = { 2: [], 3: [] };
    Object.values(seq).forEach(l => { l.sort(byTime); let run = 0; l.forEach(t => { if (run >= 2) aft[2].push(t); if (run >= 3) aft[3].push(t); run = P(t) < 0 ? run + 1 : 0; }); });
    h += sub(w().afterLL, w().afterLLNote) + table([['', '1.6fr'], [w().n, '34px', 1], ['WIN %', '58px', 1], [w().pnl, '78px', 1], [w().avg.toUpperCase(), '1fr', 1]],
      [2, 3].map(k => { const s = stat(aft[k]); return [w().afterN(k), String(s.n), pc(s.wr), `<span class="${cl(s.pnl)}">${s.n ? sg(s.pnl) : '—'}</span>`, s.n ? sg(s.avg) : '—']; }), 380);
    return h;
  }

  /* ---------- RULES (one account) ---------- */
  function acctModel(n) {
    const R = X.M.R, ts = X.M.trades.filter(t => acctOf(t) === n).sort(byTime), dates = [...new Set(ts.map(t => t.session_date))].sort();
    const fl = hw => Math.min(hw - R.max_loss, R.mll_lock_level);
    let bal = R.start_balance, hw = bal; const days = [];
    dates.forEach(d => {
      const open = bal, mllIn = fl(hw); let eq = open, worst = open;
      ts.filter(t => t.session_date === d).forEach(t => { worst = Math.min(worst, eq + t.mae_usd); eq += t.pnl_net; worst = Math.min(worst, eq); });
      const lucid = n === 1 ? ((X.M.rawDays || []).find(x => x.session_date === d) || {}).balance_lucid : null;
      bal = lucid != null ? lucid : +eq.toFixed(2); hw = Math.max(hw, bal); days.push({ d, pnl: bal - open, worst, mllIn, wc: worst - mllIn });
    });
    const pos = x => Math.max(0, x), profit = bal - R.start_balance, best = days.length ? Math.max(...days.map(x => x.pnl)) : 0;
    const allW = sum(ts.map(t => pos(t.pnl_gross))), quick = sum(ts.filter(t => t.duration_s <= R.microscalp_max_s).map(t => pos(t.pnl_gross)));
    const avgDay = dates.length ? profit / dates.length : null, toGo = Math.max(0, R.profit_target - profit);
    return { R, ts, days, bal, hw, floor: fl(hw), profit, best, share: profit > 0 ? best / profit : null, micro: allW ? quick / allW : 0, avgDay, toGo, est: avgDay > 0 ? toGo / avgDay : null,
      wc: days.length ? Math.min(...days.map(x => x.wc)) : null, maxNQ: Math.max(0, ...ts.filter(t => t.instrument === 'NQ').map(t => t.qty)), maxMNQ: Math.max(0, ...ts.filter(t => t.instrument === 'MNQ').map(t => t.qty)),
      flatBreaks: ts.filter(t => t.exit_et >= R.flat_by_et && t.exit_et < R.reopen_et).length, lastExit: ts.map(t => t.exit_et).filter(x => x < R.flat_by_et && x >= '09:30').sort().pop() || null };
  }
  function rulesBlock(n) {
    const a = acctModel(n), R = a.R, m = (v, d = 2) => X.usd(v, d), pct = R.profit_target ? a.profit / R.profit_target : 0;
    const chk = (ok, warn) => (ok ? `<span class="up">✓</span>` : warn ? `<span class="am">●</span>` : `<span class="dn">✗</span>`);
    const row = (mark, lab, val) => `<div class="chk">${mark}<span>${lab}</span><span class="dots"></span><span>${val}</span></div>`;
    const cells = 20, filled = Math.max(0, Math.min(cells, Math.round(pct * cells)));
    let h = sub(w().status) + '<div class="blk">' + [
      kv(w().balance, `<b>${nf(a.bal)}</b>`), kv(w().hwm, nf(a.hw)), kv(w().profit, `<span class="${cl(a.profit)}">${sg(a.profit)}</span> <span class="mu">${w().of} ${nf(R.profit_target, 0)}</span>`),
      kv(w().floorL, `<span class="dn">${nf(a.floor)}</span>`), `<p class="hint">${w().floorNote(nf(R.max_loss, 0), nf(R.mll_lock_level, 0), nf(R.mll_lock_trigger, 0))}</p>`,
      kv(w().cushNow, nf(a.bal - a.floor)), kv(w().cushWorst, a.wc == null ? '—' : nf(a.wc)), `<p class="hint">${w().cushWorst1}</p>`,
      kv(w().daysT, String(a.days.length)), kv(w().toMake, nf(a.toGo)), a.est ? `<p class="hint">${w().pace(nf(a.est, 1))}</p>` : ''
    ].join('') + '</div>';
    h += sub(w().target) + `<div class="tbar"><span class="am">${'█'.repeat(filled)}</span><span class="mu">${'░'.repeat(cells - filled)}</span> <b>${pc(pct, 1)}</b></div>` +
      '<div class="blk">' + kv(w().perDay, `<span class="${cl(a.avgDay)}">${sg(a.avgDay)}</span>`) + kv(w().bestDay, `<span class="${cl(a.best)}">${sg(a.best)}</span>`) + '</div>';
    h += sub(w().rules) + '<div class="blk">' + [
      row(chk(a.profit >= R.profit_target, true), w().rTarget(nf(R.profit_target, 0)), pc(pct, 1)),
      row(chk(a.wc == null || a.wc > 0), w().rMll(nf(R.max_loss, 0)), `${w().worstC} ${a.wc == null ? '—' : nf(a.wc)}`),
      row(chk(a.maxNQ <= R.max_minis && a.maxMNQ <= R.max_micros), w().rSize(R.max_minis, R.max_micros), `${w().largest} ${a.maxNQ} NQ / ${a.maxMNQ} MNQ`),
      row(chk(a.flatBreaks === 0), w().rFlat(R.flat_by_et), `${w().latest} ${a.lastExit || '—'}`),
      row(chk(a.micro <= R.microscalp_max_share), w().rMicro(R.microscalp_max_s, pc(R.microscalp_max_share)), pc(a.micro, 1))
    ].join('') + '</div>';
    h += sub(w().payouts) + '<div class="blk">' + [
      kv(w().buffer, nf(R.payout_buffer)), kv(w().above, nf(Math.max(0, a.bal - R.payout_buffer))),
      kv(w().reqMin, m(R.payout_min_request, 0)), kv(w().reqMax, `${m(R.payout_max_first, 0)} / ${m(R.payout_max_next, 0)}`), `<p class="hint">${w().reqMax1}</p>`,
      kv(w().cycle, m(R.payout_min_profit, 0)), kv(w().split, pc(R.profit_split)), kv(w().delay, w().bdays(R.payout_business_days)), `<p class="hint">${w().methods}</p>`
    ].join('') + '</div>';
    const sh = a.share == null ? 0 : Math.min(1, a.share), lim = R.payout_consistency;
    h += sub(w().consist) + `<div class="cbar"><i style="width:${sh * 100}%" class="${sh > lim ? 'bad' : ''}"></i><u style="left:${lim * 100}%"></u></div><p class="hint">${w().consistTxt(pc(a.share, 1), pc(lim))}</p>`;
    return h;
  }
  function accDetail(n) {
    const acc = X.M.accounts.find(a => a.n === n) || { n, stage: 'none' };
    if (acc.stage === 'none') return `<div class="accd"><p class="hint">${w().notStarted(n)}</p></div>`;
    const ts = X.M.trades.filter(t => acctOf(t) === n), s = (() => { const p = ts.map(t => t.pnl_net), wn = p.filter(x => x > 0), ls = p.filter(x => x < 0); return { n: p.length, wr: p.length ? wn.length / p.length : null, pf: ls.length ? sum(wn) / -sum(ls) : null, net: sum(p) }; })();
    return `<div class="accd"><div class="accd-h">#${n} <span class="mu">${esc(acc.name || '')}</span> <span class="am">${w().stage[acc.stage]}</span></div>` +
      sub(w().accStats) + `<div class="blk">${kv(w().trades, String(s.n))}${kv(w().wr, pc(s.wr))}${kv(w().pf, s.pf == null ? '—' : nf(s.pf))}${kv(w().pnl + ' (' + w().net + ')', `<span class="${cl(s.net)}">${sg(s.net)}</span>`)}</div>` +
      `<button type="button" class="btn" data-acstats="${n}">${w().openStats(n)} ▸</button>` + rulesBlock(n) + '</div>';
  }

  /* ---------- STATS section ---------- */
  function periodsList() {
    const ds = [...new Set(X.M.trades.map(t => t.session_date))].sort().reverse();
    const ms = [...new Set(ds.map(d => d.slice(0, 7)))], wk = [...new Set(ds.map(monday))];
    return [['all', w().allTime]].concat(ms.map(m => ['m:' + m, w().month + ' : ' + monthLabel(m)]), wk.map(x => ['w:' + x, w().week + ' ' + shortDay(x)]), ds.map(d => ['d:' + d, w().day + ' : ' + X.dayLabel(d)]));
  }
  function stats() {
    const box = $('#stBody'); if (!box) return;
    const accts = X.M.accounts.filter(a => a.stage !== 'none').map(a => a.n);
    const chips = (key, items) => `<div>${items.map(([v, l]) => `<button type="button" data-f="${key}" data-v="${v}" aria-pressed="${String(S[key]) === String(v)}">${l}</button>`).join('')}</div>`;
    let h = `<div class="fbar">
      <div class="fl2"><span>${w().acct}</span>${chips('acct', [['all', w().all]].concat(accts.map(n => [String(n), '#' + n])))}</div>
      <div class="fl2"><label for="stPer">${w().period}</label><select id="stPer">${periodsList().map(([v, l]) => `<option value="${v}"${S.period === v ? ' selected' : ''}>${esc(l)}</option>`).join('')}</select></div>
      <div class="fl2"><span>${w().sess}</span>${chips('sess', ['all', 'asia', 'london', 'ny'].map(k => [k, w().sessS[k]]))}</div>
      <div class="fl2"><span>${w().mode}</span>${chips('mode', [['net', w().net], ['gross', w().gross]])}</div></div>`;
    h += `<div class="tabs2" role="tablist">${w().tabs.map(([k, l]) => `<button type="button" role="tab" data-tab="${k}" aria-selected="${S.tab === k}">${l}</button>`).join('')}</div><div id="stTab"></div>`;
    box.innerHTML = h;
    $$('[data-f]', box).forEach(b => b.addEventListener('click', () => { S[b.dataset.f] = b.dataset.v; stats(); }));
    $('#stPer', box).addEventListener('change', e => { S.period = e.target.value; stats(); });
    $$('[data-tab]', box).forEach(b => b.addEventListener('click', () => { S.tab = b.dataset.tab; stats(); }));
    tab(true);
  }
  function tab(anim) {
    const el = $('#stTab'); if (!el) return;
    CH.clear();
    if (S.tab === 'rules') {
      const ns = S.acct === 'all' ? X.M.accounts.filter(a => a.stage !== 'none').map(a => a.n) : [+S.acct];
      el.innerHTML = ns.map(n => `<div class="acct-h">#${n}</div>` + rulesBlock(n)).join('') || `<p class="hint">${w().none}</p>`;
    } else {
      const ts = scoped();
      el.innerHTML = (S.acct === 'all' && X.M.accounts.filter(a => a.stage !== 'none').length > 1 ? `<p class="hint">${w().scopeAll}</p>` : '') +
        (ts.length ? ({ perf, exec, time: timing, mind })[S.tab](ts) : `<p class="hint">${w().none}</p>`);
      if (S.tab === 'time' && !X.BARS) X.loadBars().then(() => { if (S.tab === 'time') tab(false); });
    }
    drawCharts(el); wire(el);
    $$('[data-sday]', el).forEach(b => b.addEventListener('click', () => { S.day = b.dataset.sday; tab(false); }));
    const bl = $$('.blk', el);
    if (anim && X.ANIM) bl.forEach(b => X.when(b, () => X.printRows(b, 22), () => X.hide(b)));
  }
  // taps on trades inside charts and tables open the trade in TRADES
  function wire(root) {
    $$('[data-open]', root).forEach(n => { const f = () => X.openTrade(+n.dataset.open, true); n.addEventListener('click', f); n.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); f(); } }); });
    $$('[data-acstats]', root).forEach(b => b.addEventListener('click', () => { S.acct = b.dataset.acstats; S.tab = 'perf'; stats(); X.go('st'); }));
  }

  /* ---------- WEEKLY WATCH ---------- */
  const WEIGHTS = { banks: 0.3, funds: 0.25, surveys: 0.15, events: 0.15, nq: 0.15 };
  const catScore = c => { const s = (c.items || []).map(i => +i.stance).filter(v => isFinite(v)); return s.length ? avg(s) * 50 : null; };
  function weekScore(wk) {
    let t = 0, ww = 0; (wk.cats || []).forEach(c => { const s = catScore(c); if (s != null && WEIGHTS[c.key] != null) { t += WEIGHTS[c.key] * s; ww += WEIGHTS[c.key]; } });
    return ww ? Math.round(t / ww) : 0;
  }
  const verdict = s => (s >= 20 ? 'bull' : s <= -20 ? 'bear' : 'neutral');
  const tr = o => (o == null ? '' : typeof o === 'string' ? o : o[X.LANG] || o.en || '');
  function nextMonday() { const now = new Date(), d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())); const k = (8 - d.getUTCDay()) % 7 || 7; d.setUTCDate(d.getUTCDate() + (d.getUTCDay() === 1 ? 0 : k)); return d.toISOString().slice(0, 10); }
  function gauge(score, big) {
    const pos = (score + 100) / 2, v = verdict(score);
    return `<div class="gauge${big ? ' big' : ''}"><div class="gtrack"><i class="gfill ${score >= 0 ? 'up' : 'dn'}" style="left:${Math.min(50, pos)}%;width:${Math.abs(score) / 2}%"></i><u></u><b class="gmark" style="left:${pos}%"></b></div>
      <div class="glab"><span class="dn">${w().bear}</span><span class="gsc ${v === 'bull' ? 'up' : v === 'bear' ? 'dn' : 'am'}">${score > 0 ? '+' : score < 0 ? MINUS : ''}${Math.abs(score)} ${w()[v]}</span><span class="up">${w().bull}</span></div></div>`;
  }
  function watchMeta() { const ws = (X.M.watch && X.M.watch.weeks) || []; return ws.length ? w().wMeta(shortDay(ws[ws.length - 1].week)) : w().wMetaNone; }
  function watch() {
    const box = $('#wtBody'); if (!box) return;
    const ws = ((X.M.watch && X.M.watch.weeks) || []).slice().sort((a, b) => (a.week < b.week ? -1 : 1));
    const how = sub(w().wHow) + `<p class="hint">${w().wHowTxt}</p><p class="hint">${w().wWeights}</p><p class="hint">${w().wPublic}</p>`;
    if (!ws.length) { box.innerHTML = `<p class="lead">${w().wNone(fmtDate(nextMonday(), { day: 'numeric', month: 'long' }))}</p>` + how; return; }
    const wk = ws[ws.length - 1], sc = weekScore(wk);
    const pub = wk.published ? new Intl.DateTimeFormat(loc(), { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Paris' }).format(new Date(wk.published)) : '';
    let h = `<p class="hint">${w().published(esc(pub))}</p>` + gauge(sc, true) + (wk.summary ? `<p class="lead">${esc(tr(wk.summary))}</p>` : '');
    (wk.cats || []).forEach(c => {
      const cs = catScore(c);
      h += `<div class="sub">${w().cats[c.key] || esc(c.key)}</div>` + (cs != null ? gauge(Math.round(cs), false) : '') + '<div class="blk">' + (c.items || []).map(i => {
        const st = Math.max(-2, Math.min(2, Math.round(+i.stance || 0)));
        return `<div class="src"><div class="src-h"><b>${esc(i.src || '')}</b><span class="tag ${st > 0 ? 'up' : st < 0 ? 'dn' : 'mu'}">${w().tags[String(st)]}</span></div><p>${esc(tr(i.text))}</p>${i.url ? `<a class="more" href="${esc(i.url)}" target="_blank" rel="noopener">${w().open} ↗</a>` : ''}${i.date ? ` <span class="mu">${shortDay(i.date)}</span>` : ''}</div>`;
      }).join('') + '</div>';
    });
    if ((wk.events || []).length) {
      h += sub(w().events) + table([[w().date, '88px'], [X.LANG === 'fr' ? 'HEURE' : 'TIME', '54px'], ['', '1fr'], ['', '62px', 1]],
        wk.events.map(e => [shortDay(e.d), esc(e.t || ''), esc(tr(e.what)), `<span class="${e.imp >= 3 ? 'dn' : e.imp === 2 ? 'am' : 'mu'}">${w().imp[e.imp] || ''}</span>`]), 380);
    }
    if (ws.length > 1 || (wk.result && wk.result.chg_pct != null)) {
      h += sub(w().history) + table([[X.LANG === 'fr' ? 'SEMAINE' : 'WEEK', '84px'], ['SCORE', '1fr'], [w().nqWeek.toUpperCase(), '84px', 1], [w().right.toUpperCase(), '62px', 1]],
        ws.slice().reverse().map(x => { const s = weekScore(x), v = verdict(s), ch = x.result && x.result.chg_pct, ok = ch == null ? null : v === 'neutral' ? Math.abs(ch) < 1 : (v === 'bull') === (ch > 0);
          return [shortDay(x.week), `<span class="${v === 'bull' ? 'up' : v === 'bear' ? 'dn' : 'am'}">${s > 0 ? '+' : s < 0 ? MINUS : ''}${Math.abs(s)} ${w()[v]}</span>`, ch == null ? '—' : `<span class="${cl(ch)}">${sg(ch, 2)}%</span>`, ok == null ? '—' : ok ? '<span class="up">✓</span>' : '<span class="dn">✗</span>']; }), 380);
    }
    box.innerHTML = h + how;
    if (X.ANIM) $$('.blk', box).forEach(b => X.when(b, () => X.printRows(b, 30), () => X.hide(b)));
  }

  let rz; addEventListener('resize', () => { clearTimeout(rz); rz = setTimeout(() => { const el = $('#stTab'); if (el) { drawCharts(el); wire(el); } }, 250); });
  window.R5S = { stats, watch, watchMeta, accDetail, wire };
})();
