/* Le trou noir : le fond de Road to 5 Live (23/11), à la place des rubans.

   Un vrai calcul de lumière, pixel par pixel, sur la carte graphique (WebGL) :
   - chaque rayon part de la caméra et se courbe autour du trou noir (relativité, métrique de Schwarzschild,
     unité = le rayon de l'horizon) ; s'il passe sous l'horizon, il est avalé (le disque noir au centre) ;
   - quand il traverse le plan du disque d'accrétion, il ramasse sa lumière : ambre et blanc chaud, plus chaud près
     du centre, qui tourne plus vite à l'intérieur qu'à l'extérieur (Kepler), plus brillant du côté qui vient vers
     nous (effet Doppler) ; la lumière qui passe derrière le trou noir revient par-dessus et par-dessous ;
   - sinon il finit dans le ciel : quelques étoiles chaudes et une brume ambre très faible, déformées autour du trou.

   Ce qu'il fait :
   - fond de toute la page ; en faisant défiler, la caméra tourne autour et monte au-dessus du disque ;
   - il suit la souris (ou l'inclinaison du téléphone, quand le navigateur la donne sans demander) ;
   - son éclat suit la dernière séance du journal : plus fort, plus chaud et plus rapide après un gain,
     plus sombre et plus lent après une perte (window.TN.humeur, appelé par app.js) ;
   - l'intro : la caméra arrive de loin et plonge dans le trou noir, puis la page apparaît (window.TN.plonger) ;
   - mouvement réduit demandé : une seule image, sans animation ;
   - la qualité baisse toute seule si l'appareil peine (moins de pixels, moins de pas de calcul, puis 30 images
     par seconde, puis une image fixe) ;
   - sans WebGL : rien ici, la page garde un trou noir dessiné en CSS (style.css).
   Test : ?tn=0 (ou 1, 2, 3…) bloque un niveau de qualité ; ?tn=fixe force l'image fixe ; ?tn=f0 les deux. */
(function () {
  'use strict';
  var toile = document.getElementById('trounoir');
  var racine = document.documentElement;
  var rien = function () {};
  window.TN = { actif: false, humeur: rien, plonger: rien, sortir: rien };
  if (!toile) return;

  var mm = function (q) { return !!(window.matchMedia && window.matchMedia(q).matches); };
  var reduit = mm('(prefers-reduced-motion: reduce)');
  var petit = mm('(max-width: 860px), (pointer: coarse)');
  var param = (location.search.match(/[?&]tn=([a-z0-9]+)/) || [])[1] || '';
  var lu = function (k) { try { return sessionStorage.getItem(k); } catch (e) { return null; } };

  var gl = null;
  try {
    var opts = { alpha: false, antialias: false, depth: false, stencil: false, premultipliedAlpha: false, preserveDrawingBuffer: false, powerPreference: 'high-performance' };
    gl = toile.getContext('webgl', opts) || toile.getContext('experimental-webgl', opts);
  } catch (e) { gl = null; }
  if (!gl) return;

  /* ---------- le dessin ---------- */
  var VS = 'attribute vec2 a_p; void main() { gl_Position = vec4(a_p, 0.0, 1.0); }';
  var FS = [
    '#ifdef GL_FRAGMENT_PRECISION_HIGH',
    'precision highp float;',
    '#else',
    'precision mediump float;',
    '#endif',
    'uniform vec2 u_res;',        // la toile, en pixels
    'uniform float u_t;',         // le temps du disque (accéléré ou ralenti selon la dernière séance)
    'uniform float u_ciel;',      // le temps réel, pour le scintillement des étoiles
    'uniform vec3 u_cam;',        // distance, hauteur au-dessus du disque (radians), tour autour (radians)
    'uniform float u_roulis;',    // la pente du disque à l'écran
    'uniform vec2 u_centre;',     // où est le trou noir à l'écran (0 à 1)
    'uniform float u_zoom;',      // plus petit = plus gros
    'uniform float u_humeur;',    // la dernière séance : -1 perte, 0 rien, +1 gain
    'uniform float u_eclat;',     // 0 = noir (intro), 1 = plein
    'uniform float u_pas;',       // nombre de pas de calcul par rayon
    'uniform float u_pasr;',      // la taille d'un pas, relative à la distance au trou
    'const float PI = 3.14159265;',
    'const float RIN = 3.0;',     // la dernière orbite stable : le bord intérieur du disque
    'const float ROUT = 15.0;',   // le bord extérieur
    'float h12(vec2 p) { vec3 q = fract(vec3(p.xyx) * 0.1031); q += dot(q, q.yzx + 33.33); return fract((q.x + q.y) * q.z); }',
    'float h13(vec3 q) { q = fract(q * 0.1031); q += dot(q, q.zyx + 31.32); return fract((q.x + q.y) * q.z); }',
    'vec3 h33(vec3 q) { q = fract(q * vec3(0.1031, 0.1030, 0.0973)); q += dot(q, q.yxz + 33.33); return fract((q.xxy + q.yxx) * q.zyx); }',
    // un bruit doux, qui se répète en y tous les P (pour faire le tour du disque sans couture)
    'float bruitP(vec2 p, float P) {',
    '  vec2 i = floor(p), f = fract(p), u = f * f * (3.0 - 2.0 * f);',
    '  float y0 = mod(i.y, P), y1 = mod(i.y + 1.0, P);',
    '  return mix(mix(h12(vec2(i.x, y0)), h12(vec2(i.x + 1.0, y0)), u.x), mix(h12(vec2(i.x, y1)), h12(vec2(i.x + 1.0, y1)), u.x), u.y);',
    '}',
    'float fbmP(vec2 p, float P) { float s = 0.0, a = 0.55; for (int k = 0; k < 3; k++) { s += a * bruitP(p, P); p = p * 2.0 + vec2(1.7, 0.0); P *= 2.0; a *= 0.5; } return s; }',
    'float bruit3(vec3 p) {',
    '  vec3 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);',
    '  return mix(mix(mix(h13(i), h13(i + vec3(1.0, 0.0, 0.0)), f.x), mix(h13(i + vec3(0.0, 1.0, 0.0)), h13(i + vec3(1.0, 1.0, 0.0)), f.x), f.y),',
    '             mix(mix(h13(i + vec3(0.0, 0.0, 1.0)), h13(i + vec3(1.0, 0.0, 1.0)), f.x), mix(h13(i + vec3(0.0, 1.0, 1.0)), h13(i + vec3(1.0, 1.0, 1.0)), f.x), f.y), f.z);',
    '}',
    'float fbm3(vec3 p) { float s = 0.0, a = 0.5; for (int k = 0; k < 4; k++) { s += a * bruit3(p); p = p * 2.03 + vec3(3.1, 1.7, 5.3); a *= 0.5; } return s; }',
    // la couleur selon la chaleur : braise, ambre profond, ambre du site, blanc chaud
    'vec3 rampe(float t) {',
    '  t = clamp(t, 0.0, 1.7);',
    '  vec3 c = mix(vec3(0.32, 0.05, 0.01), vec3(0.95, 0.36, 0.04), smoothstep(0.0, 0.5, t));',
    '  c = mix(c, vec3(1.0, 0.58, 0.09), smoothstep(0.45, 0.85, t));',
    '  return mix(c, vec3(1.0, 0.9, 0.74), smoothstep(0.9, 1.5, t));',
    '}',
    // la matière du disque : des filets qui tournent (plus vite dedans), sans se tordre à l'infini (deux phases fondues)
    'float matiere(float r, float th) {',
    '  float om = 5.4 * pow(r, -1.5), oref = 0.367, T = 16.0, P = 30.0;',
    '  float f1 = fract(u_t / T), f2 = fract(u_t / T + 0.5), w1 = 1.0 - abs(2.0 * f1 - 1.0);',
    '  float a0 = th - oref * u_t, x = r * 1.8;',
    '  float n1 = fbmP(vec2(x, (a0 - (om - oref) * f1 * T) / (2.0 * PI) * P), P);',
    '  float n2 = fbmP(vec2(x + 41.0, (a0 - (om - oref) * f2 * T) / (2.0 * PI) * P), P);',
    '  float n = mix(n2, n1, w1);',
    '  float anneaux = 0.5 + 0.5 * sin(r * 7.0 + n * 5.0);',
    '  return clamp(n * 1.35 - 0.2, 0.0, 1.0) * (0.55 + 0.45 * anneaux);',
    '}',
    // le ciel : une brume ambre très faible et des étoiles chaudes (au moins un pixel et demi, pour ne pas clignoter)
    'vec3 ciel(vec3 d) {',
    '  float n = fbm3(d * 2.1 + 4.0), n2 = fbm3(d * 5.5 + 11.0);',
    '  vec3 c = vec3(0.6, 0.3, 0.09) * pow(n, 3.4) * 0.2 * (0.4 + 1.1 * n2);',
    '  float px = u_zoom / u_res.y;',
    '  for (int k = 0; k < 2; k++) {',
    '    float fk = float(k), s = 30.0 + fk * 34.0;',
    '    vec3 p = d * s, id = floor(p), h = h33(id + fk * 31.0);',
    '    vec3 ctr = id + 0.5 + (h - 0.5) * 0.7;',
    '    float dd = length(p - ctr), ta = max(0.03 + 0.03 * h.y, px * s * 1.2);',
    '    float b = smoothstep(ta, 0.0, dd) + 0.12 * smoothstep(ta * 3.0, 0.0, dd);',
    '    float tw = 0.72 + 0.28 * sin(u_ciel * (0.7 + 2.2 * h.z) + h.y * 50.0);',
    '    c += mix(vec3(1.0, 0.9, 0.8), vec3(1.0, 0.64, 0.3), h.z) * b * step(0.9 + fk * 0.03, h.x) * tw * (0.8 - fk * 0.25);',
    '  }',
    '  return c;',
    '}',
    'void main() {',
    '  vec2 uv = (gl_FragCoord.xy - u_centre * u_res) / u_res.y;',
    '  float cr = cos(u_roulis), sr = sin(u_roulis);',
    '  uv = vec2(cr * uv.x - sr * uv.y, sr * uv.x + cr * uv.y);',
    '  float D = u_cam.x, el = u_cam.y, az = u_cam.z;',
    '  vec3 pos = D * vec3(cos(el) * sin(az), sin(el), cos(el) * cos(az));',
    '  vec3 fw = normalize(-pos), rt = normalize(cross(fw, vec3(0.0, 1.0, 0.0))), up = cross(rt, fw);',
    '  vec3 vel = normalize(fw + (uv.x * rt + uv.y * up) * u_zoom);',
    '  vec3 col = vec3(0.0);',
    '  float opa = 0.0, rmin = 1e4;',
    '  bool avale = false, loin = false;',
    // de très loin (intro) : tout droit jusqu'à la sphère de rayon 40, la lumière n'y est presque pas courbée
    '  float r0 = length(pos);',
    '  if (r0 > 40.0) {',
    '    float b = dot(pos, vel), disc = b * b - (r0 * r0 - 1600.0);',
    '    if (disc > 0.0 && b < 0.0) pos += vel * (-b - sqrt(disc)); else loin = true;',
    '  }',
    '  if (!loin) {',
    '    vec3 hv = cross(pos, vel);',
    '    float h2 = dot(hv, hv), rr = dot(pos, pos);',
    '    vec3 acc = -1.5 * h2 * pos / (rr * rr * sqrt(rr));',
    '    for (int i = 0; i < 170; i++) {',
    '      if (float(i) >= u_pas) break;',
    '      float dt = clamp(u_pasr * length(pos), 0.015, 3.0);',
    '      vec3 prev = pos;',
    '      vel += 0.5 * acc * dt; pos += vel * dt;',
    '      rr = dot(pos, pos);',
    '      acc = -1.5 * h2 * pos / (rr * rr * sqrt(rr));',
    '      vel += 0.5 * acc * dt;',
    '      float rn = sqrt(rr);',
    '      rmin = min(rmin, rn);',
    '      if (prev.y * pos.y < 0.0) {',  // le rayon traverse le plan du disque
    '        vec3 hit = mix(prev, pos, prev.y / (prev.y - pos.y));',
    '        float rh = length(hit.xz);',
    '        if (rh > RIN * 0.9 && rh < ROUT) {',
    '          float x = RIN / rh;',
    '          float flux = max(x * x * x * (1.0 - sqrt(x)), 0.0) / 0.0567;',
    '          float bord = smoothstep(RIN * 0.9, RIN * 1.12, rh) * (1.0 - smoothstep(ROUT * 0.42, ROUT, rh));',
    '          float m = matiere(rh, atan(hit.z, hit.x));',
    '          vec3 vd = vec3(-hit.z, 0.0, hit.x) / rh;',
    '          float be = min(sqrt(0.5 / max(rh - 1.0, 0.5)), 0.7), ga = inversesqrt(1.0 - be * be);',
    '          float g = sqrt(1.0 - 1.0 / rh) / (ga * (1.0 - be * dot(vd, -normalize(vel))));',
    '          float I = flux * mix(1.0, g * g * g, 0.7) * (0.3 + 1.5 * m) * bord;',
    '          float te = pow(flux, 0.3) * mix(1.0, g, 0.55) * (0.72 + 0.5 * m) * (0.9 + 0.2 * u_humeur);',
    '          float a = clamp(bord * (0.3 + 0.7 * m) * (0.5 + 0.5 * min(flux, 1.0)), 0.0, 0.95);',
    '          col += (1.0 - opa) * rampe(te) * I * 1.7 * a;',
    '          opa += (1.0 - opa) * a;',
    '        }',
    '      }',
    '      if (rr < 1.0) { avale = true; break; }',
    '      if (rn > 42.0 && dot(pos, vel) > 0.0) break;',
    '      if (opa > 0.985) break;',
    '    }',
    '  }',
    '  if (!avale) {',
    '    col += (1.0 - opa) * ciel(normalize(vel));',
    '    float g = max(rmin - 1.5, 0.0);',   // l'anneau de photons, fin et brillant, et un halo large
    '    col += vec3(1.0, 0.6, 0.18) * (0.32 * exp(-g * 6.0) + 0.06 * exp(-g * 0.8)) * (1.0 - 0.6 * opa);',
    '  }',
    '  col *= u_eclat * (1.0 + 0.34 * u_humeur);',
    '  col = vec3(1.0) - exp(-col * 1.3);',
    '  vec2 q = gl_FragCoord.xy / u_res - 0.5;',
    '  col *= 1.0 - 0.7 * dot(q, q);',
    '  col += vec3(0.027, 0.024, 0.02) * (1.0 - col);',  // le noir du site (#070605) dessous
    '  col += (h12(gl_FragCoord.xy + fract(u_ciel) * 61.0) - 0.5) / 255.0;',
    '  gl_FragColor = vec4(col, 1.0);',
    '}'
  ].join('\n');

  function shader(type, src) {
    var s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) { if (window.console) console.warn('trounoir', gl.getShaderInfoLog(s)); return null; }
    return s;
  }
  var vs = shader(gl.VERTEX_SHADER, VS), fs = shader(gl.FRAGMENT_SHADER, FS);
  if (!vs || !fs) return;
  var prog = gl.createProgram(); gl.attachShader(prog, vs); gl.attachShader(prog, fs); gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return;
  gl.useProgram(prog);
  var buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  var ap = gl.getAttribLocation(prog, 'a_p'); gl.enableVertexAttribArray(ap); gl.vertexAttribPointer(ap, 2, gl.FLOAT, false, 0, 0);
  var U = {};
  ['u_res', 'u_t', 'u_ciel', 'u_cam', 'u_roulis', 'u_centre', 'u_zoom', 'u_humeur', 'u_eclat', 'u_pas', 'u_pasr'].forEach(function (n) { U[n] = gl.getUniformLocation(prog, n); });

  /* ---------- la qualité : la part des pixels de la page qu'on calcule, et les pas par rayon ---------- */
  // q : la part des pixels de l'écran (pixels réels) ; max : le plafond de pixels calculés
  var NIV = petit
    ? [{ q: 0.55, pas: 90, pasr: 0.085, max: 800000 }, { q: 0.48, pas: 86, pasr: 0.09, max: 520000 }, { q: 0.4, pas: 80, pasr: 0.095, max: 330000 }, { q: 0.3, pas: 70, pasr: 0.11, max: 200000 }, { q: 0.22, pas: 64, pasr: 0.12, max: 110000 }]
    : [{ q: 1, pas: 150, pasr: 0.055, max: 3200000 }, { q: 0.8, pas: 140, pasr: 0.06, max: 1700000 }, { q: 0.62, pas: 120, pasr: 0.07, max: 1000000 }, { q: 0.48, pas: 100, pasr: 0.085, max: 600000 }, { q: 0.36, pas: 84, pasr: 0.1, max: 340000 }];
  var bloque = /\d/.test(param) ? Math.min(+param.replace(/\D/g, '')[0], NIV.length - 1) : -1;
  // on part d'un niveau moyen ; on monte tant que l'appareil suit, on redescend dès qu'il peine
  var niv = bloque >= 0 ? bloque : petit ? 1 : 2, monter = bloque < 0;
  var cadence = petit ? 30 : 60;
  var fixe = reduit || param.indexOf('f') >= 0;

  function taille() {
    var dpr = Math.min(window.devicePixelRatio || 1, 3), N = NIV[niv];
    var w = Math.max(1, innerWidth) * dpr, h = Math.max(1, toile.clientHeight || innerHeight) * dpr;
    var q = Math.min(N.q, Math.sqrt(N.max / (w * h)));
    var W = Math.max(64, Math.round(w * q)), H = Math.max(64, Math.round(h * q));
    if (toile.width !== W || toile.height !== H) { toile.width = W; toile.height = H; }
    gl.viewport(0, 0, W, H);
  }

  /* ---------- la pose de la caméra ---------- */
  var cl = function (v, a, b) { return Math.max(a, Math.min(b, v)); };
  var mix = function (a, b, k) { return a + (b - a) * k; };
  var lisse = function (a, b, x) { var t = cl((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
  // le trou noir se place derrière le solde (l'élément marqué data-tn-ancre), là où il est quand la page est en haut
  var ancre = null, ancreLu = 0;
  function lireAncre() {
    ancreLu = performance.now();
    var el = document.querySelector('[data-tn-ancre]');
    if (!el) { ancre = null; return; }
    var r = el.getBoundingClientRect();
    if (!r.width) { ancre = null; return; }
    ancre = { x: (r.left + r.width / 2) / innerWidth, y: (r.top + scrollY + r.height * 0.55) / innerHeight };
  }
  var regle = {};                                  // réglages de test (TN.regler), vides en temps normal
  function repos() { var R = repos0(), k; for (k in regle) R[k] = regle[k]; return R; }
  function repos0() {
    var w = innerWidth, h = innerHeight, debout = h > w * 1.15;
    var R = debout ? { D: 24, el: 0.15, az: 0, roulis: -0.1, cx: 0.5, cy: 0.7, zoom: 1.1 }     // téléphone debout
      : w >= 1080 ? { D: 24, el: 0.1, az: 0, roulis: -0.16, cx: 0.34, cy: 0.6, zoom: 0.7 }       // ordinateur
      : { D: 24, el: 0.12, az: 0, roulis: -0.14, cx: 0.42, cy: 0.62, zoom: 0.86 };
    if (ancre) { R.cx = cl(ancre.x, 0.15, 0.85); R.cy = cl(1 - ancre.y, 0.2, 0.85); }
    return R;
  }
  var souris = { x: 0, y: 0, cx: 0, cy: 0 };
  var defil = 0, defilL = 0;
  var humeur = 0, humeurC = 0;
  var tDisque = 0, tCiel = 0;
  var intro = null, revele = null;
  var attente = !fixe && !lu('r5l-boot');            // l'intro va venir : on reste dans le noir en l'attendant
  var eclatIntro = attente ? 0 : 1;

  function lireDefil() {
    var H = Math.max(1, document.documentElement.scrollHeight - innerHeight);
    defil = cl(scrollY / H, 0, 1);
  }

  function pose(maintenant) {
    if (maintenant - ancreLu > 1000) lireAncre();
    var R = repos(), p = { D: R.D, el: R.el, az: R.az, roulis: R.roulis, cx: R.cx, cy: R.cy, zoom: R.zoom }, e = 1;
    // le défilement : la caméra tourne autour et monte au-dessus du disque ; le trou noir s'efface un peu derrière le texte
    p.az += defilL * 1.9;
    p.el += defilL * 0.34;
    p.roulis *= 1 - 0.6 * defilL;
    e *= 1 - 0.36 * lisse(0.0, 0.16, defilL);
    // la souris (ou le téléphone)
    p.az += souris.x * 0.22; p.el += souris.y * 0.07;
    p.cx += souris.x * 0.012; p.cy -= souris.y * 0.012;
    if (intro) {
      var u = intro.fige != null ? intro.fige : cl((maintenant - intro.t0) / intro.ms, 0, 1), k;
      p.cx = 0.5; p.cy = 0.5; p.zoom = Math.max(R.zoom, 0.9);
      if (u < 0.6) {                                   // arrivée de loin, en tournant
        k = 1 - Math.pow(1 - u / 0.6, 3);
        p.D = mix(170, 26, k); p.az = R.az + mix(-1.5, 0, k); p.el = mix(0.5, 0.13, k); p.roulis = mix(0.55, R.roulis, k);
      } else {                                         // la plongée dans le noir
        k = Math.pow((u - 0.6) / 0.4, 2);
        p.D = mix(26, 2.3, k); p.az = R.az + 0.3 * k; p.el = 0.13 - 0.05 * k; p.roulis = R.roulis * (1 - k);
      }
      e = lisse(0, 0.14, u) * (1 - lisse(0.82, 0.98, u));
      if (u >= 1) sortir();
    } else if (revele) {                               // on ressort : le trou noir revient à sa place
      var v = cl((maintenant - revele) / 1200, 0, 1), s = 1 - Math.pow(1 - v, 3);
      p.D = mix(34, p.D, s); e *= s * eclatIntro;
      if (v >= 1) revele = null;
    } else e *= eclatIntro;
    return { p: p, e: e };
  }

  /* ---------- dessiner une image ---------- */
  function dessiner(maintenant) {
    var P = pose(maintenant || performance.now()), p = P.p, N = NIV[niv];
    gl.uniform2f(U.u_res, toile.width, toile.height);
    gl.uniform1f(U.u_t, tDisque);
    gl.uniform1f(U.u_ciel, tCiel);
    gl.uniform3f(U.u_cam, p.D, p.el, p.az);
    gl.uniform1f(U.u_roulis, p.roulis);
    gl.uniform2f(U.u_centre, p.cx, p.cy);
    gl.uniform1f(U.u_zoom, p.zoom);
    gl.uniform1f(U.u_humeur, humeur);
    gl.uniform1f(U.u_eclat, P.e);
    gl.uniform1f(U.u_pas, N.pas);
    gl.uniform1f(U.u_pasr, N.pasr);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  /* ---------- la boucle ---------- */
  var raf = 0, dernier = 0, mesures = [], debut = 0, decisions = 0, lents = 0;
  function image(maintenant) {
    raf = requestAnimationFrame(image);
    var ecart = maintenant - dernier;
    if (dernier && ecart < 1000 / cadence - 3) return;
    var dt = dernier ? Math.min(0.1, ecart / 1000) : 1 / cadence;
    dernier = maintenant;
    // une image toutes les secondes environ, c'est le navigateur qui freine (fenêtre derrière une autre, onglet caché) :
    // ça ne dit rien de la carte graphique. Pareil pour une pause isolée (la page qui se construit).
    // Il faut trois images lentes de suite (entre 0,25 et 0,9 s) pour descendre tout de suite.
    if (ecart >= 900) { mesures = []; lents = 0; }
    else if (maintenant - debut > 1500 && bloque < 0) {
      lents = ecart > 250 ? lents + 1 : 0;
      if (lents >= 3) sauter();
      else if (!intro) surveiller(ecart);
    }
    humeur += (humeurC - humeur) * (1 - Math.exp(-dt * 1.5));
    var vitesse = 1 + 0.38 * humeur + (intro ? 1.2 : 0);
    tDisque += dt * vitesse; tCiel += dt;
    defilL += (defil - defilL) * (1 - Math.exp(-dt * 6));
    souris.x += (souris.cx - souris.x) * (1 - Math.exp(-dt * 3));
    souris.y += (souris.cy - souris.y) * (1 - Math.exp(-dt * 3));
    dessiner(maintenant);
  }
  // l'appareil suit ? plus de pixels. Il peine ? moins de pixels, puis 30 images par seconde, puis une image fixe
  function surveiller(ecart) {
    mesures.push(ecart);
    var n = decisions < 4 ? 12 : 36;               // les premières décisions vont vite
    if (mesures.length < n) return;
    mesures.sort(function (a, b) { return a - b; });
    var med = mesures[n >> 1], budget = 1000 / cadence; mesures = []; decisions++;
    if (med > budget * 1.45) {
      monter = false;
      if (niv < NIV.length - 1) { niv++; taille(); return; }
      if (cadence > 30) { cadence = 30; return; }
      passerFixe(); return;
    }
    if (monter && med <= budget * 1.12 && niv > 0) { niv--; taille(); }
  }
  function sauter() {
    monter = false; mesures = []; lents = 0;
    if (niv >= NIV.length - 1) { passerFixe(); return; }
    niv = Math.min(NIV.length - 1, niv + 2); taille();
  }
  function lancer() { if (!raf && !fixe && !document.hidden) { dernier = 0; debut = performance.now(); raf = requestAnimationFrame(image); } }
  function arreter() { if (raf) cancelAnimationFrame(raf); raf = 0; }
  function passerFixe() { fixe = true; window.TN.actif = false; arreter(); intro = null; revele = null; eclatIntro = 1; racine.setAttribute('data-tn', 'fixe'); dessiner(); }

  /* ---------- ce que la page peut demander ---------- */
  function sortir() {
    if (!attente && !intro) return;
    attente = false; intro = null; eclatIntro = 1;
    if (fixe) { dessiner(); return; }
    revele = performance.now();
  }
  window.TN = {
    actif: !fixe,
    // le résultat net de la dernière séance, en dollars
    humeur: function (net) {
      humeurC = Math.tanh((+net || 0) / 120);
      if (fixe) { humeur = humeurC; dessiner(); }
    },
    plonger: function (ms) {
      if (fixe) { sortir(); return; }
      attente = true; eclatIntro = 0; intro = { t0: performance.now(), ms: ms || 2600 };
    },
    sortir: sortir,
    regler: function (o) { regle = o || {}; if (fixe) dessiner(); },
    etat: function () { return { niveau: niv, cadence: cadence, fixe: fixe, toile: toile.width + 'x' + toile.height }; },
    figer: function (u) { intro = u == null ? null : { t0: 0, ms: 1, fige: u }; eclatIntro = 1; }   // test : une image de l'intro
  };
  // si la page ne demande rien (données introuvables…), on ne reste pas dans le noir
  if (attente) setTimeout(function () { if (attente && !intro) sortir(); }, 5000);

  /* ---------- les écouteurs ---------- */
  var rz = 0;
  addEventListener('resize', function () { clearTimeout(rz); rz = setTimeout(function () { taille(); lireDefil(); lireAncre(); if (fixe) dessiner(); }, 120); });
  addEventListener('scroll', lireDefil, { passive: true });
  if (!fixe) {
    addEventListener('pointermove', function (e) {
      if (e.pointerType === 'touch') return;
      souris.cx = cl(e.clientX / innerWidth * 2 - 1, -1, 1); souris.cy = cl(e.clientY / innerHeight * 2 - 1, -1, 1);
    }, { passive: true });
    document.addEventListener('mouseleave', function () { souris.cx = 0; souris.cy = 0; });
    var b0 = null;
    addEventListener('deviceorientation', function (e) {
      if (e.gamma == null || e.beta == null) return;
      if (b0 == null) b0 = e.beta;
      souris.cx = cl(e.gamma / 28, -1, 1); souris.cy = cl((e.beta - b0) / 28, -1, 1);
    }, { passive: true });
  }
  document.addEventListener('visibilitychange', function () { if (document.hidden) arreter(); else lancer(); });
  toile.addEventListener('webglcontextlost', function (ev) { ev.preventDefault(); arreter(); racine.removeAttribute('data-tn'); window.TN.actif = false; sortir(); });

  taille(); lireDefil(); defilL = defil;
  racine.setAttribute('data-tn', fixe ? 'fixe' : 'anime');
  if (fixe) { eclatIntro = 1; attente = false; dessiner(); [800, 2500].forEach(function (ms) { setTimeout(function () { lireAncre(); dessiner(); }, ms); }); }
  else { if (!attente) revele = performance.now(); lancer(); }
})();
