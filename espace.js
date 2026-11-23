/* Road to 5 Live : le journal dans l'espace (23/11 au soir).

   Tout le journal vit autour d'un trou noir :
   - le trou noir est calculé rayon par rayon sur la carte graphique (WebGL, métrique de Schwarzschild, unité = le rayon
     de l'horizon) : la lumière se courbe, le disque d'accrétion violet et bleu tourne (Kepler), le côté qui vient vers
     nous brille plus (Doppler), deux jets partent des pôles ;
   - chaque trade est une étoile posée sur le disque (verte si gain, rouge si perte, la taille suit le montant), elle tourne
     avec lui et la lumière de celles qui passent derrière revient par-dessus : on la survole, on clique, le trade s'ouvre ;
   - chaque partie du journal est une fenêtre de verre posée à sa place autour du trou noir : la caméra vole de l'une à
     l'autre en plongeant près de l'horizon (molette dans le vide, touches 1 à 7, flèches) ;
   - en partant, les chiffres de la fenêtre sont aspirés vers le trou noir ; à l'arrivée, ils en ressortent ;
   - le trou noir grossit avec le solde ; une bonne séance fait jaillir les jets ;
   - l'intro : on arrive de très loin, le trou noir grossit pendant que le solde compte, éruption, plongée, et le journal
     s'ouvre.
   Sans WebGL ou avec le mouvement réduit : la page d'avant, qui défile, avec un trou noir fixe.
   Test : ?tn=0 à 4 bloque un niveau de qualité, ?tn=fixe une image fixe. */
(function () {
  'use strict';
  var racine = document.documentElement;
  var toile = document.getElementById('trounoir');
  var vit = document.getElementById('vitesse');
  var esp = document.getElementById('espace');
  var rien = function () {};
  window.ESP = { actif: false, aller: rien, intro: function (o) { if (o && o.fin) o.fin(); }, arriver: rien, projeter: null, surFrame: rien, station: 'bal' };
  window.TN = { actif: false, humeur: rien, plonger: rien, sortir: rien };
  if (!toile || !esp) return;
  var mm = function (q) { return !!(window.matchMedia && window.matchMedia(q).matches); };
  var reduit = mm('(prefers-reduced-motion: reduce)');
  var param = (location.search.match(/[?&]tn=([a-z0-9]+)/) || [])[1] || '';
  var gl = null;
  try {
    var opts = { alpha: false, antialias: false, depth: false, stencil: false, premultipliedAlpha: false, preserveDrawingBuffer: false, powerPreference: 'high-performance' };
    gl = toile.getContext('webgl', opts) || toile.getContext('experimental-webgl', opts);
  } catch (e) { gl = null; }
  var trop_petit = innerWidth < 900 || mm('(pointer: coarse)');
  if (!gl || reduit || trop_petit || param === 'plat') { racine.setAttribute('data-esp', 'plat'); return; }

  var NTR = 64;
  /* ---------------------------------------------------------------- le dessin ---- */
  var VS = 'attribute vec2 a_p; void main() { gl_Position = vec4(a_p, 0.0, 1.0); }';
  var FS = [
    '#ifdef GL_FRAGMENT_PRECISION_HIGH',
    'precision highp float;',
    '#else',
    'precision mediump float;',
    '#endif',
    'uniform vec2 u_res;',
    'uniform float u_t;',          // le temps du disque
    'uniform float u_ciel;',       // le temps réel (étoiles, jets)
    'uniform vec3 u_cam;',         // distance (unités du journal), hauteur au-dessus du disque, tour
    'uniform float u_roulis;',
    'uniform vec2 u_centre;',      // où est le trou noir à l'écran (0 à 1, depuis le bas à gauche)
    'uniform float u_zoom;',
    'uniform float u_masse;',      // > 1 : le trou noir est plus gros
    'uniform float u_humeur;',
    'uniform float u_eclat;',
    'uniform float u_jet;',        // la force des jets
    'uniform float u_flash;',
    'uniform float u_pas;',
    'uniform float u_pasr;',
    'uniform float u_oct;',
    'uniform float u_fil;',
    'uniform vec4 u_tr[' + NTR + '];',  // les trades : rayon, angle de départ, taille, sorte (+1 gain, -1 perte, 0 nul)
    'uniform float u_ntr;',
    'uniform float u_hov;',        // le trade survolé (-1 : aucun)
    'uniform float u_trt;',        // le temps des étoiles-trades (elles tournent lentement)
    'const float PI = 3.14159265;',
    'const float RIN = 3.0;',
    'const float ROUT = 15.0;',
    'float h12(vec2 p) { vec3 q = fract(vec3(p.xyx) * 0.1031); q += dot(q, q.yzx + 33.33); return fract((q.x + q.y) * q.z); }',
    'float h13(vec3 q) { q = fract(q * 0.1031); q += dot(q, q.zyx + 31.32); return fract((q.x + q.y) * q.z); }',
    'vec3 h33(vec3 q) { q = fract(q * vec3(0.1031, 0.1030, 0.0973)); q += dot(q, q.yxz + 33.33); return fract((q.xxy + q.yxx) * q.zyx); }',
    'float bruitP(vec2 p, float P) {',
    '  vec2 i = floor(p), f = fract(p), u = f * f * (3.0 - 2.0 * f);',
    '  float y0 = mod(i.y, P), y1 = mod(i.y + 1.0, P);',
    '  return mix(mix(h12(vec2(i.x, y0)), h12(vec2(i.x + 1.0, y0)), u.x), mix(h12(vec2(i.x, y1)), h12(vec2(i.x + 1.0, y1)), u.x), u.y);',
    '}',
    'float fbmP(vec2 p, float P) { float s = 0.0, a = 0.55; for (int k = 0; k < 4; k++) { if (float(k) >= u_oct) break; s += a * bruitP(p, P); p = p * 2.0 + vec2(1.7, 0.0); P *= 2.0; a *= 0.5; } return s; }',
    'float bruit3(vec3 p) {',
    '  vec3 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);',
    '  return mix(mix(mix(h13(i), h13(i + vec3(1.0, 0.0, 0.0)), f.x), mix(h13(i + vec3(0.0, 1.0, 0.0)), h13(i + vec3(1.0, 1.0, 0.0)), f.x), f.y),',
    '             mix(mix(h13(i + vec3(0.0, 0.0, 1.0)), h13(i + vec3(1.0, 0.0, 1.0)), f.x), mix(h13(i + vec3(0.0, 1.0, 1.0)), h13(i + vec3(1.0, 1.0, 1.0)), f.x), f.y), f.z);',
    '}',
    'float fbm3(vec3 p) { float s = 0.0, a = 0.5; for (int k = 0; k < 4; k++) { s += a * bruit3(p); p = p * 2.03 + vec3(3.1, 1.7, 5.3); a *= 0.5; } return s; }',
    // la chaleur du disque : violet profond, violet électrique, bleu glacier, blanc bleuté
    'vec3 rampe(float t) {',
    '  t = clamp(t, 0.0, 1.7);',
    '  vec3 c = mix(vec3(0.13, 0.03, 0.30), vec3(0.50, 0.20, 1.0), smoothstep(0.0, 0.5, t));',
    '  c = mix(c, vec3(0.32, 0.62, 1.0), smoothstep(0.45, 0.88, t));',
    '  return mix(c, vec3(0.86, 0.93, 1.0), smoothstep(0.92, 1.5, t));',
    '}',
    'float matiere(float r, float th) {',
    '  float om = 5.4 * pow(r, -1.5), oref = 0.367, T = 16.0, P = 30.0;',
    '  float f1 = fract(u_t / T), f2 = fract(u_t / T + 0.5), w1 = 1.0 - abs(2.0 * f1 - 1.0);',
    '  float a0 = th - oref * u_t, x = r * 1.8;',
    '  float n1 = fbmP(vec2(x, (a0 - (om - oref) * f1 * T) / (2.0 * PI) * P), P);',
    '  float n2 = fbmP(vec2(x + 41.0, (a0 - (om - oref) * f2 * T) / (2.0 * PI) * P), P);',
    '  float n = mix(n2, n1, w1);',
    '  float anneaux = 0.5 + 0.5 * sin(r * 7.0 + n * 5.0);',
    '  float fils = pow(0.5 + 0.5 * sin(r * 14.0 + n * 11.0), 6.0) * smoothstep(0.22, 0.6, n);',
    '  return clamp(n * 1.35 - 0.2, 0.0, 1.0) * (0.5 + 0.4 * anneaux) + u_fil * 0.6 * fils;',
    '}',
    // le ciel : une nébuleuse violette et bleue, des étoiles bleutées
    'vec3 ciel(vec3 d) {',
    '  float n = fbm3(d * 1.7 + 4.0), n2 = fbm3(d * 4.3 + 11.0), n3 = fbm3(d * 2.6 - 7.0);',
    '  vec3 neb = mix(vec3(0.30, 0.08, 0.55), vec3(0.06, 0.20, 0.55), smoothstep(0.35, 0.65, n3));',
    '  vec3 c = neb * pow(n, 3.0) * 0.42 * (0.35 + 1.2 * n2);',
    '  float px = u_zoom / u_res.y;',
    '  for (int k = 0; k < 3; k++) {',
    '    float fk = float(k), s = 26.0 + fk * 30.0;',
    '    vec3 p = d * s, id = floor(p), h = h33(id + fk * 31.0);',
    '    vec3 ctr = id + 0.5 + (h - 0.5) * 0.7;',
    '    float dd = length(p - ctr), ta = max(0.025 + 0.03 * h.y, px * s * 1.2);',
    '    float b = smoothstep(ta, 0.0, dd) + 0.12 * smoothstep(ta * 3.0, 0.0, dd);',
    '    float tw = 0.7 + 0.3 * sin(u_ciel * (0.7 + 2.2 * h.z) + h.y * 50.0);',
    '    c += mix(vec3(0.85, 0.9, 1.0), vec3(0.7, 0.6, 1.0), h.z) * b * step(0.9 + fk * 0.025, h.x) * tw * (0.85 - fk * 0.2);',
    '  }',
    '  return c;',
    '}',
    // une étoile-trade sur le disque
    'vec3 etoiles(vec3 hit) {',
    '  vec3 c = vec3(0.0);',
    '  for (int i = 0; i < ' + NTR + '; i++) {',
    '    if (float(i) >= u_ntr) break;',
    '    vec4 s = u_tr[i];',
    '    float th = s.y + u_trt * 1.6 * pow(s.x, -1.5);',
    '    vec2 sp = s.x * vec2(cos(th), sin(th));',
    '    vec2 dv = hit.xz - sp;',
    '    float d2 = dot(dv, dv), sz = s.z;',
    '    float hv = 1.0 - step(0.5, abs(float(i) - u_hov));',
    '    sz *= 1.0 + 0.6 * hv;',
    '    float e = exp(-d2 / (sz * sz * 0.16)) * 2.6 + exp(-d2 / (sz * sz)) * 0.5;',
    '    vec3 col = s.w > 0.5 ? vec3(0.35, 1.0, 0.62) : (s.w < -0.5 ? vec3(1.0, 0.32, 0.48) : vec3(0.92, 0.92, 1.0));',
    '    float anneau = hv * exp(-pow(sqrt(d2) - sz * 1.6, 2.0) / (sz * sz * 0.03)) * (0.8 + 0.2 * sin(u_ciel * 8.0));',
    '    c += col * (e + 1.4 * anneau);',
    '  }',
    '  return c;',
    '}',
    'void main() {',
    '  vec2 uv = (gl_FragCoord.xy - u_centre * u_res) / u_res.y;',
    '  float cr = cos(u_roulis), sr = sin(u_roulis);',
    '  uv = vec2(cr * uv.x - sr * uv.y, sr * uv.x + cr * uv.y);',
    '  float D = u_cam.x / u_masse, el = u_cam.y, az = u_cam.z;',
    '  vec3 pos = D * vec3(cos(el) * sin(az), sin(el), cos(el) * cos(az));',
    '  vec3 fw = normalize(-pos), rt = normalize(cross(fw, vec3(0.0, 1.0, 0.0))), up = cross(rt, fw);',
    '  vec3 vel = normalize(fw + (uv.x * rt + uv.y * up) * u_zoom);',
    '  vec3 col = vec3(0.0), jet = vec3(0.0);',
    '  float opa = 0.0, rmin = 1e4;',
    '  bool avale = false, loin = false;',
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
    // les jets : deux colonnes de lumière le long de l'axe, qui montent en ondulant
    '      if (u_jet > 0.004) {',
    '        float ay = abs(pos.y), rho2 = pos.x * pos.x + pos.z * pos.z;',
    '        float wj = 0.32 + 0.085 * ay;',
    '        float ej = exp(-rho2 / (wj * wj)) * smoothstep(1.2, 2.8, ay) * exp(-ay * 0.05);',
    '        float nz = 0.5 + 0.5 * sin(ay * 1.6 - u_ciel * 7.0 + 2.0 * sin(ay * 0.5 + u_ciel));',
    '        float core = exp(-rho2 / (wj * wj * 0.12));',
    '        jet += (1.0 - opa) * (vec3(0.45, 0.35, 1.0) * ej * (0.4 + 0.8 * nz) + vec3(0.75, 0.9, 1.0) * core * ej * 1.2) * dt;',
    '      }',
    '      if (prev.y * pos.y < 0.0) {',
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
    '          float te = pow(flux, 0.3) * mix(1.0, g, 0.6) * (0.72 + 0.5 * m) * (0.9 + 0.2 * u_humeur);',
    '          float a = clamp(bord * (0.3 + 0.7 * m) * (0.5 + 0.5 * min(flux, 1.0)), 0.0, 0.95);',
    '          col += (1.0 - opa) * (rampe(te) * I * 1.75 * a);',
    '          opa += (1.0 - opa) * a;',
    '        }',
    '        if (rh > 2.5 && rh < 16.5 && u_ntr > 0.5) col += (1.0 - opa * 0.6) * etoiles(hit);',
    '      }',
    '      if (rr < 1.0) { avale = true; break; }',
    '      if (rn > 42.0 && dot(pos, vel) > 0.0) break;',
    '      if (opa > 0.985) break;',
    '    }',
    '  }',
    '  if (!avale) {',
    '    col += (1.0 - opa) * ciel(normalize(vel));',
    '    float g = max(rmin - 1.5, 0.0);',
    '    col += vec3(0.55, 0.5, 1.0) * (0.34 * exp(-g * 6.0) + 0.07 * exp(-g * 0.8)) * (1.0 - 0.6 * opa);',
    '  }',
    '  col += jet * u_jet * 0.55;',
    '  col *= u_eclat * (1.0 + 0.3 * u_humeur);',
    '  col += u_flash * vec3(0.62, 0.55, 1.0);',
    '  col = vec3(1.0) - exp(-col * 1.3);',
    '  vec2 q = gl_FragCoord.xy / u_res - 0.5;',
    '  col *= 1.0 - 0.75 * dot(q, q);',
    '  col += vec3(0.016, 0.012, 0.04) * (1.0 - col);',
    '  col += (h12(gl_FragCoord.xy + fract(u_ciel) * 61.0) - 0.5) / 255.0;',
    '  gl_FragColor = vec4(col, 1.0);',
    '}'
  ].join('\n');

  function shader(type, src) {
    var s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) { if (window.console) console.warn('espace', gl.getShaderInfoLog(s)); return null; }
    return s;
  }
  var vsh = shader(gl.VERTEX_SHADER, VS), fsh = shader(gl.FRAGMENT_SHADER, FS);
  if (!vsh || !fsh) { racine.setAttribute('data-esp', 'plat'); return; }
  var prog = gl.createProgram(); gl.attachShader(prog, vsh); gl.attachShader(prog, fsh); gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) { racine.setAttribute('data-esp', 'plat'); return; }
  gl.useProgram(prog);
  var buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  var ap = gl.getAttribLocation(prog, 'a_p'); gl.enableVertexAttribArray(ap); gl.vertexAttribPointer(ap, 2, gl.FLOAT, false, 0, 0);
  var U = {};
  ['u_res', 'u_t', 'u_ciel', 'u_cam', 'u_roulis', 'u_centre', 'u_zoom', 'u_masse', 'u_humeur', 'u_eclat', 'u_jet', 'u_flash', 'u_pas', 'u_pasr', 'u_oct', 'u_fil', 'u_tr', 'u_ntr', 'u_hov', 'u_trt']
    .forEach(function (n) { U[n] = gl.getUniformLocation(prog, n); });
  racine.setAttribute('data-esp', '3d');

  /* ------------------------------------------------------------ la qualité ---- */
  var NIV = [{ q: 1, pas: 160, pasr: 0.05, max: 4000000, oct: 4, fil: 1 }, { q: 0.85, pas: 140, pasr: 0.06, max: 2200000, oct: 4, fil: 1 },
    { q: 0.66, pas: 120, pasr: 0.07, max: 1200000, oct: 3, fil: 0.85 }, { q: 0.5, pas: 100, pasr: 0.085, max: 650000, oct: 3, fil: 0.6 },
    { q: 0.36, pas: 84, pasr: 0.1, max: 340000, oct: 3, fil: 0.4 }];
  if (param.indexOf('e') >= 0) NIV = [{ q: 0.12, pas: 44, pasr: 0.18, max: 50000, oct: 2, fil: 0.4 }];   // test : très léger
  var bloque = /\d/.test(param) ? Math.min(+param.replace(/\D/g, '')[0], NIV.length - 1) : param.indexOf('e') >= 0 ? 0 : -1;
  var niv = bloque >= 0 ? bloque : 2, monter = bloque < 0, cadence = 60;
  var fixe = param.indexOf('f') >= 0;
  var W = innerWidth, H = innerHeight;
  function taille() {
    W = innerWidth; H = innerHeight;
    var dpr = Math.min(window.devicePixelRatio || 1, 3), N = NIV[niv];
    var w = W * dpr, h = H * dpr, q = Math.min(N.q, Math.sqrt(N.max / (w * h)));
    var tw = Math.max(64, Math.round(w * q)), th = Math.max(64, Math.round(h * q));
    if (toile.width !== tw || toile.height !== th) { toile.width = tw; toile.height = th; }
    gl.viewport(0, 0, tw, th);
    if (vit) { vit.width = Math.round(W * Math.min(dpr, 2) * 0.5); vit.height = Math.round(H * Math.min(dpr, 2) * 0.5); }
  }

  /* --------------------------------------------------------- petits outils ---- */
  var cl = function (v, a, b) { return Math.max(a, Math.min(b, v)); };
  var mix = function (a, b, k) { return a + (b - a) * k; };
  var lisse = function (a, b, x) { var t = cl((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
  var eio = function (x) { return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
  var eout = function (x) { return 1 - Math.pow(1 - x, 3); };
  var v3 = function (x, y, z) { return [x, y, z]; };
  var add = function (a, b) { return [a[0] + b[0], a[1] + b[1], a[2] + b[2]]; };
  var sub = function (a, b) { return [a[0] - b[0], a[1] - b[1], a[2] - b[2]]; };
  var mul = function (a, k) { return [a[0] * k, a[1] * k, a[2] * k]; };
  var dot = function (a, b) { return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]; };
  var cross = function (a, b) { return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]; };
  var norm = function (a) { var l = Math.sqrt(dot(a, a)) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };
  function angle(a, b, k) { var d = ((b - a + Math.PI) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI) - Math.PI; return a + d * k; }

  /* ------------------------------------------------------------ les stations ---- */
  // la pose d'une caméra : D (distance, unités du journal), el (hauteur), az (tour), roulis, zoom, cx/cy (le trou noir à l'écran)
  // et la fenêtre : de quel côté, sa largeur
  var IDS = ['bal', 'ind', 'acc', 'log', 'tr', 'st', 'wt'];
  var ST = {
    bal: { D: 24, el: 0.11, az: 0.0, roulis: -0.16, zoom: 0.64, cx: 0.30, cy: 0.52, cote: 'd', large: 0.5 },
    ind: { D: 33, el: 0.36, az: 0.95, roulis: -0.06, zoom: 0.78, cx: 0.37, cy: 0.5, cote: 'd', large: 0.3 },
    acc: { D: 23, el: 0.05, az: 1.9, roulis: 0.14, zoom: 0.62, cx: 0.72, cy: 0.5, cote: 'g', large: 0.5 },
    log: { D: 25, el: 0.24, az: 2.85, roulis: -0.12, zoom: 0.66, cx: 0.27, cy: 0.54, cote: 'd', large: 0.52 },
    tr: { D: 24, el: -0.1, az: 3.8, roulis: 0.18, zoom: 0.62, cx: 0.74, cy: 0.48, cote: 'g', large: 0.55 },
    st: { D: 27, el: 0.42, az: 4.75, roulis: -0.1, zoom: 0.7, cx: 0.25, cy: 0.5, cote: 'd', large: 0.6 },
    wt: { D: 25, el: 0.14, az: 5.6, roulis: 0.12, zoom: 0.64, cx: 0.75, cy: 0.52, cote: 'g', large: 0.52 }
  };
  var HAUT = 92, BAS = 112, MARGE = 44, PROF = 6;   // la fenêtre : marge en haut et en bas, sa profondeur devant la caméra
  function poseDe(id) { var s = ST[id]; return { D: s.D, el: s.el, az: s.az, roulis: s.roulis, zoom: s.zoom, cx: s.cx, cy: s.cy }; }
  function base(p) {
    var C = [p.D * Math.cos(p.el) * Math.sin(p.az), p.D * Math.sin(p.el), p.D * Math.cos(p.el) * Math.cos(p.az)];
    var fw = norm(mul(C, -1)), rt = norm(cross(fw, [0, 1, 0])), up = cross(rt, fw);
    return { C: C, fw: fw, rt: rt, up: up };
  }
  // la place de chaque fenêtre dans l'espace (calculée depuis sa station, pour qu'elle y soit nette à l'échelle 1)
  var panneaux = {};
  function placer() {
    IDS.forEach(function (id) {
      var el = document.getElementById(id); if (!el) return;
      var s = ST[id], p = poseDe(id), B = base(p);
      var pw = Math.round(Math.min(1060, Math.max(380, W * s.large))), ph = Math.round(H - HAUT - BAS);
      var x0 = s.cote === 'd' ? W - MARGE - pw : MARGE, y0 = HAUT;
      el.style.width = pw + 'px'; el.style.height = ph + 'px';
      var c = Math.cos(p.roulis), sn = Math.sin(p.roulis);
      var Rw = add(mul(B.rt, c), mul(B.up, sn)), Uw = add(mul(B.rt, -sn), mul(B.up, c));
      // le coin en haut à gauche de la fenêtre, à l'écran → dans l'espace
      var ux = (x0 - p.cx * W) / H, uy = ((H - y0) - p.cy * H) / H;
      var uxr = c * ux - sn * uy, uyr = sn * ux + c * uy;
      var dir = add(B.fw, mul(add(mul(B.rt, uxr), mul(B.up, uyr)), p.zoom));
      var q = p.zoom * PROF / H;                     // unités d'espace par pixel, à cette profondeur
      panneaux[id] = { el: el, P: add(B.C, mul(dir, PROF)), R: Rw, U: Uw, q: q, w: pw, h: ph, x0: x0, y0: y0, vu: null };
    });
  }

  /* ------------------------------------------------- la caméra et le vol ---- */
  var cur = 'bal', pose = poseDe('bal'), vol = null;
  var souris = { x: 0, y: 0, cx: 0, cy: 0 };
  var masse = 1, masseC = 1, jet = 0.1, jetBase = 0.1, flash = 0, warp = 0;
  var humeur = 0, humeurC = 0, tDisque = 0, tCiel = 0, tTr = 0, eclat = 0;
  var enIntro = false, introE = null;
  function poseVol(u) {
    var a = vol.de, b = vol.vers, e = eio(u);
    var p = { el: mix(a.el, b.el, e), az: angle(a.az, b.az, e), roulis: mix(a.roulis, b.roulis, e), zoom: mix(a.zoom, b.zoom, e), cx: mix(a.cx, b.cx, e), cy: mix(a.cy, b.cy, e) };
    var Dm = mix(a.D, b.D, e), plonge = Math.pow(Math.sin(Math.PI * u), 1.4);
    p.D = Dm - (Dm - 4.6 * masse) * plonge;      // on plonge près de l'horizon au milieu du vol
    p.el += 0.18 * Math.sin(Math.PI * u) * (b.el >= a.el ? 1 : -1);
    return p;
  }
  function aller(id, ms) {
    if (!ST[id]) return;
    if (id === cur && !vol) { aspirer(cur, false); return; }
    var de = vol ? poseVol(Math.min(1, (performance.now() - vol.t0) / vol.ms)) : pose;
    var ancien = cur;
    cur = id; window.ESP.station = id;
    vol = { de: de, vers: poseDe(id), t0: performance.now(), ms: ms || 1900, ancien: ancien, arrive: false };
    racine.setAttribute('data-vol', '1');
    aspirer(ancien, true);
    IDS.forEach(function (k) { if (panneaux[k]) panneaux[k].el.classList.toggle('ici', false); });
    if (id === 'bal' && derniereSeance > 60) eruption(0.9);
  }

  /* ---------------------------------------------- les fenêtres en 3D (CSS) ---- */
  // un point de l'espace vu par une pose : x, y à l'écran (px), profondeur
  function cam(p, avecSouris) {
    var pp = p;
    if (avecSouris) pp = { D: p.D, el: p.el + souris.y * 0.05, az: p.az + souris.x * 0.14, roulis: p.roulis, zoom: p.zoom, cx: p.cx, cy: p.cy };
    var B = base(pp); B.p = pp; B.F = H / pp.zoom; B.c = Math.cos(pp.roulis); B.s = Math.sin(pp.roulis);
    B.ox = pp.cx * W; B.oy = (1 - pp.cy) * H;
    return B;
  }
  function versCam(B, w) {   // un vecteur de l'espace dans le repère de l'écran (x droite, y haut, z profondeur)
    var x = dot(w, B.rt), y = dot(w, B.up), z = dot(w, B.fw);
    return [B.c * x + B.s * y, -B.s * x + B.c * y, z];
  }
  function projeter(B, X) {
    var v = versCam(B, sub(X, B.C));
    if (v[2] < 0.05) return null;
    return { x: B.ox + v[0] / v[2] * B.F, y: B.oy - v[1] / v[2] * B.F, z: v[2], k: B.F / v[2] };
  }
  function poserPanneaux(B, repos) {
    esp.style.perspective = B.F.toFixed(2) + 'px';
    esp.style.perspectiveOrigin = B.ox.toFixed(1) + 'px ' + B.oy.toFixed(1) + 'px';
    var s = B.F / PROF;            // pixels CSS par unité d'espace : la fenêtre de la station est à l'échelle 1 en arrivant
    IDS.forEach(function (id) {
      var P = panneaux[id]; if (!P) return;
      if (repos) {
        if (id === cur) { P.el.style.transform = 'translate(' + P.x0 + 'px,' + P.y0 + 'px)'; P.el.style.visibility = 'visible'; P.vu = 'ici'; }
        else if (P.vu !== 'cache') { P.el.style.visibility = 'hidden'; P.vu = 'cache'; }
        return;
      }
      // P.P est le coin en haut à gauche ; les deux bords de la fenêtre, un pixel à la fois
      var a = versCam(B, sub(P.P, B.C)), ex = versCam(B, mul(P.R, P.q)), ey = versCam(B, mul(P.U, -P.q));
      var zMin = Math.min(a[2], a[2] + ex[2] * P.w, a[2] + ey[2] * P.h, a[2] + ex[2] * P.w + ey[2] * P.h);
      if (zMin < 0.6) { if (P.vu !== 'cache') { P.el.style.visibility = 'hidden'; P.vu = 'cache'; } return; }
      var X = function (v) { return [v[0] * s, -v[1] * s, -v[2] * s]; };
      var EX = X(ex), EY = X(ey), EZ = norm(cross(EX, EY));
      var T = [B.ox + a[0] * s, B.oy - a[1] * s, B.F - a[2] * s];
      P.el.style.transform = 'matrix3d(' + [EX[0], EX[1], EX[2], 0, EY[0], EY[1], EY[2], 0, EZ[0], EZ[1], EZ[2], 0, T[0], T[1], T[2], 1].map(function (n) { return +n.toFixed(5); }).join(',') + ')';
      if (P.vu !== 'vu') { P.el.style.visibility = 'visible'; P.vu = 'vu'; }
    });
  }

  /* ----------------------------------------------- les chiffres aspirés ---- */
  var SEL = '.h-acc,.h-bal,.h-sub,.h-mass,.intro,.kp,.eqbox,.panel>h2,.day,.row,.st,.kv,.bar,.sub,.fl,.grid>*,.lead,.chk,.gauge,.wk,.card,.ind-l>*,.ind-big,.ind-ch,.note,.det,.tab,.tabs,p';
  function aspirer(id, partir) {
    var P = panneaux[id]; if (!P || !P.el.animate) return;
    var bh = { x: ST[id].cx * W, y: (1 - ST[id].cy) * H };
    var vue = P.el.getBoundingClientRect();
    var els = Array.prototype.slice.call(P.el.querySelectorAll(SEL)).filter(function (e) {
      if (e.closest('.ind-l') && !e.parentElement.classList.contains('ind-l')) return false;
      var r = e.getBoundingClientRect();
      return r.width > 2 && r.height > 2 && r.bottom > vue.top && r.top < vue.bottom && r.width < vue.width * 1.01;
    });
    // pas les éléments dont un parent est déjà animé
    els = els.filter(function (e) { return !els.some(function (o) { return o !== e && o.contains(e); }); }).slice(0, 46);
    els.forEach(function (e, i) {
      var r = e.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2;
      var dx = bh.x - cx, dy = bh.y - cy, d = Math.sqrt(dx * dx + dy * dy) || 1;
      var rot = (dx > 0 ? -1 : 1) * (40 + 30 * Math.random());
      var loin = 'translate(' + dx.toFixed(0) + 'px,' + dy.toFixed(0) + 'px) rotate(' + rot.toFixed(0) + 'deg) scale(0.06,0.02)';
      var mi = 'translate(' + (dx * 0.35 - dy * 0.12).toFixed(0) + 'px,' + (dy * 0.35 + dx * 0.12).toFixed(0) + 'px) rotate(' + (rot * 0.3).toFixed(0) + 'deg) scale(' + (1 + 220 / d).toFixed(2) + ',0.55)';
      var k = partir ? [{ transform: 'none', opacity: 1, filter: 'blur(0)' }, { transform: mi, opacity: 0.9, filter: 'blur(1.5px)', offset: 0.45 }, { transform: loin, opacity: 0, filter: 'blur(6px)' }]
        : [{ transform: loin, opacity: 0, filter: 'blur(6px)' }, { transform: mi, opacity: 0.85, filter: 'blur(2px)', offset: 0.55 }, { transform: 'none', opacity: 1, filter: 'blur(0)' }];
      var t = (partir ? i * 9 : (els.length - i) * 0 + i * 16);
      try {
        var a = e.animate(k, { duration: partir ? 620 : 760, delay: t, easing: partir ? 'cubic-bezier(.55,0,.9,.4)' : 'cubic-bezier(.12,.7,.25,1)', fill: 'both' });
        a.onfinish = function () { if (!partir) a.cancel(); };
        if (partir) setTimeout(function () { a.cancel(); }, 2600);
      } catch (x) {}
    });
  }

  // où est l'ombre du trou noir à l'écran : les fils lumineux (rubans.js) y disparaissent (masque CSS)
  var ombreVue = { x: -1, y: -1, r: -1 };
  function ombre(B) {
    var Dn = B.p.D / masse, r = Math.tan(Math.asin(Math.min(0.99, 2.598 / Math.max(Dn, 2.7)))) * B.F;
    if (Math.abs(B.ox - ombreVue.x) + Math.abs(B.oy - ombreVue.y) + Math.abs(r - ombreVue.r) < 0.6) return;
    ombreVue = { x: B.ox, y: B.oy, r: r };
    var st = racine.style;
    st.setProperty('--tn-x', B.ox.toFixed(1) + 'px'); st.setProperty('--tn-y', B.oy.toFixed(1) + 'px'); st.setProperty('--tn-r', r.toFixed(1) + 'px');
  }

  /* ------------------------------------------------ le vent du vol (2D) ---- */
  var vctx = vit ? vit.getContext('2d') : null;
  var rayons = [];
  for (var i = 0; i < 260; i++) rayons.push({ a: Math.random() * Math.PI * 2, r: Math.random(), v: 0.4 + Math.random() * 1.2, l: 0.2 + Math.random() * 0.8, c: Math.random() });
  function vent(dt, bh) {
    if (!vctx) return;
    var w = vit.width, h = vit.height, k = w / W;
    vctx.clearRect(0, 0, w, h);
    if (warp < 0.01) return;
    vctx.save(); vctx.globalCompositeOperation = 'lighter';
    var ox = bh.x * k, oy = bh.y * k, R = Math.hypot(w, h);
    rayons.forEach(function (s) {
      s.r += dt * s.v * (0.6 + 2.4 * warp); if (s.r > 1) { s.r = 0.04 + Math.random() * 0.1; s.a = Math.random() * Math.PI * 2; }
      var r1 = Math.pow(s.r, 1.6) * R, r0 = Math.max(0, r1 - s.l * R * 0.22 * warp);
      var ca = Math.cos(s.a), sa = Math.sin(s.a);
      var g = vctx.createLinearGradient(ox + ca * r0, oy + sa * r0, ox + ca * r1, oy + sa * r1);
      var col = s.c > 0.5 ? '160,140,255' : '130,215,255';
      g.addColorStop(0, 'rgba(' + col + ',0)'); g.addColorStop(1, 'rgba(' + col + ',' + (0.55 * warp * (0.4 + s.r)).toFixed(3) + ')');
      vctx.strokeStyle = g; vctx.lineWidth = (0.6 + 1.6 * s.r) * k * 1.5;
      vctx.beginPath(); vctx.moveTo(ox + ca * r0, oy + sa * r0); vctx.lineTo(ox + ca * r1, oy + sa * r1); vctx.stroke();
    });
    vctx.restore();
  }

  /* ----------------------------------------------------- les étoiles-trades ---- */
  var TR = [], trData = new Float32Array(NTR * 4), hov = -1, derniereSeance = 0;
  function poserTrades(trades) {
    var n = Math.min(trades.length, NTR), L = trades.slice(-n);
    var mx = Math.max.apply(null, L.map(function (t) { return Math.abs(t.pnl_net); }).concat([1]));
    TR = L.map(function (t, k) {
      var u = n > 1 ? k / (n - 1) : 1;
      var r = 13.6 - 9.0 * u;                       // les plus anciens au bord, le dernier près du trou noir
      var th0 = k * 2.39996 + 0.7;
      var sz = 0.2 + 0.36 * Math.sqrt(Math.abs(t.pnl_net) / mx);
      var sorte = t.result_class === 'win' ? 1 : t.result_class === 'loss' ? -1 : (t.pnl_net > 0 ? 1 : t.pnl_net < 0 ? -1 : 0);
      return { t: t, r: r, th0: th0, sz: sz, s: sorte };
    });
    TR.forEach(function (o, i) { trData[i * 4] = o.r; trData[i * 4 + 1] = o.th0; trData[i * 4 + 2] = o.sz; trData[i * 4 + 3] = o.s; });
  }
  // le même calcul que la carte graphique, pour un seul rayon (le pixel sous la souris)
  function lancerRayon(B, px, py) {
    var p = B.p;
    var ux = (px - p.cx * W) / H, uy = ((H - py) - p.cy * H) / H;
    var c = Math.cos(p.roulis), s = Math.sin(p.roulis);
    var uxr = c * ux - s * uy, uyr = s * ux + c * uy;
    var C = mul(B.C, 1 / masse);
    var vel = norm(add(B.fw, mul(add(mul(B.rt, uxr), mul(B.up, uyr)), p.zoom)));
    var pos = C.slice(), hv = cross(pos, vel), h2 = dot(hv, hv), rr = dot(pos, pos);
    var acc = mul(pos, -1.5 * h2 / (rr * rr * Math.sqrt(rr))), coups = [];
    for (var i = 0; i < 200; i++) {
      var dt = cl(0.04 * Math.sqrt(dot(pos, pos)), 0.015, 3), prev = pos.slice();
      vel = add(vel, mul(acc, 0.5 * dt)); pos = add(pos, mul(vel, dt));
      rr = dot(pos, pos); acc = mul(pos, -1.5 * h2 / (rr * rr * Math.sqrt(rr))); vel = add(vel, mul(acc, 0.5 * dt));
      if (prev[1] * pos[1] < 0) {
        var f = prev[1] / (prev[1] - pos[1]), hit = add(prev, mul(sub(pos, prev), f));
        coups.push(hit);
        if (coups.length > 2) break;
      }
      if (rr < 1) break;
      if (rr > 42 * 42 && dot(pos, vel) > 0) break;
    }
    return coups;
  }
  function trouverTrade(px, py) {
    if (!TR.length) return -1;
    var B = cam(pose, true), coups = lancerRayon(B, px, py);
    for (var j = 0; j < coups.length; j++) {
      var h = coups[j], best = -1, bd = 1e9;
      TR.forEach(function (o, i) {
        var th = o.th0 + tTr * 1.6 * Math.pow(o.r, -1.5);
        var dx = h[0] - o.r * Math.cos(th), dz = h[2] - o.r * Math.sin(th), d = Math.sqrt(dx * dx + dz * dz) / Math.max(o.sz, 0.3);
        if (d < bd) { bd = d; best = i; }
      });
      if (bd < 1.5) return best;
    }
    return -1;
  }
  var bulle = document.createElement('div'); bulle.className = 'tr-bulle'; bulle.setAttribute('aria-hidden', 'true'); document.body.appendChild(bulle);
  function montrerBulle(i, x, y) {
    if (i < 0) { bulle.classList.remove('on'); toile.style.cursor = ''; return; }
    var X = window.R5, t = TR[i].t, fr = X && X.LANG === 'fr';
    var cl2 = t.pnl_net > 0 ? 'up' : t.pnl_net < 0 ? 'dn' : '';
    bulle.innerHTML = '<span class="k">#' + t.id + ' · ' + (t.side === 'long' ? 'LONG' : 'SHORT') + ' · ' + (X ? X.dayLabel(t.session_date) : t.session_date) + '</span><b class="' + cl2 + '">' + (X ? X.usd(t.pnl_net, 2, true) : t.pnl_net) + '</b><span class="n">' + (fr ? 'clique pour ouvrir le trade' : 'click to open the trade') + '</span>';
    bulle.style.transform = 'translate(' + Math.round(x + 18) + 'px,' + Math.round(y - 18) + 'px)';
    bulle.classList.add('on');
  }
  var dernierPick = 0;
  function surPanneau(e) { return e.target && e.target.closest && e.target.closest('.panel,.hud,.planete,.top,.keys,.tr-bulle,button,a'); }
  addEventListener('pointermove', function (e) {
    if (e.pointerType === 'touch') return;
    souris.cx = cl(e.clientX / W * 2 - 1, -1, 1); souris.cy = cl(e.clientY / H * 2 - 1, -1, 1);
    var now = performance.now(); if (now - dernierPick < 45 || vol || enIntro) return; dernierPick = now;
    if (surPanneau(e)) { if (hov >= 0) { hov = -1; montrerBulle(-1); } return; }
    hov = trouverTrade(e.clientX, e.clientY);
    montrerBulle(hov, e.clientX, e.clientY);
  }, { passive: true });
  addEventListener('click', function (e) {
    if (enIntro || vol || surPanneau(e)) return;
    var i = trouverTrade(e.clientX, e.clientY); if (i < 0) return;
    var id = TR[i].t.id, X = window.R5; if (!X) return;
    montrerBulle(-1); hov = -1;
    X.go('tr');
    setTimeout(function () { try { X.openTrade(id, true); } catch (x) {} }, 2000);
  });
  document.addEventListener('mouseleave', function () { souris.cx = 0; souris.cy = 0; });

  /* -------------------------------------------- molette, touches, flèches ---- */
  var dernierPas = 0, bordN = 0, bordT = 0;
  function suivant(k) { var i = IDS.indexOf(cur), j = cl(i + k, 0, IDS.length - 1); if (j !== i && window.R5) window.R5.go(IDS[j]); }
  addEventListener('wheel', function (e) {
    if (enIntro) return;
    var now = performance.now();
    var pan = e.target && e.target.closest && e.target.closest('.panel');
    if (pan) {
      // au bout de la fenêtre, on continue de tourner la molette : on part à la suivante
      var bas = pan.scrollTop + pan.clientHeight >= pan.scrollHeight - 2, haut = pan.scrollTop <= 1;
      if ((e.deltaY > 0 && bas) || (e.deltaY < 0 && haut)) {
        if (now - bordT > 700) bordN = 0;
        bordT = now; bordN += Math.min(Math.abs(e.deltaY), 120);
        if (bordN > 420 && !vol && now - dernierPas > 900) { bordN = 0; dernierPas = now; suivant(e.deltaY > 0 ? 1 : -1); }
      } else bordN = 0;
      return;
    }
    e.preventDefault();
    if (vol || now - dernierPas < 700 || Math.abs(e.deltaY) < 8) return;
    dernierPas = now; suivant(e.deltaY > 0 ? 1 : -1);
  }, { passive: false });
  addEventListener('keydown', function (e) {
    if (enIntro || e.metaKey || e.ctrlKey || e.altKey || /INPUT|TEXTAREA|SELECT/.test((document.activeElement || {}).tagName || '')) return;
    if (e.key === 'ArrowRight' || e.key === 'PageDown') { e.preventDefault(); suivant(1); }
    if (e.key === 'ArrowLeft' || e.key === 'PageUp') { e.preventDefault(); suivant(-1); }
  });

  /* ------------------------------------------------ éruption, masse ---- */
  function eruption(k) { jet = Math.max(jet, 0.5 + 0.9 * k); flash = Math.max(flash, 0.08 + 0.12 * k); }
  function regMasse(balance, start) {
    var X = window.R5, M = X && X.M, cible = M && M.target ? M.target : 1250;
    var prog = cl((balance - start) / Math.max(1, cible), -0.6, 1.4);
    return cl(1 + 0.42 * prog, 0.72, 1.6);
  }

  /* ------------------------------------------------------------- l'intro ---- */
  function intro(o) {
    var ov = document.getElementById('boot');
    enIntro = true; racine.classList.add('esp-intro');
    var mFin = regMasse(o.balance, o.start);
    masseC = masse = 0.42;
    var debut = 0, saute = false, fini = false, arrivee = 0;   // le temps de l'intro part de la première image dessinée
    var bal0 = o.start, b = document.getElementById('bootBal'), tx = document.getElementById('bootTxt');
    if (tx) tx.textContent = o.txt || '';
    if (ov) ov.classList.add('on', 'esp');
    var s0 = ST.bal;
    introE = function (now) {
      if (!debut) debut = now;
      var t = (now - debut) / 1000;
      if (saute && !arrivee) arrivee = now;
      var T_PL = 4.25, T_FIN = 5.15;
      if (arrivee) t = Math.max(t, T_FIN + (now - arrivee) / 1000);
      var p = { cx: 0.5, cy: 0.5, zoom: 0.9 };
      if (t < 3.6) {                                     // on arrive de très loin, en tournant
        var k = eout(cl(t / 3.6, 0, 1));
        p.D = mix(190, 34, k); p.az = s0.az - 2.6 * (1 - k) - 0.35; p.el = mix(0.62, 0.17, k); p.roulis = mix(0.7, -0.05, k);
      } else if (t < T_FIN) {                            // la plongée
        var k2 = Math.pow(cl((t - 3.6) / (T_FIN - 3.6), 0, 1), 2.2);
        p.D = mix(34, 2.4 * mFin, k2); p.az = s0.az - 0.35 + 0.5 * k2; p.el = 0.17 - 0.08 * k2; p.roulis = -0.05 - 0.3 * k2;
      } else {                                           // on ressort devant le solde
        var k3 = eout(cl((t - T_FIN) / 1.0, 0, 1)), S = poseDe('bal');
        p = { D: mix(48, S.D, k3), el: S.el, az: S.az, roulis: S.roulis, zoom: S.zoom, cx: S.cx, cy: S.cy };
      }
      // le trou noir grossit pendant que le solde compte
      var km = lisse(0.6, 3.4, t);
      masse = mix(0.42, mFin, km);
      if (b && o.usd) b.textContent = o.usd(bal0 + (o.balance - bal0) * eio(cl((t - 0.6) / 2.8, 0, 1)));
      eclat = lisse(0, 0.9, t) * (t > T_FIN - 0.25 && t < T_FIN ? 1 - lisse(T_FIN - 0.25, T_FIN, t) * 0.9 : 1);
      if (t >= 3.55 && !intro.eru) { intro.eru = 1; eruption(o.net > 0 ? Math.min(1, o.net / 150) + 0.3 : 0.25); }
      warp = t > 3.9 && t < T_FIN ? lisse(3.9, 4.8, t) : t >= T_FIN ? Math.max(0, 1 - (t - T_FIN) * 2.5) : 0;
      if (t >= T_FIN && !intro.ff) { intro.ff = 1; flash = 0.75; if (ov) ov.classList.add('done'); racine.classList.remove('esp-intro'); cur = 'bal'; window.ESP.station = 'bal'; aspirer('bal', false); }
      if (ov && t > 3.0) ov.classList.add('loin');
      pose = p;
      if (t >= T_FIN + 1.0 && !fini) {
        fini = true; enIntro = false; introE = null; warp = 0; masseC = mFin; pose = poseDe('bal');
        if (ov) setTimeout(function () { ov.remove(); }, 400);
        IDS.forEach(function (k) { if (panneaux[k]) panneaux[k].vu = null; });
        posee = false;
        if (o.fin) o.fin();
      }
    };
    var passer = function () { if (!saute) saute = true; };
    if (ov) ov.addEventListener('click', passer);
    addEventListener('keydown', passer, { once: true });
    toile.addEventListener('click', passer, { once: true });
  }
  intro.eru = 0; intro.ff = 0;
  function arriver() {
    var X = window.R5, M = X && X.M;
    if (M) masseC = masse = regMasse(M.balance, M.start);
    var h = (location.hash || '').slice(1);
    cur = ST[h] ? h : 'bal'; window.ESP.station = cur; pose = poseDe(cur); eclat = 0; eclatIn = performance.now();
    if (X) X.markKey(cur);
    posee = false;
    setTimeout(function () { aspirer(cur, false); }, 80);
  }
  var eclatIn = 0;

  /* -------------------------------------------------------------- la boucle ---- */
  var raf = 0, dernier = 0, posee = false, mesures = [], debutB = 0, lents = 0, decisions = 0, cible = 0, pasPrec = null;
  var vs = 1000 / 60, brut = [], precedent = 0, essais = 0;
  var abonnes = [];
  function image(maintenant) {
    raf = requestAnimationFrame(image);
    if (essais < 16) {
      if (precedent) { var d = maintenant - precedent; if (d > 3 && d < 60) brut.push(d); }
      precedent = maintenant; essais++;
      if (essais < 16) return;
      if (brut.length) vs = Math.max(4, Math.min.apply(null, brut));
      dernier = 0; debutB = maintenant;
    }
    var ecart = maintenant - dernier;
    if (dernier && ecart < 0.75 * 1000 / cadence) return;
    var dt = dernier ? Math.min(0.1, ecart / 1000) : 1 / cadence;
    dernier = maintenant;
    if (ecart >= 900) { mesures = []; lents = 0; }
    else if (maintenant - debutB > 1500 && bloque < 0 && !vol && !enIntro) {
      lents = ecart > 250 ? lents + 1 : 0;
      if (lents >= 3) { niv = Math.min(NIV.length - 1, niv + 2); taille(); lents = 0; }
      else surveiller(ecart);
    }
    humeur += (humeurC - humeur) * (1 - Math.exp(-dt * 1.5));
    tDisque += dt * (1 + 0.38 * humeur + (enIntro ? 1.0 : 0) + (vol ? 1.4 * Math.sin(Math.PI * cl((maintenant - vol.t0) / vol.ms, 0, 1)) : 0));
    tCiel += dt; tTr += dt;
    souris.x += (souris.cx - souris.x) * (1 - Math.exp(-dt * 3));
    souris.y += (souris.cy - souris.y) * (1 - Math.exp(-dt * 3));
    if (!enIntro) masse += (masseC - masse) * (1 - Math.exp(-dt * 2));
    jet += (jetBase - jet) * (1 - Math.exp(-dt * 0.9));
    flash *= Math.exp(-dt * 5.5);
    var repos = false;
    if (introE) introE(maintenant);
    else if (vol) {
      var u = cl((maintenant - vol.t0) / vol.ms, 0, 1);
      pose = poseVol(u);
      warp = Math.pow(Math.sin(Math.PI * u), 2);
      flash = Math.max(flash, 0.22 * Math.exp(-Math.pow((u - 0.5) / 0.07, 2)));
      if (u > 0.72 && !vol.arrive) { vol.arrive = true; aspirer(cur, false); }
      if (u >= 1) { vol = null; warp = 0; pose = poseDe(cur); racine.removeAttribute('data-vol'); posee = false; }
      eclat = 1;
    } else {
      eclat = eclatIn ? lisse(0, 900, maintenant - eclatIn) : 1;
      repos = true;
    }
    if (!enIntro || (pose.D < 60)) {
      var B = cam(pose, false);
      if (!repos || !posee) { poserPanneaux(B, repos); posee = repos; if (repos) IDS.forEach(function (k) { if (panneaux[k]) panneaux[k].el.classList.toggle('ici', k === cur); }); }
    }
    var Bs = cam(pose, true);
    dessiner(Bs);
    var bh = { x: Bs.ox, y: Bs.oy };
    window.ESP.foyer = bh;
    ombre(Bs);
    vent(dt, bh);
    for (var i = 0; i < abonnes.length; i++) { try { abonnes[i](Bs, dt, maintenant); } catch (x) {} }
  }
  function surveiller(ecart) {
    mesures.push(ecart);
    var n = decisions < 4 ? 12 : 36;
    if (mesures.length < n) return;
    mesures.sort(function (a, b) { return a - b; });
    var med = mesures[n >> 1], budget = cible || Math.max(1, Math.ceil(0.75 * 1000 / cadence / vs - 0.05)) * vs; mesures = []; decisions++;
    if (pasPrec) {
      var pp = pasPrec; pasPrec = null;
      if (med > pp.med * 0.85) { niv = pp.niv; cadence = pp.cad; taille(); cible = med; monter = true; return; }
    }
    if (med > budget * 1.4) {
      monter = false; pasPrec = { niv: niv, med: med, cad: cadence };
      if (niv < NIV.length - 1) { niv++; taille(); return; }
      if (cadence > 30) { cadence = 30; return; }
      pasPrec = null; return;
    }
    if (monter && med <= budget * 1.12 && niv > 0) { niv--; taille(); }
  }
  function dessiner(B) {
    var p = B.p, N = NIV[niv];
    gl.uniform2f(U.u_res, toile.width, toile.height);
    gl.uniform1f(U.u_t, tDisque);
    gl.uniform1f(U.u_ciel, tCiel);
    gl.uniform3f(U.u_cam, p.D, p.el, p.az);
    gl.uniform1f(U.u_roulis, p.roulis);
    gl.uniform2f(U.u_centre, p.cx, p.cy);
    gl.uniform1f(U.u_zoom, p.zoom);
    gl.uniform1f(U.u_masse, masse);
    gl.uniform1f(U.u_humeur, humeur);
    gl.uniform1f(U.u_eclat, eclat);
    gl.uniform1f(U.u_jet, jet);
    gl.uniform1f(U.u_flash, flash);
    gl.uniform1f(U.u_pas, N.pas);
    gl.uniform1f(U.u_pasr, N.pasr);
    gl.uniform1f(U.u_oct, N.oct);
    gl.uniform1f(U.u_fil, N.fil);
    gl.uniform4fv(U.u_tr, trData);
    gl.uniform1f(U.u_ntr, TR.length);
    gl.uniform1f(U.u_hov, hov);
    gl.uniform1f(U.u_trt, tTr);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }
  function lancer() { if (!raf && !document.hidden) { dernier = 0; debutB = performance.now(); raf = requestAnimationFrame(image); } }
  function arreter() { if (raf) cancelAnimationFrame(raf); raf = 0; }

  /* ---------------------------------------------------- ce que la page voit ---- */
  window.ESP = {
    actif: true, station: cur,
    aller: aller, intro: intro, arriver: arriver,
    // un point de l'espace du trou noir (unités du disque) → l'écran ; masqué s'il est derrière l'ombre
    projeter: function (B, X) {
      var P = projeter(B, mul(X, masse)); if (!P) return null;
      var Dn = B.p.D / masse, rs = Math.tan(Math.asin(Math.min(0.99, 2.598 / Math.max(Dn, 2.7)))) * B.F;
      var dx = P.x - B.ox, dy = P.y - B.oy, cache = Math.sqrt(dx * dx + dy * dy) < rs * 1.05 && P.z > Math.sqrt(dot(B.C, B.C));
      P.cache = cache; return P;
    },
    surFrame: function (f) { abonnes.push(f); },
    eruption: eruption,
    get masse() { return masse; },
    get vol() { return !!vol; },
    etat: function () { return { niveau: niv, cadence: cadence, ecran: Math.round(1000 / vs) + ' Hz', plafond: cible ? Math.round(1000 / cible) + ' i/s' : null, toile: toile.width + 'x' + toile.height, masse: +masse.toFixed(3) }; },
    figer: function (id, u) { var a = poseDe(id); pose = a; },
    _dbg: function () { var o = {}; IDS.forEach(function (k) { var P = panneaux[k]; o[k] = P ? P.vu + ' ' + P.el.style.visibility + ' ' + P.el.style.transform.slice(0, 60) : null; }); return { cur: cur, vol: !!vol, posee: posee, enIntro: enIntro, pose: pose, p: o }; }
  };
  window.TN = { actif: true, humeur: function (net) { humeurC = Math.tanh((+net || 0) / 120); derniereSeance = +net || 0; }, plonger: rien, sortir: rien };

  // les trades arrivent avec les données du journal
  var essaisT = 0;
  (function attendre() {
    var X = window.R5;
    if (X && X.M && X.M.trades) {
      poserTrades(X.M.trades);
      masseC = regMasse(X.M.balance, X.M.start); if (!enIntro) masse = masseC;
      return;
    }
    if (++essaisT < 200) setTimeout(attendre, 100);
  })();

  var rz = 0;
  addEventListener('resize', function () { clearTimeout(rz); rz = setTimeout(function () { taille(); placer(); posee = false; }, 120); });
  document.addEventListener('visibilitychange', function () { if (document.hidden) arreter(); else lancer(); });
  toile.addEventListener('webglcontextlost', function (ev) { ev.preventDefault(); arreter(); });
  taille(); placer();
  if (fixe) { eclat = 1; var B0 = cam(pose, true); poserPanneaux(cam(pose, false), true); dessiner(B0); return; }
  lancer();
})();
