/* Harnais de test d'OntoLab : charge le <script> de index.html (et namespaces.js) dans un contexte `vm` de Node,
   avec un DOM minimal « permissif » (aucune dépendance). Les fonctions et constantes de l'application sont
   alors appelables via ctx.run('expression'), ce qui permet de tester les fonctions pures (Turtle, import, modèle)
   et de vérifier que le rendu complet (render, panneau) s'exécute sans exception. */
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm');
const ROOT = path.join(__dirname, '..');

/* Élément factice : retient les propriétés écrites (innerHTML, textContent, onclick…), toute autre lecture
   renvoie un autre élément factice appelable (donc document.querySelector('#x').foo.bar() ne plante pas). */
function makeStub(store = {}) {
  const target = function () {};
  const proxy = new Proxy(target, {
    get(t, k) {
      if (k in store) return store[k];
      if (k === Symbol.toPrimitive) return () => 0;
      if (k === 'then' || k === Symbol.iterator) return undefined;
      if (k === 'length') return 0;
      if (k === 'getBoundingClientRect') return () => ({ x: 0, y: 0, left: 0, top: 0, width: 1000, height: 700, right: 1000, bottom: 700 });
      if (k === 'matches') return false;
      return makeStub();
    },
    set(t, k, v) { store[k] = v; return true; },
    apply() { return makeStub(); },
    construct() { return makeStub(); },
  });
  return proxy;
}

/* Les objets créés dans le contexte vm ont d'autres prototypes (Array, Object…) : on les ramène par JSON pour que assert.deepEqual fonctionne. */
const norm = v => (v && typeof v === 'object') ? JSON.parse(JSON.stringify(v)) : v;

function load(opts = {}) {
  const ls = new Map(Object.entries(opts.storage || {}));
  const elements = new Map(), created = [];
  const byId = sel => { if (!elements.has(sel)) elements.set(sel, makeStub({ __sel: sel })); return elements.get(sel); };
  const doc = {
    querySelector: byId,
    querySelectorAll: () => [],
    getElementById: id => byId('#' + id),
    createElement: () => makeStub(),
    createElementNS: (ns, tag) => { const attrs = {}; const e = makeStub({ tag, attrs, setAttribute: (k, v) => { attrs[k] = String(v); }, getAttribute: k => attrs[k] ?? null }); created.push(e); return e; },
    addEventListener() {},
    body: makeStub(),
    activeElement: null,
  };
  const ctx = {
    document: doc,
    localStorage: { getItem: k => (ls.has(k) ? ls.get(k) : null), setItem: (k, v) => ls.set(k, String(v)), removeItem: k => ls.delete(k), clear: () => ls.clear() },
    location: { search: opts.search || '', href: 'http://localhost/index.html' },
    innerWidth: opts.width || 1200, innerHeight: 800,
    matchMedia: () => ({ matches: false }),
    navigator: {},
    console, setTimeout, clearTimeout, URLSearchParams, URL, Blob: class { constructor(p) { this.parts = p; } },
    requestAnimationFrame: f => setTimeout(f, 0),
    performance: { now: () => Date.now() },
    XMLSerializer: class { serializeToString() { return ''; } },
    addEventListener() {}, removeEventListener() {},
    Image: class {}, FileReader: class {},
  };
  ctx.window = ctx;
  vm.createContext(ctx);
  if (opts.namespaces !== false) {
    const nsFile = opts.namespacesSource != null ? opts.namespacesSource : fs.readFileSync(path.join(ROOT, 'namespaces.js'), 'utf8');
    vm.runInContext(nsFile, ctx, { filename: 'namespaces.js' });
  }
  if (opts.defaults) ctx.ONTOLAB_DEFAULTS = opts.defaults;
  const html = fs.readFileSync(process.env.ONTOLAB_HTML || path.join(ROOT, 'index.html'), 'utf8'); // ONTOLAB_HTML : page alternative (vérification des tests par mutation)
  const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)];
  const code = scripts[scripts.length - 1][1];
  vm.runInContext(code, ctx, { filename: 'index.html<script>' });
  return {
    ctx,
    storage: ls,
    /* Éléments SVG créés par el() depuis le dernier created.length = 0 : [{tag, attrs}] */
    created: () => created.map(e => ({ tag: e.tag, attrs: e.attrs })),
    resetCreated: () => { created.length = 0; },
    panelHTML: () => byId('#panel').innerHTML || '',
    run: expr => norm(vm.runInContext(expr, ctx)),
    /* Évalue une fonction JS (source) dans le contexte et renvoie son résultat. */
    call: (src, ...args) => { ctx.__args = args; return norm(vm.runInContext('(' + src + ')(...__args)', ctx)); },
  };
}
const read = name => fs.readFileSync(path.join(__dirname, 'fixtures', name), 'utf8');
module.exports = { load, read, ROOT };
