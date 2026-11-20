/* Analyseur Turtle, export, import, aller-retour, validation externe (Jena, si disponible). */
const { test } = require('node:test'); const assert = require('node:assert/strict');
const fs = require('fs'), os = require('os'), path = require('path'), cp = require('child_process');
const { load, read } = require('./harness');

const parse = (t, txt) => t.call(`txt => { const p = parseTurtle(txt); return { triples: p.triples, prefixes: p.prefixes }; }`, txt);
const tripleSet = (t, txt) => new Set(parse(t, txt).triples.map(x => x.join(' ')));
function importInto(t, txt) {
  return t.call(`txt => { const p = parseTurtle(txt); const r = ontologyFromTriples(p.triples, p.prefixes);
    state = sanitizeState({ classes: r.classes, objProps: r.objProps, dataProps: r.dataProps, nextId: r.nextId, ns: r.ns || state.ns, nsList: r.nsList, meta: r.meta, mode: state.mode });
    return { notes: r.notes }; }`, txt);
}
/* export → import → export : le même ensemble de triplets. */
function assertRoundTrip(t, label) {
  const a = t.run('toTTL(state.ns)');
  const { notes } = importInto(t, a);
  const b = t.run('toTTL(state.ns)');
  const A = tripleSet(t, a), B = tripleSet(t, b);
  assert.deepEqual([...A].filter(x => !B.has(x)), [], label + ' : triplets perdus');
  assert.deepEqual([...B].filter(x => !A.has(x)), [], label + ' : triplets ajoutés');
  return { ttl: a, notes };
}

test('parseTurtle : préfixes, a, listes ; , littéraux et langues', () => {
  const t = load();
  const r = parse(t, `@prefix : <http://e/#> . @prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> .
    :A a :C ; rdfs:label "Un \\"mot\\"\\nligne"@fr, 'x'@en-GB, "42"^^<http://www.w3.org/2001/XMLSchema#int> .`);
  const lit = r.triples.filter(x => x[1].endsWith('label')).map(x => x[2]);
  assert.deepEqual(lit, ['LUn "mot"\nligne\u0001fr', 'Lx\u0001en-GB', 'L42']);
  assert.ok(r.triples.some(x => x[0] === 'Ihttp://e/#A' && x[1].endsWith('#type') && x[2] === 'Ihttp://e/#C'));
});

test('parseTurtle : nœuds anonymes, collections, directives SPARQL, commentaires, @base', () => {
  const t = load();
  const r = parse(t, `# commentaire\nBASE <http://b/>\nPREFIX p: <http://p/>\n<x> p:r [ p:s 1 ; p:t (p:a p:b) ] . # fin`);
  assert.ok(r.triples.some(x => x[0] === 'Ihttp://b/x'));
  assert.equal(r.triples.filter(x => x[1].endsWith('first')).length, 2);
});

test('parseTurtle : erreurs avec numéro de ligne', () => {
  const t = load();
  assert.throws(() => parse(t, 'a:x a a:y .'), /préfixe « a: » non déclaré \(ligne 1\)/);
  assert.throws(() => parse(t, '@prefix : <http://e/#> .\n\n:a :b "ouverte .'), /ligne 3/);
  assert.throws(() => parse(t, '@prefix : <http://e/#> .\n:a :b :c'), /fin de fichier|« \. » attendu/);
});

test('export OWL de l\'exemple : 37 triplets (1 ontologie + 7 classes + 4 subClassOf + 16 propriétés objet + 9 propriétés de donnée)', () => {
  const t = load(); t.run('loadExample()');
  assert.equal(parse(t, t.run('toTTL(state.ns)')).triples.length, 37);
});

test('aller-retour OWL de l\'exemple', () => {
  const t = load(); t.run('loadExample()');
  const { notes } = assertRoundTrip(t, 'exemple');
  assert.deepEqual(notes, []);
});

test('aller-retour RDFS pur : pas de owl:, mêmes triplets', () => {
  const t = load(); t.run('ui.mode="rdfs"; loadExample()');
  const { ttl } = assertRoundTrip(t, 'exemple RDFS');
  assert.ok(!/owl:|owl#/.test(ttl.replace(/^#.*$/gm, '')), 'aucun terme OWL en mode RDFS (hors commentaires)');
  assert.match(ttl, /rdfs:Class/); assert.match(ttl, /rdf:Property/);
});

test('mode RDFS : les caractéristiques OWL restent dans le modèle et ne sont pas exportées', () => {
  const t = load(); t.run('loadExample()');
  const owl = t.run('toTTL(state.ns)'); assert.match(owl, /owl:TransitiveProperty/);
  t.run('ui.mode="rdfs"');
  assert.ok(!/Transitive/.test(t.run('toTTL(state.ns)')));
  t.run('ui.mode="owl"');
  assert.equal(t.run('toTTL(state.ns)'), owl, 'repasser en OWL restitue tout');
});

test('aller-retour avec étiquettes bilingues, commentaires, métadonnées, caractères spéciaux', () => {
  const t = load(); t.run('loadExample()');
  t.run(`state.classes[0].labels=[{lang:'fr',text:'Personne "physique"'},{lang:'en',text:'Person'}]; state.classes[0].comments=[{lang:'fr',text:'Ligne 1\\nLigne\\t2 \\\\ fin'}];
         state.objProps[0].labels=[{lang:'',text:'sans langue'}];
         state.meta={iri:'http://example.org/rando',title:'Randonnées',description:'Mini',lang:'fr',version:'1.0',creators:['E. D.','Autre'],imports:['http://purl.org/dc/terms/']}`);
  const { ttl } = assertRoundTrip(t, 'annotations');
  // l'aller-retour seul ne détecterait pas une perte à l'export : on vérifie aussi l'écriture elle-même
  assert.match(ttl, /rdfs:label "Personne \\"physique\\""@fr/); assert.match(ttl, /rdfs:label "sans langue" \./);
  assert.match(ttl, /rdfs:comment "Ligne 1\\nLigne\\t2 \\\\ fin"@fr/);
  assert.match(ttl, /<http:\/\/purl.org\/dc\/terms\/creator> "Autre"/); assert.match(ttl, /owl:imports <http:\/\/purl.org\/dc\/terms\/>/);
  const r = t.run('({lab:state.classes.find(c=>c.name==="Personne").labels, com:state.classes.find(c=>c.name==="Personne").comments, meta:state.meta})');
  assert.deepEqual(r.lab, [{ lang: 'fr', text: 'Personne "physique"' }, { lang: 'en', text: 'Person' }]);
  assert.equal(r.com[0].text, 'Ligne 1\nLigne\t2 \\ fin');
  assert.deepEqual(r.meta, { iri: 'http://example.org/rando', title: 'Randonnées', description: 'Mini', lang: 'fr', version: '1.0', creators: ['E. D.', 'Autre'], imports: ['http://purl.org/dc/terms/'] });
});

test('mode RDFS : métadonnées sans owl:Ontology ni version/imports', () => {
  const t = load(); t.run('loadExample(); state.meta={iri:"",title:"T",description:"",lang:"fr",version:"2",creators:["A"],imports:["http://x/y"]}; ui.mode="rdfs"');
  const ttl = t.run('toTTL(state.ns)');
  assert.match(ttl, /dc\/terms\/title> "T"@fr/); assert.ok(!/Ontology|versionInfo|imports/.test(ttl));
});

test('aller-retour : espaces de noms propres aux éléments, plusieurs parents, inverses, caractéristiques', () => {
  const t = load();
  t.run('state.classes=[];state.objProps=[];state.dataProps=[];state.nextId=1;state.nsList=[{prefix:"foaf",iri:"http://xmlns.com/foaf/0.1/"}];state.ns="http://e.org/o#"');
  t.run(`(() => { const C=(n,ps,ns)=>{const c={id:state.nextId++,name:n,parents:ps||[]}; if(ns) c.ns=ns; state.classes.push(c); return c.id;};
    const A=C('A'),B=C('B'),P=C('Person',[],'http://xmlns.com/foaf/0.1/'),D=C('D',[A,B]);
    const O=(n,d,r,x)=>{const p=Object.assign({id:state.nextId++,name:n,domain:d,range:r,transitive:false,symmetric:false,functional:false,inverseFunctional:false,inverseOf:null,parents:[]},x||{}); state.objProps.push(p); return p;};
    const p=O('p',A,B,{transitive:true,functional:true}), q=O('q',B,A,{inverseFunctional:true}); p.inverseOf=q.id; q.inverseOf=p.id;
    O('r',P,P,{symmetric:true,ns:'http://xmlns.com/foaf/0.1/'}); O('sub',null,null,{parents:[p.id]});
    state.dataProps.push({id:state.nextId++,name:'d',domain:D,type:'xsd:dateTime',parents:[]}); })()`);
  const { notes } = assertRoundTrip(t, 'structure riche');
  assert.deepEqual(notes, []);
  const s = t.run(`({dparents:state.classes.find(c=>c.name==='D').parents.length, inv:state.objProps.filter(p=>p.inverseOf).length,
    subDom:state.objProps.find(p=>p.name==='sub').domain, ns:state.classes.find(c=>c.name==='Person').ns, ifn:state.objProps.find(p=>p.name==='q').inverseFunctional,
    type:state.dataProps[0].type})`);
  assert.equal(s.dparents, 2); assert.equal(s.inv, 2); assert.equal(s.subDom, null, 'domaine hérité conservé (null)');
  assert.equal(s.ns, 'http://xmlns.com/foaf/0.1/'); assert.equal(s.ifn, true); assert.equal(s.type, 'xsd:dateTime');
});

test('export : domaine/portée hérités omis, explicites écrits (A6)', () => {
  const t = load();
  t.run(`state.classes=[{id:1,name:'A',parents:[]},{id:2,name:'B',parents:[]}]; state.objProps=[{id:3,name:'p',domain:1,range:2,parents:[]},{id:4,name:'c',domain:null,range:null,parents:[3]}]; state.dataProps=[]; state.nextId=5`);
  const ttl = t.run('toTTL(state.ns)');
  const block = ttl.slice(ttl.indexOf(':c a'));
  assert.match(block, /rdfs:subPropertyOf :p/); assert.ok(!/rdfs:domain|rdfs:range/.test(block));
});

test('import de fixtures : espaces de noms multiples (prefixes.ttl)', () => {
  const t = load(); const { notes } = importInto(t, read('prefixes.ttl'));
  const r = t.run(`({classes:state.classes.map(c=>c.name+'|'+(c.ns||'')), ns:state.ns, nsList:state.nsList.map(e=>e.prefix+'='+e.iri), props:state.objProps.map(p=>p.name+'|'+(p.ns||'')), data:state.dataProps.map(p=>p.name+':'+p.type)})`);
  assert.equal(r.ns, 'http://ex.org/zoo#');
  assert.ok(r.classes.includes('Souris|http://other.org/vocab/') && r.classes.includes('Person|http://xmlns.com/foaf/0.1/') && r.classes.includes('Chat|'));
  assert.deepEqual(r.nsList.sort(), ['foaf=http://xmlns.com/foaf/0.1/', 'o=http://other.org/vocab/']);
  assert.ok(r.props.includes('knows|http://xmlns.com/foaf/0.1/'));
  assert.deepEqual(r.data, ['poids:xsd:double']);
  assert.deepEqual(notes, []);
});

test('import de fixtures : héritage multiple (multi.ttl)', () => {
  const t = load(); importInto(t, read('multi.ttl'));
  const dok = t.run(`state.classes.find(c=>c.name==='Doctorant').parents.map(id=>classById(id).name).sort()`);
  assert.deepEqual(dok, ['Enseignant', 'Etudiant']);
});

test('import de fixtures : RDFS pur, propriétés classées objet / donnée par leur portée', () => {
  const t = load(); importInto(t, read('rdfs-pur.ttl'));
  assert.deepEqual(t.run('state.objProps.map(p=>p.name)'), ['connaît']);
  assert.deepEqual(t.run('state.dataProps.map(p=>p.name+":"+p.type)'), ['nom:xsd:string']);
  assert.deepEqual(t.run('state.classes.map(c=>c.name)').sort(), ['Membre', 'Personne']);
});

test('import : propriété sans domaine ni portée → « Thing » ; sous-propriété sans domaine → hérité', () => {
  const t = load();
  const { notes } = importInto(t, `@prefix : <http://e/#> . @prefix owl: <http://www.w3.org/2002/07/owl#> . @prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> .
    :A a owl:Class . :p a owl:ObjectProperty ; rdfs:domain :A ; rdfs:range :A . :fille a owl:ObjectProperty ; rdfs:subPropertyOf :p . :seule a owl:ObjectProperty .`);
  const r = t.run(`({fille:[state.objProps.find(p=>p.name==='fille').domain,state.objProps.find(p=>p.name==='fille').range], seule:state.objProps.find(p=>p.name==='seule'), classes:state.classes.map(c=>c.name)})`);
  assert.deepEqual(r.fille, [null, null]);
  assert.ok(r.classes.includes('Thing') && r.seule.domain != null);
  assert.ok(notes.some(n => /Thing/.test(n)));
});

test('import : signale ce qui n\'est pas représentable (restrictions, individus, caractéristiques non gérées)', () => {
  const t = load();
  const { notes } = importInto(t, `@prefix : <http://e/#> . @prefix owl: <http://www.w3.org/2002/07/owl#> . @prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> .
    :A a owl:Class ; rdfs:subClassOf [ a owl:Restriction ; owl:onProperty :p ; owl:hasValue :x ] . :p a owl:ObjectProperty, owl:AsymmetricProperty ; rdfs:domain :A ; rdfs:range :A .
    :x a owl:NamedIndividual, :A . :p owl:propertyDisjointWith :p2 . :p2 a owl:ObjectProperty .`);
  const txt = notes.join('\n');
  assert.match(txt, /expression\(s\) de classe non reprise/); assert.match(txt, /individu/i); assert.ok(!/Asymmetric/.test(txt), 'AsymmetricProperty est désormais repris (A4)'); assert.match(txt, /propertyDisjointWith/);
});

test('import : plusieurs rdfs:label par langue, doublons éliminés', () => {
  const t = load();
  importInto(t, `@prefix : <http://e/#> . @prefix owl: <http://www.w3.org/2002/07/owl#> . @prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> .
    :A a owl:Class ; rdfs:label "A"@fr, "A"@fr, "A en"@en, "A bis"@fr, " "@fr .`);
  assert.deepEqual(t.run('state.classes[0].labels.map(l=>l.lang+":"+l.text)'), ['fr:A', 'en:A en', 'fr:A bis']);
});

test('import : fichier sans classe ni propriété → rien à importer', () => {
  const t = load();
  importInto(t, '@prefix : <http://e/#> . :x :y :z .');
  assert.equal(t.run('state.classes.length+state.objProps.length+state.dataProps.length'), 0);
});

/* ---- validation externe : Apache Jena (riot), seulement si disponible ---- */
function findRiot() {
  const c = [process.env.JENA_RIOT, path.join(os.homedir(), 'Applications/Jena/apache-jena-6.1.0/bin/riot')].filter(Boolean);
  for (const p of c) if (fs.existsSync(p)) return p;
  try { cp.execFileSync('riot', ['--version'], { stdio: 'ignore' }); return 'riot'; } catch (e) { return null; }
}
const RIOT = findRiot();
test('Jena riot --validate accepte les exports (OWL, RDFS, annotations)', { skip: RIOT ? false : 'Jena (riot) introuvable : définir JENA_RIOT pour activer' }, () => {
  const t = load(); t.run('loadExample()');
  t.run(`setDefinition(state.classes[3].id,null,'equiv','Personne and appartient-à some Groupe'); setDefinition(state.classes[5].id,null,'sub','not (Piste or Guide)'); setDefinition(state.classes[6].id,null,'sub','encadre only (Guide or not Voie) ')`);
  t.run(`setEnd('obj',state.objProps[1],'domain','Personne or Groupe'); setEnd('obj',state.objProps[1],'range','Voie and Membre'); setEnd('data',state.dataProps[2],'domain','Voie or Piste')`);
  t.run('state.objProps[0].asymmetric=true; state.objProps[1].reflexive=true; state.objProps[2].irreflexive=true; state.dataProps[0].functional=true');
  t.run(`addRel('class','disjoint',state.classes[1].id,state.classes[2].id); addRel('class','equivalent',state.classes[3].id,state.classes[4].id); addRel('obj','equivalent',state.objProps[1].id,state.objProps[2].id)`);
  t.run(`state.classes[0].labels=[{lang:'fr',text:'P "x"'}]; state.meta={iri:'',title:'T',description:'',lang:'fr',version:'1',creators:['A'],imports:['http://purl.org/dc/terms/']}`);
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ontolab-')); 
  for (const mode of ['owl', 'rdfs']) {
    t.run(`ui.mode='${mode}'`); const f = path.join(dir, mode + '.ttl'); fs.writeFileSync(f, t.run('toTTL(state.ns)'));
    cp.execFileSync(RIOT, ['--validate', f], { stdio: 'pipe' });
  }
  fs.rmSync(dir, { recursive: true, force: true });
});
