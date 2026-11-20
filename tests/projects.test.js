/* F4 : plusieurs projets (ontologies) dans le navigateur, versions, export / import de l'ensemble. */
const { test } = require('node:test'); const assert = require('node:assert/strict'); const { load } = require('./harness');

const idx = t => JSON.parse(t.storage.get('ontolab-projects'));
const names = t => t.run('projects.list.map(e=>e.name)');
const sizeOf = t => t.run('state.classes.length');

test('premier lancement : un projet « Mon ontologie » créé et enregistré', () => {
  const t = load();
  assert.deepEqual(names(t), ['Mon ontologie']);
  assert.equal(idx(t).list.length, 1); assert.ok(t.storage.has('ontolab-p-' + idx(t).current));
  assert.match(String(t.ctx.document.querySelector('#proj-name').textContent), /Mon ontologie/);
});

test('migration : l\'ancienne clé ontolab-v1 devient le premier projet, laissée intacte en secours', () => {
  const legacy = JSON.stringify({ classes: [{ id: 1, name: 'Ancienne', parents: [] }], objProps: [], dataProps: [], nextId: 2, ns: 'http://x.org/o#', nsList: [] });
  const t = load({ storage: { 'ontolab-v1': legacy } });
  assert.equal(sizeOf(t), 1); assert.equal(t.run('state.classes[0].name'), 'Ancienne'); assert.deepEqual(names(t), ['Mon ontologie']);
  assert.equal(t.storage.get('ontolab-v1'), legacy, 'clé d\'origine conservée');
  const raw = JSON.parse(t.storage.get('ontolab-p-' + idx(t).current)); assert.equal(raw.classes[0].name, 'Ancienne');
  const t2 = load({ storage: Object.fromEntries(t.storage) }); assert.equal(t2.run('projects.list.length'), 1, 'pas de seconde migration');
});

test('les modifications vont dans le projet courant ; deux projets restent indépendants', () => {
  const t = load(); t.run('loadExample()');
  const a = t.run('projects.current');
  const b = t.run("openNewProject('Second',null)");
  assert.equal(sizeOf(t), 0, 'le nouveau projet est vide'); assert.equal(t.run('projects.current'), b);
  t.run("state.classes.push({id:state.nextId++,name:'Seule',parents:[]}); save()");
  t.run(`switchProject('${a}')`); assert.equal(sizeOf(t), 7); assert.equal(t.run('state.classes.some(c=>c.name==="Seule")'), false);
  t.run(`switchProject('${b}')`); assert.deepEqual(t.run('state.classes.map(c=>c.name)'), ['Seule']);
  assert.match(String(t.ctx.document.querySelector('#proj-name').textContent), /Second/);
  const t2 = load({ storage: Object.fromEntries(t.storage) }); assert.equal(t2.run('projects.current'), b, 'le projet ouvert est rouvert'); assert.deepEqual(t2.run('state.classes.map(c=>c.name)'), ['Seule']);
});

test('changer de projet réinitialise annuler / rétablir et la mise en page', () => {
  const t = load(); t.run('loadExample(); state.classes.push({id:state.nextId++,name:"X",parents:[]}); save()');
  assert.ok(t.run('hist.undo.length') > 0);
  t.run("openNewProject('Autre',null)"); assert.equal(t.run('hist.undo.length'), 0); assert.equal(t.run('hist.redo.length'), 0);
  t.run("loadExample()"); assert.equal(sizeOf(t), 7, 'exemple chargé dans le projet vide, sans en créer un autre'); assert.equal(t.run('projects.list.length'), 2);
});

test('renommer (noms uniques), dupliquer, supprimer', () => {
  const t = load(); t.run('loadExample()');
  const a = t.run('projects.current'); const b = t.run("createProject('Autre',null)");
  assert.equal(t.run(`renameProject('${b}','Mon ontologie')`), true); assert.deepEqual(names(t), ['Mon ontologie', 'Mon ontologie (2)']);
  assert.equal(t.run(`renameProject('${b}','  ')`), false);
  const c = t.run(`duplicateProject('${a}')`); assert.deepEqual(t.run(`readProject('${c}').classes.length`), 7); assert.match(names(t)[2], /\(copie\)/);
  t.run(`deleteProject('${c}')`); assert.equal(t.run('projects.list.length'), 2); assert.equal(t.storage.has('ontolab-p-' + c), false);
  t.run(`deleteProject('${a}')`); assert.equal(t.run('projects.current'), b, 'supprimer le projet ouvert ouvre un autre'); assert.equal(sizeOf(t), 0);
  t.run(`deleteProject('${b}')`); assert.equal(t.run('projects.list.length'), 1, 'il reste toujours un projet'); assert.deepEqual(names(t), ['Mon ontologie']);
});

test('« Charger l\'exemple » ne détruit jamais un travail : nouveau projet si le projet courant n\'est pas vide', () => {
  const t = load(); t.run('loadExample()'); assert.equal(t.run('projects.list.length'), 1);
  t.run("state.classes.push({id:state.nextId++,name:'Mon travail',parents:[]}); save()");
  const before = t.run('projects.current'); t.run('loadExample()');
  assert.equal(t.run('projects.list.length'), 2); assert.notEqual(t.run('projects.current'), before);
  assert.ok(t.run(`readProject('${before}').classes.some(c=>c.name==='Mon travail')`), 'le travail est toujours dans l\'ancien projet');
  assert.match(names(t)[1], /Exemple/);
});

test('import : projet vide = remplacé ; sinon nouveau projet (ou remplacement au choix)', () => {
  const t = load();
  const raw = { classes: [{ id: 1, name: 'Importée', parents: [] }], objProps: [], dataProps: [], nextId: 2 };
  assert.deepEqual(t.run('destinationField("x")'), [], 'projet vide : pas de choix');
  t.call('r => placeImported(r,"fichier","new")', raw); assert.equal(t.run('projects.list.length'), 1); assert.equal(t.run('state.classes[0].name'), 'Importée');
  const f = t.run('destinationField("autre")'); assert.equal(f.length, 1); assert.deepEqual(f[0].options.map(o => o.v), ['new', 'replace']);
  t.call('r => placeImported(r,"autre","new")', Object.assign({}, raw, { classes: [{ id: 1, name: 'Deuxième', parents: [] }] }));
  assert.deepEqual(names(t), ['Mon ontologie', 'autre']); assert.equal(t.run('state.classes[0].name'), 'Deuxième');
  t.call('r => placeImported(r,"x","replace")', Object.assign({}, raw, { classes: [{ id: 1, name: 'Remplaçante', parents: [] }] }));
  assert.equal(t.run('projects.list.length'), 2); assert.equal(t.run('state.classes[0].name'), 'Remplaçante');
  assert.equal(t.run('baseName("mon-fichier.v2.ttl")'), 'mon-fichier.v2');
});

test('export et import de tous les projets : ajout sans écrasement, noms dédoublonnés', () => {
  const t = load(); t.run('loadExample()'); t.run("openNewProject('Deuxième',null); state.classes.push({id:state.nextId++,name:'D',parents:[]}); save()");
  t.run('download=(b,n)=>{ globalThis.__dl={json:b.parts[0],name:n}; }'); assert.equal(t.run('exportAllProjects()'), 2);
  const dl = t.ctx.__dl; assert.equal(dl.name, 'ontolab-projets.json');
  const obj = JSON.parse(dl.json); assert.equal(obj.format, 'ontolab-projects'); assert.deepEqual(obj.projects.map(p => p.name), ['Mon ontologie', 'Deuxième']);
  assert.equal(obj.projects[0].state.classes.length, 7);
  const n = t.call('o => importProjectsData(o)', obj); assert.equal(n, 2); assert.deepEqual(names(t), ['Mon ontologie', 'Deuxième', 'Mon ontologie (2)', 'Deuxième (2)']);
  assert.equal(t.run('importProjectsData({projects:[null,{state:{}},{name:"Ok",state:{classes:[]}}]})'), 1, 'entrées invalides ignorées');
});

test('versions : une au plus toutes les 10 minutes, 5 conservées, restauration dans un nouveau projet', () => {
  const t = load(); let T = 1_000_000;
  t.run(`globalThis.__T=${T}; Date.now=()=>__T; lastSnap=0`);
  const tick = ms => { T += ms; t.ctx.__T = T; };
  t.run('save()'); assert.equal(t.run('readVersions(projects.current).length'), 0, 'rien à enregistrer pour une ontologie vide');
  t.run('loadExample()'); assert.equal(t.run('readVersions(projects.current).length'), 1);
  tick(60_000); t.run("state.classes.push({id:state.nextId++,name:'A',parents:[]}); save()"); assert.equal(t.run('readVersions(projects.current).length'), 1, 'moins de 10 minutes');
  for (let i = 0; i < 7; i++) { tick(11 * 60_000); t.run(`state.classes.push({id:state.nextId++,name:'N${i}',parents:[]}); save()`); }
  const vs = t.run('readVersions(projects.current).map(v=>v.t)'); assert.equal(vs.length, 5, '5 versions au plus'); assert.deepEqual(vs, [...vs].sort((a, b) => a - b));
  const cur = t.run('projects.current'), oldest = vs[0];
  const nid = t.run(`restoreVersion('${cur}',${oldest})`); assert.ok(nid); assert.notEqual(t.run('projects.current'), cur);
  assert.match(names(t).at(-1), /Mon ontologie \(version de \d\dh\d\d\)/);
  assert.ok(t.run(`readProject('${cur}').classes.length`) > t.run('state.classes.length'), 'l\'ancien projet est intact, la version est plus ancienne');
  assert.equal(t.run(`restoreVersion('${cur}',12345)`), null);
});

test('stockage plein : l\'application continue, un avertissement est affiché une seule fois', () => {
  const t = load(); t.run('loadExample()');
  let calls = 0; t.ctx.localStorage.setItem = () => { calls++; throw new Error('QuotaExceededError'); };
  t.run("state.classes.push({id:state.nextId++,name:'Z',parents:[]}); save(); save()");
  assert.ok(calls >= 2); assert.match(String(t.ctx.document.querySelector('#status').textContent), /ne peut plus enregistrer/);
  assert.equal(t.run('state.classes.some(c=>c.name==="Z")'), true, 'l\'état en mémoire reste utilisable');
});

test('états de stockage corrompus : repli sur un projet vide, sans exception', () => {
  const t = load({ storage: { 'ontolab-projects': '{pas du json', 'ontolab-p-x': '[1' } });
  assert.equal(t.run('projects.list.length'), 1); assert.equal(sizeOf(t), 0);
  const t2 = load({ storage: { 'ontolab-projects': JSON.stringify({ current: 'inconnu', list: [{ id: 'a', name: 'A' }, { id: 5 }, null] }), 'ontolab-p-a': '[]' } });
  assert.deepEqual(names(t2), ['A']); assert.equal(t2.run('projects.current'), 'a'); assert.equal(sizeOf(t2), 0);
});

test('dialogues : s\'ouvrent sans exception (liste des projets, versions), rendu après changement de projet', () => {
  const t = load(); t.run('loadExample(); openProjects(); openVersions()');
  t.run("openNewProject('B',null); state.sel=null; render()"); t.run("switchProject(projects.list[0].id)"); assert.equal(sizeOf(t), 7);
  t.run("state.sel={kind:'class',id:state.classes[0].id}; ui.panel=true; render()"); assert.match(t.panelHTML(), /<h3>Classe<\/h3>/);
});

test('changer de projet enregistre d\'abord l\'état courant, même si la dernière modification n\'avait pas encore été sauvegardée', () => {
  const t = load(); t.run('loadExample()'); const a = t.run('projects.current');
  t.run("state.classes.push({id:state.nextId++,name:'Pas encore sauvée',parents:[]})");   // pas de save()
  t.run("openNewProject('B',null)"); t.run(`switchProject('${a}')`);
  assert.ok(t.run('state.classes.some(c=>c.name==="Pas encore sauvée")'));
});
