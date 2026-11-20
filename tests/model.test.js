/* Modèle de données : noms, assainissement, migration, héritage, domaine/portée hérités. */
const { test } = require('node:test'); const assert = require('node:assert/strict'); const { load } = require('./harness');

test('localName : caractères interdits, tête, queue', () => {
  const t = load();
  const f = n => t.call('localName', n);
  assert.equal(f('connaît'), 'connaît');
  assert.equal(f('a b/c'), 'a_b_c');
  assert.equal(f('-x'), '_-x');
  assert.equal(f('.x'), '_.x');
  assert.equal(f('fin.'), 'fin_');
  assert.equal(f('   '), 'sans_nom');
  assert.equal(f('Étudiant·e'), 'Étudiant_e');
});

test('nameTaken : unicité sur le nom local, classes et propriétés confondues', () => {
  const t = load(); t.run('loadExample()');
  assert.equal(t.run('nameTaken("Personne")'), true);
  assert.equal(t.run('nameTaken("connaît")'), true);       // propriété objet
  assert.equal(t.run('nameTaken("âge")'), true);           // propriété de donnée
  assert.equal(t.run('nameTaken("Personne",1)'), false);   // soi-même ignoré
  assert.equal(t.run('nameTaken("Nouveau")'), false);
});

test('sanitizeState : ids en chaînes, tableaux absents, éléments invalides, mode invalide', () => {
  const t = load();
  const st = t.call(`s => { const o = sanitizeState(s); return JSON.parse(JSON.stringify(o)); }`, {
    classes: [{ id: '1', name: 'A' }, null, 7, { id: '2', name: 'B', parents: ['1', '99', '2'] }],
    objProps: [{ id: '3', name: 'p', domain: '1', range: '', inverseOf: null }],
    dataProps: 'pas un tableau', mode: 'n\'importe quoi', nextId: 1, view: { x: 'a', y: 1, k: 1 }, ns: 42,
  });
  assert.deepEqual(st.classes.map(c => c.id), [1, 2]);
  assert.deepEqual(st.classes[1].parents, [1], 'parent inconnu et auto-référence retirés');
  assert.equal(st.objProps[0].domain, 1); assert.equal(st.objProps[0].range, null);
  assert.deepEqual(st.dataProps, []);
  assert.equal(st.mode, 'class'); assert.equal(st.view.x, null);
  assert.ok(st.nextId > 3, 'nextId dépasse tous les ids');
  assert.match(st.ns, /^https?:\/\//);
});

test('sanitizeState : migre l\'ancien champ parent vers parents', () => {
  const t = load();
  const st = t.call(`s => JSON.parse(JSON.stringify(sanitizeState(s)))`, { classes: [{ id: 1, name: 'A' }, { id: 2, name: 'B', parent: 1 }, { id: 3, name: 'C', parent: '' }] });
  assert.deepEqual(st.classes.map(c => c.parents), [[], [1], []]);
  assert.ok(!('parent' in st.classes[1]));
});

test('cleanParents : coupe les cycles d\'héritage', () => {
  const t = load();
  const st = t.call(`s => JSON.parse(JSON.stringify(sanitizeState(s)))`, { classes: [{ id: 1, name: 'A', parents: [2] }, { id: 2, name: 'B', parents: [1] }] });
  const n = st.classes.reduce((k, c) => k + c.parents.length, 0);
  assert.equal(n, 1, 'un seul des deux liens du cycle subsiste');
});

test('addParent refuse un cycle et un doublon ; héritage multiple accepté', () => {
  const t = load(); t.run('loadExample()');
  const ids = t.run('Object.fromEntries(state.classes.map(c=>[c.name,c.id]))');
  const parentsOf = n => t.run(`parentsOf(classById(${ids[n]}))`);
  t.run(`addParent('class',${ids.Personne},${ids.Membre})`);            // Membre est sous Personne : cycle
  assert.deepEqual(parentsOf('Personne'), []);
  t.run(`addParent('class',${ids.Membre},${ids.Groupe})`);               // 2e parent
  assert.deepEqual(parentsOf('Membre'), [ids.Personne, ids.Groupe]);
  t.run(`addParent('class',${ids.Membre},${ids.Groupe})`);               // doublon
  assert.equal(parentsOf('Membre').length, 2);
});

test('domaine / portée hérités (A6) : héritage, surcharge, conflit', () => {
  const t = load(); t.run('state.classes=[]; state.objProps=[]; state.dataProps=[]; state.nextId=1');
  const r = t.call(`() => {
    const C=n=>{const c={id:state.nextId++,name:n,parents:[]};state.classes.push(c);return c.id;};
    const A=C('A'),B=C('B'),D=C('D'),E=C('E');
    const P=(n,d,r,ps)=>{const p={id:state.nextId++,name:n,domain:d,range:r,parents:ps||[]};state.objProps.push(p);return p;};
    const p1=P('p1',A,B), p2=P('p2',D,E), c=P('c',null,null,[p1.id]), conf=P('conf',null,null,[p1.id,p2.id]), over=P('over',D,null,[p1.id]);
    const e=(p,f)=>effField(p,f,objById);
    return {inh:[oDom(c),oRng(c)], from:e(c,'domain').from===p1.id, over:[oDom(over),oRng(over)], confDom:e(conf,'domain'), A,B,D,E,
            incomplete:incompleteProps().map(x=>x.name)};
  }`);
  assert.deepEqual(r.inh, [r.A, r.B]);
  assert.equal(r.from, true);
  assert.deepEqual(r.over, [r.D, r.B], 'domaine surchargé, portée héritée');
  assert.equal(r.confDom.id, null); assert.deepEqual(r.confDom.conflict.sort(), [r.A, r.D].sort());
  assert.deepEqual(r.incomplete, ['conf'], 'seul le conflit est « à compléter »');
});

test('effField : boucle de parents sans plantage', () => {
  const t = load();
  const r = t.call(`() => { const a={id:1,domain:null,parents:[2]}, b={id:2,domain:null,parents:[1]}; const m=new Map([[1,a],[2,b]]); return effField(a,'domain',i=>m.get(i)); }`);
  assert.equal(r.id, null);
});

test('deleteClass / suppression : les propriétés liées disparaissent (via confirmation)', async () => {
  const t = load(); t.run('loadExample()');
  // confirmBox s'appuie sur le DOM : on remplace par une confirmation automatique
  t.run('confirmBox=()=>Promise.resolve(true)');
  const before = t.run('state.objProps.length');
  t.run('deleteClass(classById(state.classes.find(c=>c.name==="Groupe").id).id)');
  await new Promise(r => setTimeout(r, 5));
  assert.ok(t.run('state.objProps.length') < before, 'les propriétés objet liées à Groupe sont supprimées');
  assert.equal(t.run('state.classes.some(c=>c.name==="Groupe")'), false);
});
