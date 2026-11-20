/* C1 (owl:disjointWith) et C2 (owl:equivalentClass / owl:equivalentProperty) : modèle symétrique, Turtle, import, A5, rendu. */
const { test } = require('node:test'); const assert = require('node:assert/strict'); const { load } = require('./harness');

/* A, B, C, D (D sous A et B), propriétés objet p, q, r et de donnée d1, d2. */
const SETUP = `(() => {
  state.classes=[];state.objProps=[];state.dataProps=[];state.nextId=1;state.nsList=[];
  const C=(n,ps)=>{const c={id:state.nextId++,name:n,parents:ps||[]};state.classes.push(c);return c.id;};
  const A=C('A'),B=C('B'),Cc=C('C'),D=C('D',[A,B]);
  const O=(n,d,r)=>{const p={id:state.nextId++,name:n,domain:d,range:r,transitive:false,symmetric:false,functional:false,inverseFunctional:false,inverseOf:null,parents:[]};state.objProps.push(p);return p;};
  O('p',A,B);O('q',A,B);O('r',B,Cc);
  state.dataProps.push({id:state.nextId++,name:'d1',domain:A,type:'xsd:string',parents:[]},{id:state.nextId++,name:'d2',domain:B,type:'xsd:string',parents:[]});
})()`;
const id = (t, n) => t.run(`(state.classes.concat(state.objProps,state.dataProps).find(x=>x.name==='${n}')).id`);
const rel = (t, kind, n, k) => t.run(`(itemOf('${kind}',${id(t, n)}).${k}||[]).map(i=>itemOf('${kind}',i).name).sort()`);

test('addRel / removeRel : relation symétrique, sans auto-référence ni doublon', () => {
  const t = load(); t.run(SETUP);
  t.run(`addRel('class','disjoint',${id(t, 'A')},${id(t, 'C')})`); t.run(`addRel('class','disjoint',${id(t, 'C')},${id(t, 'A')})`); t.run(`addRel('class','disjoint',${id(t, 'A')},${id(t, 'A')})`);
  assert.deepEqual(rel(t, 'class', 'A', 'disjoint'), ['C']); assert.deepEqual(rel(t, 'class', 'C', 'disjoint'), ['A']);
  t.run(`removeRel('class','disjoint',${id(t, 'C')},${id(t, 'A')})`);
  assert.equal(t.run(`'disjoint' in classById(${id(t, 'A')})`), false, 'liste vide supprimée des deux côtés');
  t.run(`addRel('obj','equivalent',${id(t, 'p')},${id(t, 'q')})`); t.run(`addRel('data','equivalent',${id(t, 'd1')},${id(t, 'd2')})`);
  assert.deepEqual(rel(t, 'obj', 'q', 'equivalent'), ['p']); assert.deepEqual(rel(t, 'data', 'd2', 'equivalent'), ['d1']);
});

test('cleanRels : ids inconnus retirés, relation rendue symétrique (état importé ou ancien)', () => {
  const t = load();
  const st = t.call(`s => JSON.parse(JSON.stringify(sanitizeState(s)))`, { classes: [{ id: 1, name: 'A', disjoint: [2, 9, 1], equivalent: ['3'] }, { id: 2, name: 'B' }, { id: 3, name: 'C' }], objProps: [], dataProps: [] });
  assert.deepEqual(st.classes.map(c => [c.disjoint || null, c.equivalent || null]), [[[2], [3]], [[1], null], [null, [1]]]);
});

test('suppression d\'une classe ou d\'une propriété : les relations pendantes disparaissent', async () => {
  const t = load(); t.run(SETUP); t.run('confirmBox=()=>Promise.resolve(true)');
  t.run(`addRel('class','equivalent',${id(t, 'A')},${id(t, 'C')})`); t.run(`addRel('obj','equivalent',${id(t, 'p')},${id(t, 'q')})`);
  t.run(`deleteClass(${id(t, 'C')})`); t.run(`deleteProp('obj',${id(t, 'q')})`);
  await new Promise(r => setTimeout(r, 10));
  assert.equal(t.run(`'equivalent' in classById(${id(t, 'A')})`), false);
  assert.equal(t.run(`'equivalent' in objById(${id(t, 'p')})`), false);
});

test('export OWL : une seule déclaration par paire, sur l\'élément d\'id le plus petit', () => {
  const t = load(); t.run(SETUP);
  t.run(`addRel('class','disjoint',${id(t, 'A')},${id(t, 'C')})`); t.run(`addRel('class','equivalent',${id(t, 'B')},${id(t, 'C')})`);
  t.run(`addRel('obj','equivalent',${id(t, 'q')},${id(t, 'p')})`); t.run(`addRel('data','equivalent',${id(t, 'd1')},${id(t, 'd2')})`);
  const ttl = t.run('toTTL(state.ns)');
  assert.equal((ttl.match(/owl:disjointWith/g) || []).length, 1); assert.match(ttl, /:A rdf:type owl:Class ;\n    owl:disjointWith :C/);
  assert.equal((ttl.match(/owl:equivalentClass/g) || []).length, 1);
  assert.equal((ttl.match(/owl:equivalentProperty/g) || []).length, 2, 'une pour les propriétés objet, une pour les données');
});

test('mode RDFS : ni écrites ni dessinées, mais conservées', () => {
  const t = load(); t.run(SETUP); t.run(`addRel('class','disjoint',${id(t, 'A')},${id(t, 'C')}); addRel('class','equivalent',${id(t, 'B')},${id(t, 'C')}); addRel('obj','equivalent',${id(t, 'p')},${id(t, 'q')})`);
  t.run('ui.mode="rdfs"; state.sel=null'); t.resetCreated(); t.run('render()');
  assert.ok(!/owl:/.test(t.run('toTTL(state.ns)').replace(/^#.*$/gm, '')));
  assert.equal(t.created().filter(e => e.attrs['data-rel']).length, 0);
  t.run(`state.sel={kind:'class',id:${id(t, 'A')}}; render()`);
  assert.match(t.panelHTML(), /masquées \(mode RDFS\)/);
  t.run('ui.mode="owl"'); t.resetCreated(); t.run('render()');
  assert.equal(t.created().filter(e => e.attrs['data-rel']).length, 2, 'une pastille ⊥ et une pastille ≡');
});

test('aller-retour Turtle : relations conservées dans les deux sens de lecture', () => {
  const t = load(); t.run(SETUP);
  t.run(`addRel('class','disjoint',${id(t, 'A')},${id(t, 'C')}); addRel('class','equivalent',${id(t, 'C')},${id(t, 'B')}); addRel('obj','equivalent',${id(t, 'p')},${id(t, 'r')}); addRel('data','equivalent',${id(t, 'd1')},${id(t, 'd2')})`);
  const a = t.run('toTTL(state.ns)');
  t.call(`txt => { const p=parseTurtle(txt), r=ontologyFromTriples(p.triples,p.prefixes); state=sanitizeState({classes:r.classes,objProps:r.objProps,dataProps:r.dataProps,nextId:r.nextId,ns:r.ns||state.ns,nsList:r.nsList,meta:r.meta,mode:state.mode}); }`, a);
  assert.deepEqual(rel(t, 'class', 'A', 'disjoint'), ['C']); assert.deepEqual(rel(t, 'class', 'C', 'disjoint'), ['A']);
  assert.deepEqual(rel(t, 'class', 'B', 'equivalent'), ['C']); assert.deepEqual(rel(t, 'class', 'C', 'equivalent'), ['B']);
  assert.deepEqual(rel(t, 'obj', 'r', 'equivalent'), ['p']); assert.deepEqual(rel(t, 'data', 'd1', 'equivalent'), ['d2']);
  const b = t.run('toTTL(state.ns)'); // les ids sont renumérotés à l'import : le côté qui porte la déclaration d'une paire peut changer, pas leur nombre
  for (const p of ['owl:disjointWith', 'owl:equivalentClass', 'owl:equivalentProperty']) assert.equal((b.match(new RegExp(p, 'g')) || []).length, (a.match(new RegExp(p, 'g')) || []).length, p);
});

test('import : owl:AllDisjointClasses, relation déclarée d\'un seul côté, cibles inconnues et expressions signalées', () => {
  const t = load();
  const notes = t.call(`txt => { const p=parseTurtle(txt), r=ontologyFromTriples(p.triples,p.prefixes); state=sanitizeState({classes:r.classes,objProps:r.objProps,dataProps:r.dataProps,nextId:r.nextId,ns:r.ns||state.ns,nsList:r.nsList,meta:r.meta,mode:state.mode}); return r.notes; }`,
    `@prefix : <http://e/#> . @prefix owl: <http://www.w3.org/2002/07/owl#> .
     :A a owl:Class . :B a owl:Class . :C a owl:Class . :D a owl:Class ; owl:equivalentClass :A ; owl:disjointWith :Inconnue ; owl:equivalentClass [ a owl:Restriction ; owl:onProperty :p ; owl:someValuesFrom :A ] .
     [ a owl:AllDisjointClasses ; owl:members ( :A :B :C ) ] .`);
  assert.deepEqual(rel(t, 'class', 'A', 'disjoint'), ['B', 'C']); assert.deepEqual(rel(t, 'class', 'B', 'disjoint'), ['A', 'C']);
  assert.deepEqual(rel(t, 'class', 'A', 'equivalent'), ['D'], 'symétrisée');
  assert.ok(notes.some(n => /inconnu/.test(n))); assert.ok(notes.some(n => /1 expression\(s\) de classe non reprise/.test(n)), notes.join('|'));
  assert.ok(!notes.some(n => /non représentables/.test(n)), 'disjointWith / equivalentClass ne sont plus « non représentables »');
});

test('A5 : classe disjointe de son ancêtre, héritage de deux classes disjointes, contradictions', () => {
  const t = load(); t.run(SETUP);
  t.run(`addRel('class','disjoint',${id(t, 'A')},${id(t, 'B')})`);                       // D hérite de A et B
  t.run(`addRel('class','disjoint',${id(t, 'D')},${id(t, 'A')})`);                       // D disjointe de son ancêtre A
  const msgs = t.run('checkOntology().map(x=>x.msg)').join('\n');
  assert.match(msgs, /Classe « D » : elle hérite de « A » et de « B », qui sont disjointes/);
  assert.match(msgs, /Classe « D » disjointe de son ancêtre « A »/);
  t.run(`addRel('class','equivalent',${id(t, 'D')},${id(t, 'A')})`);                      // refusé ? non : A/D à la fois disjointes et équivalentes via import ; l'UI l'interdit
  const m2 = t.run('checkOntology().map(x=>x.msg)').join('\n');
  assert.match(m2, /équivalentes, mais l'une est sous-classe de l'autre/); assert.match(m2, /à la fois équivalentes et disjointes/);
  t.run('ui.mode="rdfs"'); assert.ok(!/disjointes|équivalentes/.test(t.run('checkOntology().map(x=>x.msg)').join('\n')));
});

test('panneau : listes « Disjointe de » / « Équivalente à » sans candidat contradictoire', () => {
  const t = load(); t.run(SETUP); t.run('ui.panel=true');
  t.run(`addRel('class','equivalent',${id(t, 'A')},${id(t, 'C')})`);
  const html = t.panelHTML();
  assert.match(html, /Disjointe de \(owl:disjointWith\)/); assert.match(html, /Équivalente à \(owl:equivalentClass\)/);
  const disj = html.slice(html.indexOf('data-reladd="disjoint"'), html.indexOf('Équivalente à (owl:equivalentClass)'));
  assert.ok(!/>C</.test(disj), 'une classe équivalente ne peut pas être proposée comme disjointe');
  t.run(`state.sel={kind:'obj',id:${id(t, 'p')}}; render()`); assert.match(t.panelHTML(), /Équivalente à \(owl:equivalentProperty\)/);
  t.run(`state.sel={kind:'data',id:${id(t, 'd1')}}; render()`); assert.match(t.panelHTML(), /Équivalente à \(owl:equivalentProperty\)/);
});

test('rendu : double bordure des classes équivalentes, trait ≡ et ⊥, pastille ≡ sur les propriétés ; dans tous les modes compacts', () => {
  const t = load(); t.run(SETUP);
  t.run(`addRel('class','equivalent',${id(t, 'A')},${id(t, 'C')}); addRel('class','disjoint',${id(t, 'B')},${id(t, 'C')}); addRel('obj','equivalent',${id(t, 'p')},${id(t, 'q')})`);
  for (const [d, o] of [[false, false], [true, false], [false, true], [true, true]]) {
    t.run(`ui.mode='owl'; ui.cdata=${d}; ui.cobj=${o}; state.sel=null`); t.resetCreated(); t.run('render()');
    const els = t.created();
    assert.equal(els.filter(e => e.tag === 'ellipse' && e.attrs.fill === 'none').length, 2, 'double bordure sur A et C');
    assert.equal(els.filter(e => e.attrs['data-rel'] === 'equivalent').length, 1); assert.equal(els.filter(e => e.attrs['data-rel'] === 'disjoint').length, 1);
    const texts = els.filter(e => e.tag === 'text').length; assert.ok(texts > 0);
  }
  assert.ok(t.run('exportLegend().svg').includes('owl:disjointWith'));
});

test('mise en page : les classes équivalentes sont rapprochées', () => {
  const t = load(); t.run(SETUP.replace("O('p',A,B);O('q',A,B);O('r',B,Cc);", "O('p',A,B);O('q',A,B);O('r',B,Cc);"));
  const dist = () => t.run(`(() => { layoutCache={key:null,pos:null}; const p=computeLayout(), a=p.get(${id(t, 'A')}), c=p.get(${id(t, 'C')}); return Math.hypot(a.x-c.x,a.y-c.y); })()`);
  const before = dist(); t.run(`addRel('class','equivalent',${id(t, 'A')},${id(t, 'C')})`);
  assert.ok(dist() < before, 'A et C sont plus proches une fois équivalentes (' + dist() + ' < ' + before + ')');
});
