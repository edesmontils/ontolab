/* C4 : restrictions OWL (some, only, min, max, exactly) : modèle, panneau, Turtle, import, dessin, A5, mode RDFS. */
const { test } = require('node:test'); const assert = require('node:assert/strict'); const { load } = require('./harness');

/* Pizza ⊑ hasTopping ∃ Cheese ; Pizza ⊑ ≥2 hasTopping ; Pizza ⊑ nom = 1 (type) ; Veggie sous Pizza. */
const SETUP = `(() => {
  state.classes=[];state.objProps=[];state.dataProps=[];state.nextId=1;state.nsList=[];
  const C=(n,ps)=>{const c={id:state.nextId++,name:n,parents:ps||[]};state.classes.push(c);return c.id;};
  const P=C('Pizza'),Ch=C('Cheese'),M=C('Meat'),V=C('Veggie',[P]);
  state.objProps.push({id:state.nextId++,name:'hasTopping',domain:P,range:Ch,transitive:false,symmetric:false,functional:false,inverseFunctional:false,inverseOf:null,parents:[]});
  state.dataProps.push({id:state.nextId++,name:'price',domain:P,type:'xsd:decimal',parents:[]});
})()`;
const id = (t, n) => t.run(`(state.classes.concat(state.objProps,state.dataProps).find(x=>x.name==='${n}')).id`);
const add = (t, cls, r) => t.run(`addRestriction(${id(t, cls)}, ${JSON.stringify(r)})`);
const restr = (t, cls) => t.run(`(classById(${id(t, cls)}).restrictions||[])`);
const roundTrip = (t, ttl) => t.call(`txt => { const p=parseTurtle(txt), r=ontologyFromTriples(p.triples,p.prefixes); state=sanitizeState({classes:r.classes,objProps:r.objProps,dataProps:r.dataProps,nextId:r.nextId,ns:r.ns||state.ns,nsList:r.nsList,meta:r.meta,mode:state.mode}); return r.notes; }`, ttl);

test('addRestriction / cleanRestrictions : validation et nettoyage', () => {
  const t = load(); t.run(SETUP);
  add(t, 'Pizza', { kind: 'some', prop: id(t, 'hasTopping'), filler: id(t, 'Cheese') });
  add(t, 'Pizza', { kind: 'min', prop: id(t, 'hasTopping'), n: '2.7', filler: null });
  add(t, 'Pizza', { kind: 'only', prop: id(t, 'price'), filler: 'xsd:inconnu' });
  add(t, 'Pizza', { kind: 'bidon', prop: id(t, 'hasTopping') });
  add(t, 'Pizza', { kind: 'some', prop: 999 });
  add(t, 'Pizza', { kind: 'some', prop: id(t, 'hasTopping'), filler: 999 });
  assert.deepEqual(restr(t, 'Pizza').map(r => [r.kind, r.n ?? null, r.filler]), [['some', null, id(t, 'Cheese')], ['min', 2, null], ['only', null, null]]);
});

test('suppression de la propriété ou de la classe visée : restriction retirée', async () => {
  const t = load(); t.run(SETUP); t.run('confirmBox=()=>Promise.resolve(true)');
  add(t, 'Pizza', { kind: 'some', prop: id(t, 'hasTopping'), filler: id(t, 'Cheese') }); add(t, 'Pizza', { kind: 'max', prop: id(t, 'price'), n: 3 });
  t.run(`deleteClass(${id(t, 'Cheese')})`); await new Promise(r => setTimeout(r, 10));
  assert.deepEqual(restr(t, 'Pizza').map(r => r.kind), ['max']);
  t.run(`deleteProp('data',${id(t, 'price')})`); await new Promise(r => setTimeout(r, 10));
  assert.deepEqual(restr(t, 'Pizza'), []);
});

test('export Turtle : some, only, cardinalités non qualifiées et qualifiées, données', () => {
  const t = load(); t.run(SETUP); const top = id(t, 'hasTopping');
  add(t, 'Pizza', { kind: 'some', prop: top, filler: id(t, 'Cheese') }); add(t, 'Pizza', { kind: 'only', prop: top, filler: null });
  add(t, 'Pizza', { kind: 'min', prop: top, n: 2, filler: null }); add(t, 'Pizza', { kind: 'max', prop: top, n: 5, filler: id(t, 'Meat') });
  add(t, 'Pizza', { kind: 'exactly', prop: id(t, 'price'), n: 1, filler: null }); add(t, 'Pizza', { kind: 'some', prop: id(t, 'price'), filler: 'xsd:decimal' });
  const ttl = t.run('toTTL(state.ns)');
  assert.match(ttl, /rdfs:subClassOf \[ a owl:Restriction ; owl:onProperty :hasTopping ; owl:someValuesFrom :Cheese \]/);
  assert.match(ttl, /owl:allValuesFrom owl:Thing/);
  assert.match(ttl, /owl:minCardinality "2"\^\^xsd:nonNegativeInteger \]/);
  assert.match(ttl, /owl:maxQualifiedCardinality "5"\^\^xsd:nonNegativeInteger ; owl:onClass :Meat/);
  assert.match(ttl, /owl:onProperty :price ; owl:cardinality "1"/);
  assert.match(ttl, /owl:onProperty :price ; owl:someValuesFrom xsd:decimal/);
});

test('aller-retour : toutes les formes de restriction sont relues à l\'identique', () => {
  const t = load(); t.run(SETUP); const top = id(t, 'hasTopping');
  add(t, 'Pizza', { kind: 'some', prop: top, filler: id(t, 'Cheese') }); add(t, 'Pizza', { kind: 'only', prop: top, filler: null }); add(t, 'Pizza', { kind: 'min', prop: top, n: 2, filler: null });
  add(t, 'Pizza', { kind: 'max', prop: top, n: 5, filler: id(t, 'Meat') }); add(t, 'Veggie', { kind: 'exactly', prop: id(t, 'price'), n: 1, filler: 'xsd:decimal' }); add(t, 'Veggie', { kind: 'only', prop: id(t, 'price'), filler: null });
  const before = ['Pizza', 'Veggie'].map(n => restr(t, n).map(r => [r.kind, r.n ?? null, t.run(`propById(${r.prop}).name`), r.filler == null ? null : (typeof r.filler === 'string' ? r.filler : t.run(`classById(${r.filler}).name`))]));
  const notes = roundTrip(t, t.run('toTTL(state.ns)'));
  const after = ['Pizza', 'Veggie'].map(n => restr(t, n).map(r => [r.kind, r.n ?? null, t.run(`propById(${r.prop}).name`), r.filler == null ? null : (typeof r.filler === 'string' ? r.filler : t.run(`classById(${r.filler}).name`))]));
  assert.deepEqual(after, before); assert.deepEqual(notes, []);
});

test('import : restrictions non reprises signalées (hasValue, propriété inconnue, classe définie), anonymes distinguées', () => {
  const t = load();
  const notes = roundTrip(t, `@prefix : <http://e/#> . @prefix owl: <http://www.w3.org/2002/07/owl#> . @prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> . @prefix xsd: <http://www.w3.org/2001/XMLSchema#> .
    :A a owl:Class ; rdfs:subClassOf [ a owl:Restriction ; owl:onProperty :p ; owl:hasValue :x ],
                                     [ a owl:Restriction ; owl:onProperty :inconnue ; owl:someValuesFrom :A ],
                                     [ a owl:Restriction ; owl:onProperty :p ; owl:someValuesFrom :A ],
                                     [ a owl:Class ; owl:unionOf ( :A :B ) ] .
    :B a owl:Class ; owl:equivalentClass [ a owl:Restriction ; owl:onProperty :p ; owl:someValuesFrom :A ] .
    :p a owl:ObjectProperty ; rdfs:domain :A ; rdfs:range :A .`);
  assert.equal(t.run('state.classes.find(c=>c.name==="A").restrictions.length'), 1);
  assert.ok(notes.some(n => /2 expression\(s\) de classe non reprise/.test(n)), notes.join('|'));  // hasValue et propriété inconnue
  // l'union anonyme et la classe définie par une restriction sont désormais reprises (C5)
  assert.deepEqual(t.run('state.classes.find(c=>c.name==="A").defs.map(d=>d.kind+":"+exprToText(d.expr))'), ['sub:A or B']);
  assert.deepEqual(t.run('state.classes.find(c=>c.name==="B").defs.map(d=>d.kind+":"+exprToText(d.expr))'), ['equiv:p some A']);
});

test('import : cardinalités qualifiées sur donnée, doublons éliminés', () => {
  const t = load();
  roundTrip(t, `@prefix : <http://e/#> . @prefix owl: <http://www.w3.org/2002/07/owl#> . @prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> . @prefix xsd: <http://www.w3.org/2001/XMLSchema#> .
    :A a owl:Class ; rdfs:subClassOf [ a owl:Restriction ; owl:onProperty :d ; owl:minQualifiedCardinality "2"^^xsd:nonNegativeInteger ; owl:onDataRange xsd:integer ],
                                     [ a owl:Restriction ; owl:onProperty :d ; owl:minQualifiedCardinality "2"^^xsd:nonNegativeInteger ; owl:onDataRange xsd:integer ] .
    :d a owl:DatatypeProperty ; rdfs:domain :A ; rdfs:range xsd:integer .`);
  assert.deepEqual(t.run('state.classes[0].restrictions'), [{ kind: 'min', prop: t.run('state.dataProps[0].id'), n: 2, filler: 'xsd:integer' }]);
});

test('mode RDFS : ni exportées, ni dessinées, ni éditables ; conservées', () => {
  const t = load(); t.run(SETUP);
  add(t, 'Pizza', { kind: 'some', prop: id(t, 'hasTopping'), filler: id(t, 'Cheese') });
  t.run('ui.mode="rdfs"; ui.panel=true; state.sel=null'); t.resetCreated(); t.run('render()');
  assert.ok(!/Restriction/.test(t.run('toTTL(state.ns)'))); assert.equal(t.created().filter(e => e.attrs.class === 'rst').length, 0);
  t.run(`state.sel={kind:'class',id:${id(t, 'Pizza')}}; render()`); assert.match(t.panelHTML(), /Restrictions masquées \(mode RDFS\)/);
  t.run('ui.mode="owl"'); assert.equal(restr(t, 'Pizza').length, 1); assert.match(t.run('toTTL(state.ns)'), /owl:Restriction/);
});

test('rendu : flèche en tirets + pastille pour une restriction vers une classe ; rien pour donnée ou cardinalité non qualifiée ; parallèles décalées', () => {
  const t = load(); t.run(SETUP); const top = id(t, 'hasTopping');
  add(t, 'Pizza', { kind: 'some', prop: top, filler: id(t, 'Cheese') }); add(t, 'Pizza', { kind: 'min', prop: top, n: 2, filler: id(t, 'Cheese') });
  add(t, 'Pizza', { kind: 'max', prop: top, n: 4, filler: null }); add(t, 'Pizza', { kind: 'some', prop: id(t, 'price'), filler: 'xsd:decimal' });
  for (const [d, o] of [[false, false], [true, true]]) {
    t.run(`ui.cdata=${d}; ui.cobj=${o}; state.sel=null`); t.resetCreated(); t.run('render()');
    const els = t.created();
    assert.equal(els.filter(e => e.attrs.class === 'rst').length, 2, 'deux pastilles (les deux restrictions qualifiées vers Cheese)');
    assert.equal(els.filter(e => e.tag === 'line' && e.attrs['stroke-dasharray'] === '7 4').length, 2);
    const ys = els.filter(e => e.tag === 'line' && e.attrs['stroke-dasharray'] === '7 4').map(e => [+e.attrs.x1, +e.attrs.y1].join());
    assert.equal(new Set(ys).size, 2, 'les deux flèches parallèles sont décalées');
  }
  const txt = t.run('classById(1).restrictions.map(r=>restrictionText(r))');
  assert.deepEqual(txt, ['∃ hasTopping Cheese', '≥2 hasTopping Cheese', '≤4 hasTopping', '∃ price decimal']);
  assert.match(t.run('exportLegend().svg'), /owl:Restriction/);
});

test('mise en page : une restriction rapproche les deux classes (et invalide le cache)', () => {
  const t = load(); t.run(SETUP);
  const dist = () => t.run(`(() => { const p=computeLayout(), a=p.get(${id(t, 'Pizza')}), c=p.get(${id(t, 'Meat')}); return Math.hypot(a.x-c.x,a.y-c.y); })()`);
  const before = dist();
  add(t, 'Pizza', { kind: 'some', prop: id(t, 'hasTopping'), filler: id(t, 'Meat') });
  assert.ok(dist() < before, 'sans réinitialiser le cache : ' + dist() + ' < ' + before);
});

test('mise en page : les classes équivalentes sont rapprochées sans vider le cache à la main', () => {
  const t = load(); t.run(SETUP);
  const dist = () => t.run(`(() => { const p=computeLayout(), a=p.get(${id(t, 'Cheese')}), c=p.get(${id(t, 'Meat')}); return Math.hypot(a.x-c.x,a.y-c.y); })()`);
  const before = dist(); t.run(`addRel('class','equivalent',${id(t, 'Cheese')},${id(t, 'Meat')})`);
  assert.ok(dist() < before);
});

test('panneau : restrictions propres éditables, héritées en gris, bouton désactivé sans propriété', () => {
  const t = load(); t.run(SETUP); t.run('ui.panel=true');
  add(t, 'Pizza', { kind: 'min', prop: id(t, 'hasTopping'), n: 2, filler: null });
  t.run(`state.sel={kind:'class',id:${id(t, 'Veggie')}}; render()`);
  let html = t.panelHTML();
  assert.match(html, /héritées de « Pizza »/); assert.match(html, /≥2 hasTopping/); assert.match(html, /Aucune restriction propre/);
  t.run(`state.sel={kind:'class',id:${id(t, 'Pizza')}}; render()`); html = t.panelHTML();
  assert.match(html, /class="attr rst"/); assert.match(html, /<input class="r-n"[^>]*value="2"/); assert.ok(!/id="pf-addrst" disabled/.test(html));
  t.run('state.objProps=[]; state.dataProps=[]; cleanRestrictions(); render()'); assert.match(t.panelHTML(), /id="pf-addrst" disabled/);
});

test('A5 : bornes contradictoires (y compris héritées), doublons', () => {
  const t = load(); t.run(SETUP); const top = id(t, 'hasTopping');
  add(t, 'Pizza', { kind: 'min', prop: top, n: 3, filler: null }); add(t, 'Veggie', { kind: 'max', prop: top, n: 1, filler: null });
  add(t, 'Meat', { kind: 'some', prop: top, filler: null }); add(t, 'Meat', { kind: 'some', prop: top, filler: null }); add(t, 'Meat', { kind: 'exactly', prop: top, n: 0, filler: null });
  const m = t.run('checkOntology().map(x=>x.lvl+" "+x.msg)').join('\n');
  assert.match(m, /warn Classe « Veggie » : restrictions contradictoires sur « hasTopping » \(au moins 3 et au plus 1\)/);
  assert.match(m, /warn Classe « Meat » : restrictions contradictoires sur « hasTopping » \(au moins 1 et au plus 0\)/);
  assert.match(m, /info Classe « Meat » : restriction en double/);
  assert.ok(!/Classe « Pizza » : restrictions contradictoires/.test(m));
  t.run('ui.mode="rdfs"'); assert.ok(!/restrictions contradictoires/.test(t.run('checkOntology().map(x=>x.msg)').join('\n')));
});

test('états enregistrés : restrictions mal formées nettoyées au chargement', () => {
  const t = load();
  const st = t.call(`s => JSON.parse(JSON.stringify(sanitizeState(s)))`, { classes: [{ id: 1, name: 'A', restrictions: [{ kind: 'min', prop: 2, n: -4, filler: '1' }, 'x', null, { kind: 'some', prop: 9 }] }], objProps: [{ id: 2, name: 'p', domain: 1, range: 1 }], dataProps: [] });
  assert.deepEqual(st.classes[0].restrictions, [{ kind: 'min', prop: 2, n: 1, filler: 1 }]);
});
