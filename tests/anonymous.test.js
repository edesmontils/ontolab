/* C5 : classes anonymes (and / or / not / restrictions imbriquées), syntaxe de Manchester, Turtle, dessin, A5. */
const { test } = require('node:test'); const assert = require('node:assert/strict'); const { load } = require('./harness');

const SETUP = `(() => {
  state.classes=[];state.objProps=[];state.dataProps=[];state.nextId=1;state.nsList=[];
  const C=(n,ps)=>{const c={id:state.nextId++,name:n,parents:ps||[]};state.classes.push(c);return c.id;};
  const P=C('Personne'),E=C('Etudiant',[P]),Pr=C('Professeur',[P]),Ch=C('Chat'),Q=C("Classe d'or"),T=C('Parent');
  const O=(n,d,r)=>{const p={id:state.nextId++,name:n,domain:d,range:r,transitive:false,symmetric:false,functional:false,inverseFunctional:false,inverseOf:null,parents:[]};state.objProps.push(p);return p;};
  O('aEnfant',P,P); O('suit',E,Pr);
  state.dataProps.push({id:state.nextId++,name:'age',domain:P,type:'xsd:integer',parents:[]});
})()`;
const parse = (t, txt) => t.call('txt => parseClassExpr(txt)', txt);
const def = (t, cls, kind, txt) => t.call(`(c,k,x) => setDefinition(classByName(c).id,null,k,x)`, cls, kind, txt);
const defs = (t, cls) => t.run(`(classByName('${cls}').defs||[]).map(d=>d.kind+': '+exprToText(d.expr))`);
const roundTrip = (t, ttl) => t.call(`txt => { const p=parseTurtle(txt), r=ontologyFromTriples(p.triples,p.prefixes); state=sanitizeState({classes:r.classes,objProps:r.objProps,dataProps:r.dataProps,nextId:r.nextId,ns:r.ns||state.ns,nsList:r.nsList,meta:r.meta,mode:state.mode}); return r.notes; }`, ttl);
const mk = () => { const t = load(); t.run(SETUP); t.run("globalThis.classByName=n=>state.classes.find(c=>c.name===n)"); return t; };

test('analyse : and / or / not, priorités, parenthèses ; le texte est reformaté canoniquement', () => {
  const t = mk();
  const cases = [
    ['Etudiant or Professeur', 'Etudiant or Professeur'], ['Personne and not Chat', 'Personne and not Chat'],
    ['Etudiant and Professeur or Chat', 'Etudiant and Professeur or Chat'],           // and lie plus fort que or
    ['(Etudiant or Professeur) and Chat', '(Etudiant or Professeur) and Chat'],
    ['Etudiant or (Professeur and Chat)', 'Etudiant or Professeur and Chat'],        // parenthèses superflues retirées
    ['not (Etudiant or Chat)', 'not (Etudiant or Chat)'], ["not not Chat", "not not Chat"],
    ["Personne and 'Classe d\\'or'", "Personne and 'Classe d\\'or'"], ['PERSONNE AND chat', 'Personne and Chat'],   // mots-clés et noms insensibles à la casse
    ['Etudiant   or\n  Chat', 'Etudiant or Chat'],
  ];
  for (const [src, want] of cases) { const r = parse(t, src); assert.ok(r.expr, src + ' : ' + r.error); assert.equal(t.call('e => exprToText(e)', r.expr), want, src); }
});

test('analyse : restrictions, cardinalités, fillers imbriqués, données', () => {
  const t = mk();
  const cases = [
    ['aEnfant some Personne', 'aEnfant some Personne'], ['aEnfant only (Etudiant or Professeur)', 'aEnfant only (Etudiant or Professeur)'],
    ['aEnfant min 2', 'aEnfant min 2'], ['aEnfant max 3 Etudiant', 'aEnfant max 3 Etudiant'], ['aEnfant exactly 1 not Chat', 'aEnfant exactly 1 not Chat'],
    ['Personne and aEnfant some (Etudiant and suit some Professeur)', 'Personne and aEnfant some (Etudiant and suit some Professeur)'],
    ['aEnfant some Thing', 'aEnfant some Thing'], ['age some integer', 'age some xsd:integer'], ['age min 1 xsd:integer', 'age min 1 xsd:integer'], ['age some Literal', 'age some Literal'],
    ['not (aEnfant some Chat)', 'not (aEnfant some Chat)'],
  ];
  for (const [src, want] of cases) { const r = parse(t, src); assert.ok(r.expr, src + ' : ' + r.error); assert.equal(t.call('e => exprToText(e)', r.expr), want, src);
    const again = parse(t, want); assert.deepEqual(again.expr, r.expr, 'le texte canonique se relit à l\'identique : ' + want); }
});

test('analyse : erreurs expliquées en français, avec suggestion et position', () => {
  const t = mk();
  const err = s => parse(t, s).error;
  assert.match(err(''), /vide/);
  assert.match(err('Etudiant or'), /incompl/); assert.match(err('(Etudiant or Chat'), /Parenthèse fermante/); assert.match(err('Etudiant Chat'), /Mot inattendu « Chat »/);
  assert.match(err('Etudian or Chat'), /Classe inconnue : « Etudian » — vouliez-vous « Etudiant »/);
  assert.match(err('aParent some Chat'), /Propriété inconnue/); assert.match(err('and Chat'), /Nom de classe attendu à la place de « and »/);
  assert.match(err('aEnfant min deux'), /Nombre entier attendu/); assert.match(err('age some chaine'), /Type de donnée inconnu/);
  assert.match(err('Etudiant ) Chat'), /inattendue/); assert.match(err("Chat and 'ouvert"), /Caractère inattendu|inconnu/);
  assert.match(parse(t, 'Chat').expr ? 'ok' : 'x', /ok/);
});

test('setDefinition : ajoute, remplace, refuse une classe nommée seule', () => {
  const t = mk();
  assert.deepEqual(def(t, 'Parent', 'equiv', 'Personne and aEnfant some Personne'), { ok: true });
  assert.deepEqual(defs(t, 'Parent'), ['equiv: Personne and aEnfant some Personne']);
  assert.match(def(t, 'Parent', 'sub', 'Chat').error, /relation simple entre deux classes nommées/);
  assert.match(def(t, 'Parent', 'sub', 'Chat or').error, /incompl/);
  t.run("setDefinition(classByName('Parent').id,0,'sub','not Chat')"); assert.deepEqual(defs(t, 'Parent'), ['sub: not Chat']);
});

test('suppression d\'une classe, d\'une propriété ou d\'un type cité : la définition est retirée', async () => {
  const t = mk(); t.run('confirmBox=()=>Promise.resolve(true)');
  def(t, 'Parent', 'equiv', 'Personne and aEnfant some Personne'); def(t, 'Parent', 'sub', 'not Chat'); def(t, 'Etudiant', 'sub', 'Chat or Professeur');
  t.run("deleteClass(classByName('Chat').id)"); await new Promise(r => setTimeout(r, 10));
  assert.deepEqual(defs(t, 'Parent'), ['equiv: Personne and aEnfant some Personne']); assert.deepEqual(defs(t, 'Etudiant'), []);
  t.run("deleteProp('obj',state.objProps.find(p=>p.name==='aEnfant').id)"); await new Promise(r => setTimeout(r, 10));
  assert.deepEqual(defs(t, 'Parent'), []);
});

test('sanitizeState : expressions mal formées nettoyées', () => {
  const t = load();
  const st = t.call(`s => JSON.parse(JSON.stringify(sanitizeState(s)))`, { classes: [{ id: 1, name: 'A', defs: [
    { kind: 'equiv', expr: { t: 'or', args: [{ t: 'class', id: 2 }, { t: 'class', id: '1' }] } }, { kind: 'bidon', expr: { t: 'class', id: 2 } }, { kind: 'sub', expr: { t: 'and', args: [{ t: 'class', id: 2 }] } },
    { kind: 'sub', expr: { t: 'class', id: 2 } }, { kind: 'sub', expr: { t: 'not', arg: { t: 'class', id: 99 } } }, { kind: 'sub', expr: { t: 'rst', kind: 'some', prop: 7, filler: { t: 'dt', v: 'xsd:string' } } }, null] }, { id: 2, name: 'B' }],
    objProps: [{ id: 7, name: 'p', domain: 1, range: 1 }], dataProps: [] });
  assert.deepEqual(st.classes[0].defs, [{ kind: 'equiv', expr: { t: 'or', args: [{ t: 'class', id: 2 }, { t: 'class', id: 1 }] } }]);
});

test('export Turtle : union, intersection, complément, restrictions imbriquées, cardinalités qualifiées, données', () => {
  const t = mk();
  def(t, 'Parent', 'equiv', 'Personne and aEnfant some Personne'); def(t, 'Etudiant', 'sub', 'not Chat'); def(t, 'Chat', 'sub', 'Etudiant or Professeur');
  def(t, 'Professeur', 'sub', 'aEnfant max 3 Etudiant'); def(t, 'Personne', 'sub', 'age min 1 xsd:integer'); def(t, 'Etudiant', 'sub', 'aEnfant only (Etudiant or not Chat)');
  const ttl = t.run('toTTL(state.ns)');
  assert.match(ttl, /owl:equivalentClass \[ a owl:Class ; owl:intersectionOf \( :Personne \[ a owl:Restriction ; owl:onProperty :aEnfant ; owl:someValuesFrom :Personne \] \) \]/);
  assert.match(ttl, /rdfs:subClassOf \[ a owl:Class ; owl:complementOf :Chat \]/);
  assert.match(ttl, /rdfs:subClassOf \[ a owl:Class ; owl:unionOf \( :Etudiant :Professeur \) \]/);
  assert.match(ttl, /owl:maxQualifiedCardinality "3"\^\^xsd:nonNegativeInteger ; owl:onClass :Etudiant/);
  assert.match(ttl, /owl:onProperty :age ; owl:minQualifiedCardinality "1"\^\^xsd:nonNegativeInteger ; owl:onDataRange xsd:integer/);
  assert.match(ttl, /owl:allValuesFrom \[ a owl:Class ; owl:unionOf \( :Etudiant \[ a owl:Class ; owl:complementOf :Chat \] \) \]/);
});

test('aller-retour : les expressions sont relues à l\'identique (formes imbriquées comprises)', () => {
  const t = mk();
  const set = [['Parent', 'equiv', 'Personne and aEnfant some Personne'], ['Etudiant', 'sub', 'not Chat'], ['Chat', 'sub', 'Etudiant or Professeur'], ['Professeur', 'sub', 'aEnfant max 3 Etudiant'],
    ['Personne', 'sub', 'age min 1 xsd:integer'], ['Etudiant', 'sub', 'aEnfant only (Etudiant or not Chat)'], ['Parent', 'equiv', 'aEnfant exactly 2'], ['Chat', 'equiv', 'not (Personne or Professeur)']];
  set.forEach(([c, k, x]) => assert.equal(def(t, c, k, x).ok, true, x));
  const before = Object.fromEntries(['Parent', 'Etudiant', 'Chat', 'Professeur', 'Personne'].map(n => [n, defs(t, n).sort()]));
  const notes = roundTrip(t, t.run('toTTL(state.ns)'));
  const after = Object.fromEntries(['Parent', 'Etudiant', 'Chat', 'Professeur', 'Personne'].map(n => [n, defs(t, n).sort()]));
  assert.deepEqual(after, before); assert.deepEqual(notes, []);
});

test('import : oneOf, hasValue et références inconnues sont signalés sans casser le reste', () => {
  const t = load();
  const notes = roundTrip(t, `@prefix : <http://e/#> . @prefix owl: <http://www.w3.org/2002/07/owl#> . @prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> .
    :A a owl:Class ; owl:equivalentClass [ a owl:Class ; owl:oneOf ( :x :y ) ] ;
        rdfs:subClassOf [ a owl:Class ; owl:unionOf ( :A :B :Inconnue ) ], [ a owl:Class ; owl:unionOf ( :A :B ) ], [ a owl:Restriction ; owl:onProperty :p ; owl:someValuesFrom [ a owl:Class ; owl:unionOf ( :A :B ) ] ] .
    :B a owl:Class . :p a owl:ObjectProperty ; rdfs:domain :A ; rdfs:range :B .`);
  assert.deepEqual(t.run('state.classes.find(c=>c.name==="A").defs.map(d=>d.kind+": "+exprToText(d.expr))'), ['sub: A or B', 'sub: p some (A or B)']);
  assert.ok(notes.some(n => /2 expression\(s\) de classe non reprise/.test(n)), notes.join('|'));
});

test('mode RDFS : masquées, non exportées, non dessinées ; conservées', () => {
  const t = mk(); def(t, 'Parent', 'equiv', 'Etudiant or Professeur');
  t.run("ui.mode='rdfs'; ui.panel=true; state.sel=null"); t.resetCreated(); t.run('render()');
  assert.ok(!/unionOf|equivalentClass/.test(t.run('toTTL(state.ns)'))); assert.equal(t.created().filter(e => e.attrs.class === 'opn').length, 0);
  t.run("state.sel={kind:'class',id:classByName('Parent').id}; render()"); assert.match(t.panelHTML(), /Classes anonymes masquées \(mode RDFS\)/);
  t.run("ui.mode='owl'"); assert.equal(defs(t, 'Parent').length, 1);
});

test('rendu : nœud ∩ ∪ ¬ pour une expression simple ; rien pour une expression imbriquée ; sous-classe = flèche creuse', () => {
  const t = mk();
  def(t, 'Parent', 'equiv', 'Etudiant and Professeur'); def(t, 'Chat', 'sub', 'not Personne'); def(t, 'Personne', 'equiv', 'Etudiant or Professeur'); def(t, 'Etudiant', 'sub', 'Personne and aEnfant some Chat');
  t.run("ui.cdata=false; ui.cobj=false; state.sel=null"); t.resetCreated(); t.run('render()');
  const els = t.created(), ops = els.filter(e => e.attrs.class === 'opn');
  assert.deepEqual(ops.map(e => e.attrs['data-op']).sort(), ['and', 'not', 'or'], 'trois nœuds ; l\'expression imbriquée n\'en a pas');
  assert.equal(els.filter(e => e.tag === 'line' && e.attrs['stroke-dasharray'] === '3 3').length >= 0, true);
  assert.equal(els.filter(e => e.tag === 'line' && e.attrs['marker-end'] === 'url(#m-sub)').length >= 1, true);
  assert.deepEqual(['Etudiant and Professeur', 'not Personne', 'Etudiant or Professeur', 'Personne and aEnfant some Chat'].map(x => parse(t, x).expr ? 1 : 0), [1, 1, 1, 1]);
  assert.match(t.run('exportLegend().svg'), /classe anonyme/);
});

test('mise en page : la classe définie et ses opérandes forment un groupe ; le cache est invalidé', () => {
  const t = mk();
  const pos = () => t.run(`(() => { const p=computeLayout(); return [...p].map(([id,q])=>[id,Math.round(q.x),Math.round(q.y)]); })()`);
  const before = JSON.stringify(pos()); def(t, 'Parent', 'equiv', 'Chat or Personne');
  assert.notEqual(JSON.stringify(pos()), before, 'la disposition est recalculée sans vider le cache à la main');
  const d = t.run(`(() => { const p=computeLayout(), a=p.get(classByName('Parent').id); return ['Chat','Personne'].map(n=>{ const c=p.get(classByName(n).id); return Math.hypot(a.x-c.x,a.y-c.y); }); })()`);
  assert.ok(d.every(x => x < 450), 'opérandes proches : ' + d);
});

test('restriction simple saisie comme « sous-classe de » : ajoutée aux restrictions (C4), pas aux définitions', () => {
  const t = mk();
  const r = def(t, 'Etudiant', 'sub', 'aEnfant min 1 Etudiant'); assert.deepEqual(r, { ok: true, moved: 'restriction' });
  assert.deepEqual(t.run("classByName('Etudiant').restrictions.map(r=>restrictionText(r))"), ['≥1 aEnfant Etudiant']); assert.deepEqual(defs(t, 'Etudiant'), []);
  assert.equal(def(t, 'Etudiant', 'sub', 'aEnfant some (Etudiant or Chat)').moved, undefined, 'filler complexe : reste une définition');
  assert.equal(def(t, 'Etudiant', 'equiv', 'aEnfant some Chat').moved, undefined, 'équivalence : reste une définition');
});

test('panneau : lignes éditables, ligne d\'ajout, aide de syntaxe', () => {
  const t = mk(); t.run('ui.panel=true'); def(t, 'Parent', 'equiv', 'Personne and aEnfant some Personne');
  t.run("state.sel={kind:'class',id:classByName('Parent').id}; render()");
  const html = t.panelHTML();
  assert.match(html, /Classes anonymes/); assert.match(html, /class="attr def" data-i="0"/); assert.match(html, /class="attr def" data-i="new"/);
  assert.match(html, /value="Personne and aEnfant some Personne"/); assert.match(html, /placeholder="ex\. : Personne and/); assert.match(html, /<code>p some C<\/code>/);
});

test('A5 : définition qui se cite elle-même', () => {
  const t = mk(); def(t, 'Parent', 'equiv', 'Personne and aEnfant some Parent');
  assert.match(t.run('checkOntology().map(x=>x.msg)').join('\n'), /Classe « Parent » : sa définition .* se cite elle-même/);
  t.run("ui.mode='rdfs'"); assert.ok(!/se cite elle-même/.test(t.run('checkOntology().map(x=>x.msg)').join('\n')));
});

test('annuler / rétablir : les définitions font partie de l\'historique', () => {
  const t = mk(); t.run('trackHistory()'); def(t, 'Parent', 'equiv', 'Etudiant or Professeur'); assert.equal(defs(t, 'Parent').length, 1);
  t.run('undo()'); assert.equal(defs(t, 'Parent').length, 0); t.run('redo()'); assert.equal(defs(t, 'Parent').length, 1);
});
