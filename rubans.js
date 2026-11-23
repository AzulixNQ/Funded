/* Les rubans de lumière : le fond animé du site.

   Deux lumières, comme partout sur le site : le vert citron (Nojah, order flow) et le blanc (Weizix, ICT).
   - En haut de page, deux grands rubans se pincent au même endroit (le « foyer », un élément de la page marqué data-foyer).
   - Plus bas, trois rubans calmes traversent l'écran.
   - Dans la partie « parcours » (data-parcours), un ruban passe par huit points de la page (data-noeud), un par semaine,
     et s'allume jusqu'à l'avancée écrite par la page (data-avance, de 0 à 7).

   Un ruban, c'est trois choses dessinées l'une sur l'autre, et les lumières s'additionnent :
     une brume (le halo autour), un voile de soie (le corps, avec ses fils et ses reflets aux plis),
     des brins fins et quelques brins épais, et des étincelles qui courent le long.
   Tout le calcul est fait par la carte graphique (WebGL). Trois niveaux, choisis tout seuls :
     « plein »  ordinateur ; « léger »  téléphone ou ordinateur qui peine (moins de tout, 30 images par seconde) ;
     « fixe »   mouvement réduit demandé, ou appareil trop lent : une seule image, redessinée au défilement.
   Sur Noweiz HUB (data-teinte="argent"), les mêmes rubans en blanc chaud et en argent froid, sans vert.
   Sur Road to 5 Live (data-teinte="ambre"), les mêmes rubans en ambre et en blanc chaud.
   Avec le trou noir (Road to 5 Live, 23/11) : data-foyer-fixe, les rubans du haut restent avec le trou noir quand on fait défiler ;
   data-lueur="non", pas de grandes lueurs (l'ombre du trou noir reste noire) ; data-fond="noir", un fond noir pur
   (la toile est posée sur le trou noir en mode « écran », le noir ne change rien dessous).
   Sur les pages où on lit et où on travaille (data-mode="calme" sur la toile), il ne reste que les trois rubans calmes,
   sans étincelles, à 30 images par seconde au plus.
   Sans WebGL, rien ne se passe : la page garde ses halos en CSS. */
(function () {
  'use strict';
  var toile = document.getElementById('rubans');
  if (!toile || !window.WebGLRenderingContext) return;
  var racine = document.documentElement;
  var veutCalme = window.matchMedia('(prefers-reduced-motion: reduce)');
  var estPetit = window.matchMedia('(max-width: 860px), (pointer: coarse)');

  var NIVEAUX = {
    plein: { brinsHaut: 120, brinsBas: 40, brinsChemin: 54, pas: 140, densite: 1.5, demi: 6, halo: 0.1, alpha: 0.2, voile: 0.16, brume: 0.07, etincelles: 170, point: 2.2, cadence: 1 },
    leger: { brinsHaut: 38, brinsBas: 14, brinsChemin: 22, pas: 80, densite: 1.25, demi: 2.6, halo: 0, alpha: 0.4, voile: 0.2, brume: 0.06, etincelles: 46, point: 2.4, cadence: 2 }
  };
  var niveau = estPetit.matches ? 'leger' : 'plein';
  var fixe = veutCalme.matches;
  var calme = toile.getAttribute('data-mode') === 'calme';
  var eclat = parseFloat(toile.getAttribute('data-eclat')) || 1;      // la force des rubans du haut (1 sur la page de vente)
  var argent = toile.getAttribute('data-teinte') === 'argent';        // Noweiz HUB : des rubans blancs et argentés, sans vert
  var ambre = toile.getAttribute('data-teinte') === 'ambre';          // Road to 5 Live : des rubans ambre et blanc chaud
  var violet = toile.getAttribute('data-teinte') === 'violet';        // Road to 5 Live dans l'espace (23/11 au soir) : violet et bleu glacier
  var suit = toile.hasAttribute('data-foyer-fixe') ? 0 : 1;            // 0 : les rubans du haut ne défilent pas avec la page
  var sansLueur = toile.getAttribute('data-lueur') === 'non';
  var fondNoir = toile.getAttribute('data-fond') === 'noir';

  /* ---------- ce que les trois dessins ont en commun : où passe un ruban, sa couleur, sa force ---------- */
  var COMMUN = [
    'uniform vec2 u_taille;',                  // la toile, en pixels
    'uniform float u_px;',                     // pixels de toile pour un pixel de page
    'uniform float u_temps;',
    'uniform float u_defil;',                  // le défilement de la page, en pixels de toile
    'uniform vec2 u_foyer;',                   // là où les rubans du haut se pincent (page non défilée)
    'uniform float u_portrait;',               // 1 sur un écran en hauteur : les rubans du haut tombent vers le bas
    'uniform vec2 u_noeuds[8];',               // les huit semaines du parcours, là où elles sont à l'écran
    'uniform float u_avance;',                 // jusqu'où le parcours est allumé (0 à 7)
    'uniform float u_chemin;',                 // 1 quand le parcours est à l'écran : les rubans calmes s'effacent
    'uniform float u_calme;',                  // 1 sur les pages de travail : les rubans calmes gardent la même force partout
    'uniform float u_argent;',                 // 1 sur Noweiz HUB : blanc chaud et argent froid, pas de vert
    'uniform float u_suit;',                   // 1 : les rubans du haut défilent avec la page ; 0 : ils restent
    'const float PI = 3.14159265;',
    'float hasard(float n) { return fract(sin(n * 91.3458) * 47453.5453); }',

    'vec2 noeud(float i) {',
    '  vec2 r = u_noeuds[0];',
    '  for (int k = 1; k < 8; k++) { if (float(k) <= i + 0.5) r = u_noeuds[k]; }',
    '  return r;',
    '}',
    // une courbe douce qui passe par les huit points, et se prolonge au-delà du premier et du dernier
    'vec2 chemin(float x) {',
    '  if (x < 0.0) return noeud(0.0) + (noeud(0.0) - noeud(1.0)) * (-x) * 1.7;',
    '  if (x > 7.0) return noeud(7.0) + (noeud(7.0) - noeud(6.0)) * (x - 7.0) * 1.7;',
    '  float i = min(floor(x), 6.0), f = x - i;',
    '  vec2 p0 = noeud(max(i - 1.0, 0.0)), p1 = noeud(i), p2 = noeud(i + 1.0), p3 = noeud(min(i + 2.0, 7.0));',
    '  return 0.5 * (2.0 * p1 + (p2 - p0) * f + (2.0 * p0 - 5.0 * p1 + 4.0 * p2 - p3) * f * f + (3.0 * p1 - p0 - 3.0 * p2 + p3) * f * f * f);',
    '}',

    // Le centre du ruban r au point t ; renvoie aussi sa torsion (en radians) et sa demi-largeur
    'vec2 centre(float r, float t, out float torsion, out float large) {',
    '  float W = u_taille.x, H = u_taille.y, tt = u_temps;',
    '  vec2 p;',
    '  if (r < 1.5) {',                        // les deux rubans du haut : vert (0) et blanc (1)
    '    float b = step(0.5, r);',
    '    float u = 2.0 * t - 1.0;',
    '    float po = u_portrait;',
    // écran large : une épingle couchée, ouverte vers la droite ; écran en hauteur : un chevron, la pointe en haut
    '    float A = mix(mix(1.08, 1.5, b) * max(W, H * 1.15), mix(1.3, 1.65, b) * H, po);',
    '    float B = mix(mix(0.64, 1.0, b) * H, mix(0.6, 0.98, b) * W, po);',
    '    float rot = mix(mix(0.09, -0.25, b), 1.5708 + mix(0.07, -0.13, b), po) + sin(tt * 0.11 + b * 2.0) * 0.04;',
    '    float M = mix(H, W * 1.15, po);',
    '    vec2 q = vec2(A * u * u + sin(u * 2.6 + tt * 0.21 + b) * 0.02 * M * abs(u),',
    '                  B * u + sin(u * 4.0 - tt * 0.17 + b * 3.0) * 0.024 * M * abs(u));',
    '    float c = cos(rot), s = sin(rot);',
    '    p = u_foyer + vec2(q.x * c - q.y * s, q.x * s + q.y * c);',
    '    p.y -= u_defil * u_suit;',
    '    torsion = PI * 0.5 + (u + b * 0.06 + sin(tt * 0.09 + b * 1.7) * 0.035) * PI * mix(0.86, 0.6, b);',
    '    large = M * mix(0.2, 0.3, b) * (0.2 + 0.8 * u * u);',
    '  } else if (r < 4.5) {',                 // les rubans calmes : ils traversent l'écran et glissent doucement quand on défile
    '    float k = r - 2.0;',
    '    float y0 = fract(0.24 + k * 0.31 - u_defil / (H * (7.0 + k * 2.0))) * 1.8 - 0.4;',
    '    p = vec2(mix(-0.14, 1.14, t) * W,',
    '             (y0 + sin(t * (2.1 + k * 0.7) + tt * 0.12 + k * 1.9) * 0.12 + sin(t * 5.3 - tt * 0.085 + k) * 0.045) * H);',
    '    torsion = t * PI * (1.5 + k * 0.45) + tt * 0.07 + k * 1.3;',
    '    large = H * 0.09 * (0.6 + 0.4 * sin(t * 3.1 + k * 2.0));',
    '  } else {',                              // le parcours : il se pince exactement sur chaque semaine
    '    float x = mix(-0.9, 7.9, t);',
    '    p = chemin(x);',
    '    torsion = PI * 0.5 + PI * x + sin(tt * 0.35 + x * 1.3) * 0.1;',
    '    large = u_px * mix(58.0, 24.0, u_portrait) * (0.85 + 0.15 * sin(x * 2.3 + tt * 0.4));',
    '  }',
    '  return p;',
    '}',

    'float estBlanc(float r) { return step(0.5, r) * step(r, 1.5) + step(2.5, r) * step(r, 3.5); }',
    'vec3 couleurRuban(float r, float eclat, float pointe) {',
    '  float blanc = estBlanc(r);',
    '  vec3 sombre = mix(mix(vec3(0.13, 0.31, 0.03), vec3(0.2, 0.25, 0.34), blanc), mix(vec3(0.24, 0.24, 0.23), vec3(0.17, 0.2, 0.27), blanc), u_argent);',
    '  vec3 clair = mix(mix(vec3(0.776, 0.957, 0.196), vec3(0.9, 0.94, 1.0), blanc), mix(vec3(0.97, 0.96, 0.92), vec3(0.8, 0.87, 1.0), blanc), u_argent);',
    '  vec3 c = mix(sombre, clair, 0.25 + 0.75 * eclat);',
    '  return mix(c, vec3(1.0, 1.0, 0.9), pointe * 0.45);',
    '}',
    // les rubans du haut sont vifs ; les calmes restent en retrait ; le parcours n'est vif que là où il est allumé
    'float forceRuban(float r, float t) {',
    '  if (r > 4.5) {',
    '    float x = mix(-0.9, 7.9, t);',
    '    float allume = smoothstep(u_avance + 0.14, u_avance - 0.1, x);',
    '    float tete = exp(-(x - u_avance) * (x - u_avance) * 6.0);',
    '    return mix(0.17, 0.9, allume) + tete * 0.9;',
    '  }',
    '  if (r > 1.5) return mix(mix(0.2, 0.5, smoothstep(0.15, 0.9, u_defil / u_taille.y)) * (1.0 - 0.7 * u_chemin), 0.36, u_calme);',
    '  return mix(1.0, 0.74, estBlanc(r));',
    '}',
    'vec4 ecran(vec2 p) { return vec4(p.x / u_taille.x * 2.0 - 1.0, 1.0 - p.y / u_taille.y * 2.0, 0.0, 1.0); }'
  ].join('\n');
  // Road to 5 Live : l'ambre (#FFA41C) à la place du vert, un blanc chaud à la place du blanc froid
  if (violet) COMMUN = COMMUN.replace('vec3(0.13, 0.31, 0.03)', 'vec3(0.17, 0.06, 0.38)').replace('vec3(0.776, 0.957, 0.196)', 'vec3(0.62, 0.49, 1.0)');
  if (ambre) COMMUN = COMMUN.replace('vec3(0.13, 0.31, 0.03)', 'vec3(0.32, 0.16, 0.02)').replace('vec3(0.776, 0.957, 0.196)', 'vec3(1.0, 0.643, 0.11)')
    .replace('vec3(0.2, 0.25, 0.34)', 'vec3(0.3, 0.22, 0.14)').replace('vec3(0.9, 0.94, 1.0)', 'vec3(1.0, 0.9, 0.74)');

  /* ---------- les brins ---------- */
  var SOMMETS_BRINS = COMMUN + '\n' + [
    'attribute vec4 a;',                       // t le long du brin, côté (-1 ou 1), numéro du brin (0 à 1), numéro du ruban
    'uniform float u_demi;',                   // demi-épaisseur d'un brin, en pixels de page
    'uniform float u_alpha;',
    'varying float v_d;',
    'varying float v_demi;',
    'varying vec3 v_c;',
    'void main() {',
    '  float t = a.x, r = a.w;',
    '  float h1 = hasard(a.z * 37.0 + r * 3.1), h2 = hasard(a.z * 91.0 + r * 7.7), h3 = hasard(a.z * 13.0 + r * 1.3);',
    '  float tor, lar, tor2, lar2;',
    '  vec2 p = centre(r, t, tor, lar);',
    '  vec2 p2 = centre(r, t + 0.004, tor2, lar2);',
    '  vec2 tg = normalize(p2 - p + vec2(0.0001, 0.0));',
    '  vec2 n = vec2(-tg.y, tg.x);',
    '  float s = h1 * 2.0 - 1.0;',                                // la place du brin dans la largeur du ruban
    '  float ang = tor + (h2 - 0.5) * 0.42;',                     // chaque brin se pince un peu avant ou un peu après
    '  float ecart = s * lar * cos(ang) + sin(t * (6.0 + 5.0 * h3) + u_temps * (0.22 + 0.3 * h2) + h1 * 40.0) * lar * 0.04;',
    '  float fond = s * sin(ang);',                               // devant (1) ou derrière (-1)
    '  float gros = pow(h3, 5.0);',                               // quelques brins sont plus épais et plus clairs
    '  float demi = u_demi * (0.6 + 1.5 * gros);',
    '  p += n * (ecart + a.y * demi * u_px);',
    '  v_d = a.y * demi;',
    '  v_demi = demi;',
    // la lumière qui court le long du brin
    '  float vague = 0.5 + 0.5 * sin((t * (3.0 + 5.0 * h3) - u_temps * (0.05 + 0.07 * h2) + h1) * 2.0 * PI);',
    '  float eclat = pow(vague, 3.0);',
    '  float bouts = smoothstep(0.0, 0.1, t) * smoothstep(1.0, 0.9, t);',
    '  v_c = couleurRuban(r, eclat, pow(vague, 10.0)) * u_alpha * forceRuban(r, t) * bouts * (0.5 + 0.5 * fond) * (0.3 + 0.7 * eclat) * (0.7 + 1.2 * gros);',
    '  gl_Position = ecran(p);',
    '}'
  ].join('\n');
  var PIXELS_BRINS = [
    'precision mediump float;',
    'uniform float u_halo;',
    'varying float v_d;',
    'varying float v_demi;',
    'varying vec3 v_c;',
    'void main() {',
    '  float d = v_d * v_d;',
    '  float bord = 1.0 - d / (v_demi * v_demi);',
    '  float f = exp(-d * 1.5) + u_halo * exp(-d * 0.05) * bord;',
    '  gl_FragColor = vec4(v_c * f, 1.0);',
    '}'
  ].join('\n');

  /* ---------- le voile de soie, et la brume autour ---------- */
  var SOMMETS_VOILE = COMMUN + '\n' + [
    'attribute vec3 a;',                       // t, côté (-1 ou 1), numéro du ruban
    'uniform float u_brume;',                  // 0 : le voile ; 1 : la brume, plus large et sans plis
    'uniform float u_force;',
    'varying float v_s;',
    'varying float v_t;',
    'varying float v_w;',
    'varying float v_pli;',
    'varying vec3 v_c;',
    'void main() {',
    '  float t = a.x, r = a.z;',
    '  float tor, lar, tor2, lar2;',
    '  vec2 p = centre(r, t, tor, lar);',
    '  vec2 p2 = centre(r, t + 0.004, tor2, lar2);',
    '  vec2 tg = normalize(p2 - p + vec2(0.0001, 0.0));',
    '  vec2 n = vec2(-tg.y, tg.x);',
    '  float c = cos(tor);',
    '  float w = mix(lar * c, lar * 2.2 * (0.35 + 0.65 * abs(c)), u_brume);',
    '  p += n * a.y * w;',
    '  v_s = a.y;',
    '  v_t = t;',
    '  v_w = abs(w) / u_px;',                  // la demi-largeur à l'écran, en pixels de page
    '  v_pli = 1.0 - abs(c);',                 // 1 là où le voile se présente par la tranche
    '  float bouts = smoothstep(0.0, 0.1, t) * smoothstep(1.0, 0.9, t);',
    '  v_c = couleurRuban(r, 0.6, 0.0) * forceRuban(r, t) * bouts * u_force;',
    '  gl_Position = ecran(p);',
    '}'
  ].join('\n');
  var PIXELS_VOILE = [
    'precision mediump float;',
    'uniform float u_mode;',                   // 0 : le voile ; 1 : la brume
    'uniform float u_heure;',
    'varying float v_s;',
    'varying float v_t;',
    'varying float v_w;',
    'varying float v_pli;',
    'varying vec3 v_c;',
    'void main() {',
    '  float bord = max(0.0, 1.0 - v_s * v_s);',
    '  float corps = pow(bord, 0.7);',
    // les fils de la soie : des lignes fines dans la largeur, qui ondulent le long du ruban
    '  float fils = pow(0.5 + 0.5 * sin(v_s * 42.0 + sin(v_t * 12.0 + u_heure * 0.25) * 2.6), 6.0);',
    '  float fins = smoothstep(12.0, 55.0, v_w);',               // pas de fils là où le voile est trop étroit à l\'écran
    '  float onde = 0.62 + 0.38 * sin(v_t * 8.0 - u_heure * 0.45);',
    '  float soie = (corps * 0.42 + fils * fins * 0.7 * bord) * onde * (1.0 + 1.5 * v_pli * v_pli);',
    '  float brume = pow(bord, 2.4);',
    '  gl_FragColor = vec4(v_c * mix(soie, brume, u_mode), 1.0);',
    '}'
  ].join('\n');

  /* ---------- les étincelles ---------- */
  var SOMMETS_POINTS = COMMUN + '\n' + [
    'attribute vec4 a;',                       // trois nombres au hasard, puis le numéro du ruban
    'uniform float u_point;',
    'uniform float u_alpha;',
    'varying vec3 v_c;',
    'void main() {',
    '  float r = a.w;',
    '  float t = fract(a.x + u_temps * (0.008 + 0.024 * a.y));',
    '  float tor, lar, tor2, lar2;',
    '  vec2 p = centre(r, t, tor, lar);',
    '  vec2 p2 = centre(r, t + 0.004, tor2, lar2);',
    '  vec2 tg = normalize(p2 - p + vec2(0.0001, 0.0));',
    '  vec2 n = vec2(-tg.y, tg.x);',
    '  float s = a.z * 2.0 - 1.0;',
    '  float ang = tor + (a.y - 0.5) * 0.5;',
    '  p += n * s * lar * cos(ang) * 1.08;',
    '  float fond = s * sin(ang);',
    '  float clign = 0.5 + 0.5 * sin(u_temps * (1.5 + 3.5 * a.z) + a.x * 60.0);',
    '  float bouts = smoothstep(0.0, 0.1, t) * smoothstep(1.0, 0.9, t);',
    '  v_c = couleurRuban(r, 1.0, 0.8) * forceRuban(r, t) * bouts * (0.55 + 0.45 * fond) * (0.25 + 0.75 * clign) * u_alpha;',
    '  gl_PointSize = u_px * u_point * (1.0 + 3.2 * pow(a.y, 3.0));',
    '  gl_Position = ecran(p);',
    '}'
  ].join('\n');
  var PIXELS_POINTS = [
    'precision mediump float;',
    'varying vec3 v_c;',
    'void main() {',
    '  vec2 q = gl_PointCoord * 2.0 - 1.0;',
    '  gl_FragColor = vec4(v_c * exp(-dot(q, q) * 3.6), 1.0);',
    '}'
  ].join('\n');

  /* ---------- les lueurs : de grandes taches douces derrière le foyer ---------- */
  var SOMMETS_LUEUR = [
    'attribute vec2 a;',
    'uniform vec2 u_taille;',
    'uniform vec2 u_centre;',
    'uniform vec2 u_rayon;',
    'varying vec2 v_p;',
    'void main() {',
    '  v_p = a;',
    '  vec2 p = u_centre + a * u_rayon;',
    '  gl_Position = vec4(p.x / u_taille.x * 2.0 - 1.0, 1.0 - p.y / u_taille.y * 2.0, 0.0, 1.0);',
    '}'
  ].join('\n');
  var PIXELS_LUEUR = [
    'precision mediump float;',
    'uniform vec3 u_couleur;',
    'varying vec2 v_p;',
    'void main() {',
    '  float d = dot(v_p, v_p);',
    '  float f = exp(-d * 3.2) * (1.0 - smoothstep(0.7, 1.0, d));',
    '  gl_FragColor = vec4(u_couleur * f, 1.0);',
    '}'
  ].join('\n');

  var NOMS_COMMUNS = ['u_taille', 'u_px', 'u_temps', 'u_defil', 'u_foyer', 'u_portrait', 'u_noeuds', 'u_avance', 'u_chemin', 'u_calme', 'u_argent', 'u_suit'];
  var gl = null;
  var brins = null, voile = null, points = null, lueur = null;           // { prog, lieux, tampon, nb, nbChemin }
  var px = 1, large = 0, haut = 0;
  var foyer = { x: 0, y: 0 };
  var temps = 0, dernier = 0, image = 0, demande = 0, enRoute = false;
  var mesures = [], mesureDepuis = 0;
  /* le parcours */
  var scene = document.querySelector('[data-chemin]');
  var reperes = scene ? scene.querySelectorAll('[data-noeud]') : [];
  var noeuds = new Float32Array(16), avance = 7, cheminVu = false, cheminDoux = 0;

  function compiler(type, source) {
    var s = gl.createShader(type);
    gl.shaderSource(s, source);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s) || 'shader');
    return s;
  }
  function programme(sommets, pixels, noms) {
    var p = gl.createProgram();
    gl.attachShader(p, compiler(gl.VERTEX_SHADER, sommets));
    gl.attachShader(p, compiler(gl.FRAGMENT_SHADER, pixels));
    gl.bindAttribLocation(p, 0, 'a');
    gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p) || 'programme');
    var lieux = {};
    noms.forEach(function (u) { lieux[u] = gl.getUniformLocation(p, u); });
    return { prog: p, lieux: lieux, tampon: gl.createBuffer(), bas: 0, nb: 0, nbChemin: 0 };      // bas : où commencent les rubans calmes
  }

  /* Toute la géométrie, en listes de triangles (et de points). Dans chaque liste : d'abord les rubans 0 à 4, puis le parcours. */
  function construire() {
    var n = NIVEAUX[niveau];
    var parRuban = [n.brinsHaut, n.brinsHaut, n.brinsBas, n.brinsBas, n.brinsBas, n.brinsChemin];
    var r, i, j, k, d, total;

    // les brins
    total = 0;
    for (r = 0; r < 6; r++) total += parRuban[r] * n.pas * 6;
    d = new Float32Array(total * 4); k = 0;
    for (r = 0; r < 6; r++) {
      if (r === 2) brins.bas = k / 4;
      if (r === 5) brins.nb = k / 4;
      for (i = 0; i < parRuban[r]; i++) {
        var brin = (i + 0.5) / parRuban[r];
        for (j = 0; j < n.pas; j++) {
          var t0 = j / n.pas, t1 = (j + 1) / n.pas;
          d[k++] = t0; d[k++] = -1; d[k++] = brin; d[k++] = r;
          d[k++] = t0; d[k++] = 1; d[k++] = brin; d[k++] = r;
          d[k++] = t1; d[k++] = -1; d[k++] = brin; d[k++] = r;
          d[k++] = t1; d[k++] = -1; d[k++] = brin; d[k++] = r;
          d[k++] = t0; d[k++] = 1; d[k++] = brin; d[k++] = r;
          d[k++] = t1; d[k++] = 1; d[k++] = brin; d[k++] = r;
        }
      }
    }
    brins.nbChemin = k / 4 - brins.nb;
    gl.bindBuffer(gl.ARRAY_BUFFER, brins.tampon);
    gl.bufferData(gl.ARRAY_BUFFER, d, gl.STATIC_DRAW);

    // les voiles : une bande par ruban
    d = new Float32Array(6 * n.pas * 6 * 3); k = 0;
    for (r = 0; r < 6; r++) {
      if (r === 2) voile.bas = k / 3;
      if (r === 5) voile.nb = k / 3;
      for (j = 0; j < n.pas; j++) {
        var u0 = j / n.pas, u1 = (j + 1) / n.pas;
        d[k++] = u0; d[k++] = -1; d[k++] = r;
        d[k++] = u0; d[k++] = 1; d[k++] = r;
        d[k++] = u1; d[k++] = -1; d[k++] = r;
        d[k++] = u1; d[k++] = -1; d[k++] = r;
        d[k++] = u0; d[k++] = 1; d[k++] = r;
        d[k++] = u1; d[k++] = 1; d[k++] = r;
      }
    }
    voile.nbChemin = k / 3 - voile.nb;
    gl.bindBuffer(gl.ARRAY_BUFFER, voile.tampon);
    gl.bufferData(gl.ARRAY_BUFFER, d, gl.STATIC_DRAW);

    // les étincelles (les mêmes à chaque visite : un tirage à graine fixe)
    var graine = 7;
    var tirer = function () { graine = (graine * 16807) % 2147483647; return graine / 2147483647; };
    var parRubanPoints = [n.etincelles, Math.round(n.etincelles * 0.6), Math.round(n.etincelles * 0.2), Math.round(n.etincelles * 0.2), Math.round(n.etincelles * 0.2), Math.round(n.etincelles * 0.5)];
    total = 0;
    for (r = 0; r < 6; r++) total += parRubanPoints[r];
    d = new Float32Array(total * 4); k = 0;
    for (r = 0; r < 6; r++) {
      if (r === 2) points.bas = k / 4;
      if (r === 5) points.nb = k / 4;
      for (i = 0; i < parRubanPoints[r]; i++) { d[k++] = tirer(); d[k++] = tirer(); d[k++] = tirer(); d[k++] = r; }
    }
    points.nbChemin = k / 4 - points.nb;
    gl.bindBuffer(gl.ARRAY_BUFFER, points.tampon);
    gl.bufferData(gl.ARRAY_BUFFER, d, gl.STATIC_DRAW);
  }

  function preparer() {
    gl = toile.getContext('webgl', { alpha: false, antialias: false, depth: false, stencil: false, powerPreference: 'low-power', preserveDrawingBuffer: false });
    if (!gl) return false;
    try {
      brins = programme(SOMMETS_BRINS, PIXELS_BRINS, NOMS_COMMUNS.concat(['u_demi', 'u_alpha', 'u_halo']));
      voile = programme(SOMMETS_VOILE, PIXELS_VOILE, NOMS_COMMUNS.concat(['u_brume', 'u_force', 'u_mode', 'u_heure']));
      points = programme(SOMMETS_POINTS, PIXELS_POINTS, NOMS_COMMUNS.concat(['u_point', 'u_alpha']));
      lueur = programme(SOMMETS_LUEUR, PIXELS_LUEUR, ['u_taille', 'u_centre', 'u_rayon', 'u_couleur']);
    } catch (e) {
      if (window.console && console.warn) console.warn('Rubans de lumière : ' + e.message);
      gl = null;
      return false;
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, lueur.tampon);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]), gl.STATIC_DRAW);
    construire();
    gl.disable(gl.DEPTH_TEST);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE);                 // les lumières s'additionnent : là où elles se croisent, ça brille
    gl.enableVertexAttribArray(0);
    return true;
  }

  function mesurer() {
    var n = NIVEAUX[niveau];
    px = Math.min(window.devicePixelRatio || 1, n.densite);
    var l = Math.max(1, Math.round(toile.clientWidth * px)), h = Math.max(1, Math.round(toile.clientHeight * px));
    if (l !== large || h !== haut) { large = l; haut = h; toile.width = l; toile.height = h; }
    lireFoyer();
  }
  // le foyer peut apparaître après le chargement (une page qui se remplit avec ses données) : relu toutes les secondes
  var foyerLu = 0;
  function lireFoyer() {
    foyerLu = performance.now();
    var ancre = document.querySelector('[data-foyer]');
    if (ancre && ancre.getBoundingClientRect().width) {
      var b = ancre.getBoundingClientRect();
      foyer.x = (b.left + b.width / 2) * px;
      foyer.y = (b.top + b.height / 2 + window.scrollY) * px;
    } else {
      foyer.x = large * 0.42; foyer.y = haut * 0.6;
    }
  }

  /* Où sont les huit semaines à l'écran, et jusqu'où la page les a allumées. */
  function lireChemin() {
    cheminVu = false;
    if (!scene || reperes.length !== 8) return;
    var r = scene.getBoundingClientRect();
    if (r.bottom < -120 || r.top > window.innerHeight + 120) return;
    cheminVu = true;
    for (var i = 0; i < 8; i++) {
      var b = reperes[i].getBoundingClientRect();
      noeuds[i * 2] = (b.left + b.width / 2) * px;
      noeuds[i * 2 + 1] = (b.top + b.height / 2) * px;
    }
    var a = parseFloat(scene.getAttribute('data-avance'));
    avance = isNaN(a) ? 7 : a;
  }

  function communs(o, defil) {
    var l = o.lieux;
    gl.useProgram(o.prog);
    gl.bindBuffer(gl.ARRAY_BUFFER, o.tampon);
    gl.uniform2f(l.u_taille, large, haut);
    gl.uniform1f(l.u_px, px);
    gl.uniform1f(l.u_temps, temps);
    gl.uniform1f(l.u_defil, defil);
    gl.uniform2f(l.u_foyer, foyer.x, foyer.y);
    gl.uniform1f(l.u_portrait, large / haut < 0.85 ? 1 : 0);
    gl.uniform2fv(l.u_noeuds, noeuds);
    gl.uniform1f(l.u_avance, avance);
    gl.uniform1f(l.u_chemin, cheminDoux);
    gl.uniform1f(l.u_calme, calme ? 1 : 0);
    gl.uniform1f(l.u_argent, argent ? 1 : 0);
    gl.uniform1f(l.u_suit, suit);
  }

  function dessiner() {
    var n = NIVEAUX[niveau];
    var defil = window.scrollY * px;
    lireChemin();
    cheminDoux += ((cheminVu ? 1 : 0) - cheminDoux) * (enRoute ? 0.08 : 1);
    gl.viewport(0, 0, large, haut);
    if (fondNoir) gl.clearColor(0, 0, 0, 1); else gl.clearColor(0.02, 0.024, 0.022, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);

    // sur une page de travail : seulement les rubans calmes (voile et brins), rien d'autre
    if (calme) {
      communs(voile, defil);
      gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);
      gl.uniform1f(voile.lieux.u_heure, temps % 1000);
      gl.uniform1f(voile.lieux.u_brume, 0); gl.uniform1f(voile.lieux.u_mode, 0); gl.uniform1f(voile.lieux.u_force, n.voile);
      gl.drawArrays(gl.TRIANGLES, voile.bas, voile.nb - voile.bas);
      communs(brins, defil);
      gl.vertexAttribPointer(0, 4, gl.FLOAT, false, 0, 0);
      gl.uniform1f(brins.lieux.u_demi, n.demi);
      gl.uniform1f(brins.lieux.u_alpha, n.alpha);
      gl.uniform1f(brins.lieux.u_halo, n.halo);
      gl.drawArrays(gl.TRIANGLES, brins.bas, brins.nb - brins.bas);
      return;
    }

    // les lueurs, tant que le foyer n'est pas trop loin de l'écran
    var fy = foyer.y - defil * suit;
    if (!sansLueur && fy > -haut && fy < haut * 2) {
      gl.useProgram(lueur.prog);
      gl.bindBuffer(gl.ARRAY_BUFFER, lueur.tampon);
      gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
      gl.uniform2f(lueur.lieux.u_taille, large, haut);
      var base = Math.max(large, haut), petit = Math.min(large, haut);
      var souffle = 1 + Math.sin(temps * 0.4) * 0.06;
      gl.uniform2f(lueur.lieux.u_centre, foyer.x + base * 0.05, fy);
      gl.uniform2f(lueur.lieux.u_rayon, base * 0.5 * souffle, base * 0.42 * souffle);
      if (argent) gl.uniform3f(lueur.lieux.u_couleur, 0.07 * eclat, 0.075 * eclat, 0.085 * eclat);
      else if (ambre) gl.uniform3f(lueur.lieux.u_couleur, 0.15 * eclat, 0.085 * eclat, 0.015 * eclat);
      else if (violet) gl.uniform3f(lueur.lieux.u_couleur, 0.08 * eclat, 0.06 * eclat, 0.16 * eclat);
      else gl.uniform3f(lueur.lieux.u_couleur, 0.1 * eclat, 0.14 * eclat, 0.02 * eclat);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
      gl.uniform2f(lueur.lieux.u_centre, foyer.x, fy);
      gl.uniform2f(lueur.lieux.u_rayon, petit * 0.2 * souffle, petit * 0.17 * souffle);
      if (argent) gl.uniform3f(lueur.lieux.u_couleur, 0.22 * eclat, 0.23 * eclat, 0.26 * eclat);
      else if (ambre) gl.uniform3f(lueur.lieux.u_couleur, 0.42 * eclat, 0.25 * eclat, 0.05 * eclat);
      else if (violet) gl.uniform3f(lueur.lieux.u_couleur, 0.22 * eclat, 0.16 * eclat, 0.45 * eclat);
      else gl.uniform3f(lueur.lieux.u_couleur, 0.3 * eclat, 0.37 * eclat, 0.1 * eclat);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
    }

    // la brume, puis le voile
    communs(voile, defil);
    gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);
    gl.uniform1f(voile.lieux.u_heure, temps % 1000);
    var nbVoile = voile.nb + (cheminVu ? voile.nbChemin : 0);
    if (n.brume > 0) {
      gl.uniform1f(voile.lieux.u_brume, 1); gl.uniform1f(voile.lieux.u_mode, 1); gl.uniform1f(voile.lieux.u_force, n.brume * eclat);
      gl.drawArrays(gl.TRIANGLES, 0, nbVoile);
    }
    gl.uniform1f(voile.lieux.u_brume, 0); gl.uniform1f(voile.lieux.u_mode, 0); gl.uniform1f(voile.lieux.u_force, n.voile * eclat);
    gl.drawArrays(gl.TRIANGLES, 0, nbVoile);

    // les brins
    communs(brins, defil);
    gl.vertexAttribPointer(0, 4, gl.FLOAT, false, 0, 0);
    gl.uniform1f(brins.lieux.u_demi, n.demi);
    gl.uniform1f(brins.lieux.u_alpha, n.alpha * eclat);
    gl.uniform1f(brins.lieux.u_halo, n.halo);
    gl.drawArrays(gl.TRIANGLES, 0, brins.nb + (cheminVu ? brins.nbChemin : 0));

    // les étincelles
    communs(points, defil);
    gl.vertexAttribPointer(0, 4, gl.FLOAT, false, 0, 0);
    gl.uniform1f(points.lieux.u_point, n.point);
    gl.uniform1f(points.lieux.u_alpha, 0.9 * eclat);
    gl.drawArrays(gl.POINTS, 0, points.nb + (cheminVu ? points.nbChemin : 0));
  }

  /* Si l'appareil peine, on descend d'un niveau : plein → léger → fixe. */
  function surveiller(ecart) {
    if (performance.now() - mesureDepuis < 1500) return;         // on laisse la page finir de se charger
    mesures.push(ecart);
    if (mesures.length < 80) return;
    var tri = mesures.slice().sort(function (x, y) { return x - y; });
    var mediane = tri[40];
    mesures = [];
    var attendu = 1000 / 60 * (calme ? 2 : NIVEAUX[niveau].cadence);
    if (mediane < attendu * 1.7) return;
    if (niveau === 'plein') {
      niveau = 'leger';
      construire();
      mesurer();
      mesureDepuis = performance.now();
    } else {
      fixe = true;
      arreter();
      racine.setAttribute('data-rubans', 'fixe');
      dessiner();
    }
  }

  function tour(maintenant) {
    demande = 0;
    if (!enRoute) return;
    demande = requestAnimationFrame(tour);
    image++;
    if (image % (calme ? 2 : NIVEAUX[niveau].cadence) !== 0) return;
    if (window.ESP && ESP.actif && ESP.foyer) { foyer.x = ESP.foyer.x * px; foyer.y = ESP.foyer.y * px; }   // dans l'espace : le foyer suit le trou noir à chaque image
    else if (maintenant - foyerLu > 1000) lireFoyer();
    var ecart = dernier ? maintenant - dernier : 16;
    dernier = maintenant;
    if (ecart < 250) { temps += ecart / 1000; surveiller(ecart); }   // au retour d'un autre onglet, le temps ne saute pas
    dessiner();
  }
  function lancer() {
    if (enRoute || fixe || !gl || document.hidden) return;
    enRoute = true; dernier = 0; mesures = []; mesureDepuis = performance.now();
    demande = requestAnimationFrame(tour);
  }
  function arreter() {
    enRoute = false;
    if (demande) cancelAnimationFrame(demande);
    demande = 0;
  }
  var enAttente = false;
  function redessiner() {
    if (!gl || enRoute || enAttente) return;
    enAttente = true;
    requestAnimationFrame(function () { enAttente = false; if (gl && !enRoute) dessiner(); });
  }

  function demarrer() {
    if (!preparer()) return;
    temps = 40;                                    // un moment où les rubans sont déjà bien ouverts, pour l'image fixe
    mesurer();
    racine.setAttribute('data-rubans', fixe ? 'fixe' : 'animes');
    dessiner();
    lancer();
  }

  window.addEventListener('resize', function () { if (gl) { mesurer(); redessiner(); } });
  window.addEventListener('scroll', redessiner, { passive: true });
  window.addEventListener('load', function () { if (gl) { mesurer(); redessiner(); } });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { if (gl) { mesurer(); redessiner(); } });
  document.addEventListener('visibilitychange', function () { if (document.hidden) arreter(); else lancer(); });
  var surCalme = function () {
    fixe = veutCalme.matches;
    if (!gl) return;
    if (fixe) { arreter(); racine.setAttribute('data-rubans', 'fixe'); dessiner(); } else { racine.setAttribute('data-rubans', 'animes'); lancer(); }
  };
  if (veutCalme.addEventListener) veutCalme.addEventListener('change', surCalme);
  toile.addEventListener('webglcontextlost', function (ev) { ev.preventDefault(); arreter(); gl = null; racine.removeAttribute('data-rubans'); });
  toile.addEventListener('webglcontextrestored', demarrer);

  demarrer();
  [800, 2500].forEach(function (ms) { setTimeout(function () { if (gl) { lireFoyer(); redessiner(); } }, ms); });
})();
