/* C3 : domaine / portée multiples ou en expression (union, intersection…). */
const { test } = require('node:test'); const assert = require('node:assert/strict'); const { load } = require('./harness');

const SETUP = `(() => {
  state.classes=[];state.objProps=[];state.dataProps=[];state.nextId=1;state.nsList=[];
  const C=(n,ps)=>{const c={id:state.nextId++,name:n,parents:ps||[]};state.classes.push(c);return c.id;};
  C('Animal'); C('Chat',[1]); C('Chien',[1]); C('Roue'); C('Vivant');
  const O=(n,d,r,x)=>{const p=Object.assign({id:state.nextId++,name:n,domain:d,range:r,transitive:false,symmetric:false,functional:false,inverseFunctional:false,inverseOf:null,parents:[]},x||{});state.objProps.push(p);return p;};
  O('aPour',1,4); O('suit',2,3);
  state.dataProps.push({id:state.nextId++,name:'nom',domain:1,type:'xsd:string',parents:[]});
  globalThis.cls=n=>state.classes.find(c=>c.name===n); globalThis.op=n=>state.objProps.find(p=>p.name===n); globalThis.dp=n=>state.dataProps.find(p=>p.name===n);
})()`;
const mk = () => { const t = load(); t.run(SETUP); return t; };
const setEnd = (t, kind, name, field, text) => t.call(`(k,n,f,x) => setEnd(k,(k==='obj'?op:dp)(n),f,x)`, kind, name, field, text);
const roundTrip = (t, ttl) => t.call(`txt => { const p=parseTurtle(txt), r=ontologyFromTriples(p.triples,p.prefixes); state=sanitizeState({classes:r.classes,objProps:r.objProps,dataProps:r.dataProps,nextId:r.nextId,ns:r.ns||state.ns,nsList:r.nsList,meta:r.meta,mode:state.mode}); globalThis.cls=n=>state.classes.find(c=>c.name===n); globalThis.op=n=>state.objProps.find(p=>p.name===n); globalThis.dp=n=>state.dataProps.find(p=>p.name===n); return r.notes; }`, ttl);

test('setEnd : union, intersection, classe seule (devient un id), erreurs', () => {
  const t = mk();
  assert.deepEqual(setEnd(t, 'obj', 'aPour', 'domain', 'Chat or Chien'), { ok: true });
  assert.equal(t.run("exprToText(op('aPour').domain)"), 'Chat or Chien');
  assert.deepEqual(setEnd(t, 'obj', 'aPour', 'range', 'Roue and Vivant'), { ok: true }); assert.equal(t.run("op('aPour').range.t"), 'and');
  assert.deepEqual(setEnd(t, 'obj', 'aPour', 'domain', 'Chat'), { ok: true }); assert.equal(t.run("op('aPour').domain"), t.run("cls('Chat').id"), 'une classe seule redevient un simple id');
  assert.match(setEnd(t, 'obj', 'aPour', 'range', 'Roue or').error, /incompl/); assert.match(setEnd(t, 'data', 'nom', 'domain', 'Chatt or Chien').error, /Classe inconnue : « Chatt » — vouliez-vous « Chat »/);
});

test('ancrage et classes dessinées : union = une par opérande, intersection / complexe = la première classe', () => {
  const t = mk();
  setEnd(t, 'obj', 'aPour', 'domain', 'Chat or Chien or Roue'); setEnd(t, 'obj', 'aPour', 'range', 'Roue and Vivant'); setEnd(t, 'obj', 'suit', 'domain', 'not Chat');
  const names = ids => ids.map(i => t.run(`classById(${i}).name`));
  assert.deepEqual(names(t.run("endClasses(oDomV(op('aPour')))")), ['Chat', 'Chien', 'Roue']);
  assert.deepEqual(names(t.run("endClasses(oRngV(op('aPour')))")), ['Roue']);
  assert.equal(t.run("classById(oDom(op('aPour'))).name"), 'Chat'); assert.equal(t.run("classById(oDom(op('suit'))).name"), 'Chat');
  assert.equal(t.run("endClasses({t:'rst',kind:'some',prop:1,filler:null})").length, 0, 'une expression sans classe nommée n\'a pas d\'ancrage');
});

test('héritage A6 : la propriété fille hérite d\'une expression ; conflit expression / classe', () => {
  const t = mk(); setEnd(t, 'obj', 'aPour', 'domain', 'Chat or Chien');
  t.run("state.objProps.push({id:state.nextId++,name:'fille',domain:null,range:null,parents:[op('aPour').id]})");
  assert.equal(t.run("exprToText(oDomV(op('fille')))"), 'Chat or Chien'); assert.equal(t.run("classById(oDom(op('fille'))).name"), 'Chat');
  t.run("state.objProps.push({id:state.nextId++,name:'deux',domain:null,range:null,parents:[op('aPour').id,op('suit').id]})");
  assert.equal(t.run("oDomV(op('deux'))"), null); assert.equal(t.run("effField(op('deux'),'domain',objById).conflict.length"), 2);
  assert.ok(t.run("inhWarnList('obj',op('aPour')).length>=0"), 'pas de plantage avec des expressions');
});

test('inverses : croisés par valeur (expressions comprises) ; casse automatiquement si l\'extrémité change', () => {
  const t = mk();
  setEnd(t, 'obj', 'aPour', 'domain', 'Chat or Chien'); setEnd(t, 'obj', 'suit', 'range', 'Chat or Chien'); setEnd(t, 'obj', 'aPour', 'range', 'Roue'); setEnd(t, 'obj', 'suit', 'domain', 'Roue');
  assert.equal(t.run("invOK(op('aPour'),op('suit'))"), true);
  t.run("op('aPour').inverseOf=op('suit').id; op('suit').inverseOf=op('aPour').id");
  setEnd(t, 'obj', 'aPour', 'domain', 'Chat or Vivant');
  assert.equal(t.run("op('aPour').inverseOf"), null); assert.equal(t.run("op('suit').inverseOf"), null);
});

test('sanitizeState : expressions de domaine / portée validées', () => {
  const t = load();
  const st = t.call(`s => JSON.parse(JSON.stringify(sanitizeState(s)))`, { classes: [{ id: 1, name: 'A' }, { id: 2, name: 'B' }], objProps: [
    { id: 3, name: 'p', domain: { t: 'or', args: [{ t: 'class', id: 1 }, { t: 'class', id: '2' }] }, range: { t: 'class', id: 2 } },
    { id: 4, name: 'q', domain: { t: 'or', args: [{ t: 'class', id: 1 }, { t: 'class', id: 99 }] }, range: { t: 'bidon' } }, { id: 5, name: 'r', domain: '1', range: '' }], dataProps: [{ id: 6, name: 'd', domain: { t: 'and', args: [{ t: 'class', id: 1 }, { t: 'class', id: 2 }] }, type: 'xsd:string' }] });
  assert.deepEqual(st.objProps[0].domain, { t: 'or', args: [{ t: 'class', id: 1 }, { t: 'class', id: 2 }] }); assert.equal(st.objProps[0].range, 2);
  assert.equal(st.objProps[1].domain, null); assert.equal(st.objProps[1].range, null); assert.equal(st.objProps[2].domain, 1); assert.equal(st.objProps[2].range, null);
  assert.equal(st.dataProps[0].domain.t, 'and');
});

test('export : intersection = plusieurs rdfs:domain (aussi en RDFS) ; union / complexe = OWL seulement', () => {
  const t = mk();
  setEnd(t, 'obj', 'aPour', 'domain', 'Chat or Chien'); setEnd(t, 'obj', 'aPour', 'range', 'Roue and Vivant'); setEnd(t, 'data', 'nom', 'domain', 'Chat or not Roue');
  let ttl = t.run('toTTL(state.ns)');
  assert.match(ttl, /rdfs:domain \[ a owl:Class ; owl:unionOf \( :Chat :Chien \) \]/); assert.match(ttl, /rdfs:range :Roue ;\n    rdfs:range :Vivant/);
  assert.match(ttl, /rdfs:domain \[ a owl:Class ; owl:unionOf \( :Chat \[ a owl:Class ; owl:complementOf :Roue \] \) \]/);
  t.run("ui.mode='rdfs'"); ttl = t.run('toTTL(state.ns)');
  assert.ok(!/unionOf|complementOf/.test(ttl), 'union non écrite en RDFS'); assert.match(ttl, /rdfs:range :Roue ;\n    rdfs:range :Vivant/, 'intersection écrite en RDFS');
  assert.ok(!/rdfs:domain \[/.test(ttl));
});

test('import : plusieurs rdfs:domain = intersection ; owl:unionOf repris ; aller-retour fidèle', () => {
  const t = mk();
  setEnd(t, 'obj', 'aPour', 'domain', 'Chat or Chien'); setEnd(t, 'obj', 'aPour', 'range', 'Roue and Vivant'); setEnd(t, 'obj', 'suit', 'range', 'not Roue and Vivant'); setEnd(t, 'data', 'nom', 'domain', 'Chat or Chien');
  const before = t.run("({d:exprToText(op('aPour').domain),r:exprToText(op('aPour').range),s:exprToText(op('suit').range),n:exprToText(dp('nom').domain)})");
  const notes = roundTrip(t, t.run('toTTL(state.ns)'));
  assert.deepEqual(t.run("({d:exprToText(op('aPour').domain),r:exprToText(op('aPour').range),s:exprToText(op('suit').range),n:exprToText(dp('nom').domain)})"), before);
  assert.deepEqual(notes, []);
});

test('import : domaines multiples de fichiers RDFS usuels, expression non représentable signalée', () => {
  const t = load();
  const notes = roundTrip(t, `@prefix : <http://e/#> . @prefix owl: <http://www.w3.org/2002/07/owl#> . @prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> .
    :A a owl:Class . :B a owl:Class . :C a owl:Class .
    :p a owl:ObjectProperty ; rdfs:domain :A, :B ; rdfs:range [ a owl:Class ; owl:unionOf ( :B :C ) ] .
    :q a owl:ObjectProperty ; rdfs:domain [ a owl:Class ; owl:oneOf ( :x :y ) ] ; rdfs:range :C .`);
  assert.equal(t.run("exprToText(op('p').domain)"), 'A and B'); assert.equal(t.run("exprToText(op('p').range)"), 'B or C');
  assert.ok(notes.some(n => /1 domaine\(s\) \/ portée\(s\) non repris/.test(n)), notes.join('|'));
  assert.ok(!notes.some(n => /ignoré/.test(n)), 'plus de message « une seule valeur par propriété »');
});

test('import : paire d\'inverses dont les extrémités sont des unions', () => {
  const t = load();
  roundTrip(t, `@prefix : <http://e/#> . @prefix owl: <http://www.w3.org/2002/07/owl#> . @prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> .
    :A a owl:Class . :B a owl:Class . :C a owl:Class .
    :p a owl:ObjectProperty ; owl:inverseOf :q ; rdfs:domain [ a owl:Class ; owl:unionOf ( :A :B ) ] ; rdfs:range :C . :q a owl:ObjectProperty ; rdfs:domain :C ; rdfs:range [ a owl:Class ; owl:unionOf ( :A :B ) ] .`);
  assert.deepEqual(t.run('state.objProps.map(p=>p.inverseOf!=null)'), [true, true]);
});

test('rendu : une flèche par classe de l\'union (objet et donnée), marque ∪ / ∩, pastille en compact', () => {
  const t = mk();
  setEnd(t, 'obj', 'aPour', 'domain', 'Chat or Chien'); setEnd(t, 'obj', 'aPour', 'range', 'Roue and Vivant'); setEnd(t, 'data', 'nom', 'domain', 'Chat or Chien or Roue');
  const solid = els => els.filter(e => e.tag === 'line' && e.attrs.stroke === '#5B7C29' && e.attrs['stroke-width'] === '2');
  t.run("ui.cobj=false; ui.cdata=false; state.sel=null"); t.resetCreated(); t.run('render()');
  const els = t.created();
  assert.equal(solid(els).length, 1, 'une flèche supplémentaire pour la 2e classe du domaine de aPour');
  assert.equal(els.filter(e => e.tag === 'line' && e.attrs['marker-end'] === 'url(#m-arr-red)').length, 3, 'nom : flèche principale + 2 supplémentaires (Chien, Roue)');
  t.run("ui.cobj=true"); t.resetCreated(); t.run('render()');
  assert.ok(t.created().filter(e => e.tag === 'circle' && e.attrs.r === '7.5').length >= 1, 'pastille ∪ en mode compact');
  t.run("ui.mode='rdfs'"); t.resetCreated(); t.run('render()');
  assert.equal(t.created().filter(e => e.tag === 'circle' && e.attrs.r === '7.5').length, 0, 'pas de marque en RDFS');
  assert.ok(solid(t.created()).length === 1, 'les flèches restent dessinées en RDFS (le modèle est conservé)');
});

test('mise en page : les classes de l\'union sont liées à l\'autre extrémité (cache invalidé)', () => {
  const t = mk();
  const dist = () => t.run(`(() => { const p=computeLayout(), a=p.get(cls('Vivant').id), c=p.get(cls('Roue').id); return Math.hypot(a.x-c.x,a.y-c.y); })()`);
  const before = dist(); setEnd(t, 'obj', 'aPour', 'domain', 'Vivant or Roue'); setEnd(t, 'obj', 'aPour', 'range', 'Chat');
  const after = t.run(`(() => { const p=computeLayout(); return ['Vivant','Roue'].map(n=>{ const a=p.get(cls(n).id), c=p.get(cls('Chat').id); return Math.hypot(a.x-c.x,a.y-c.y); }); })()`);
  assert.ok(after.every(d => d < 450), after + ' (avant : ' + before + ')');
});

test('suppression d\'une classe citée dans une union : la propriété disparaît (comme pour une classe simple)', async () => {
  const t = mk(); t.run('confirmBox=()=>Promise.resolve(true)'); setEnd(t, 'obj', 'aPour', 'domain', 'Chat or Chien');
  t.run("deleteClass(cls('Chien').id)"); await new Promise(r => setTimeout(r, 10));
  assert.equal(t.run("state.objProps.some(p=>p.name==='aPour')"), false); assert.equal(t.run("state.objProps.some(p=>p.name==='suit')"), false, 'suit a Chien pour portée');
});

test('panneau : option « Expression… » (OWL), valeur affichée, saisie, note en RDFS', () => {
  const t = mk(); t.run('ui.panel=true');
  t.run("state.sel={kind:'obj',id:op('aPour').id}; render()"); assert.match(t.panelHTML(), /<option value="__expr">✎ Expression…<\/option>/);
  setEnd(t, 'obj', 'aPour', 'domain', 'Chat or Chien');
  assert.match(t.panelHTML(), /<option value="__cur" selected>✎ Chat or Chien<\/option>/);
  t.run("ui.endEdit={kind:'obj',id:op('aPour').id,field:'domain'}; render()"); assert.match(t.panelHTML(), /id="pf-domain-expr" value="Chat or Chien"/); assert.match(t.panelHTML(), /Revenir à la liste/);
  t.run("state.sel={kind:'class',id:cls('Chat').id}; render()"); assert.equal(t.run('ui.endEdit'), null, 'la saisie ne survit pas au changement de sélection');
  t.run("ui.mode='rdfs'; state.sel={kind:'obj',id:op('aPour').id}; render()"); assert.ok(!/__expr/.test(t.panelHTML())); assert.match(t.panelHTML(), /Expression OWL : non écrite en mode RDFS/);
  t.run("state.sel={kind:'data',id:dp('nom').id}; render()"); assert.match(t.panelHTML(), /Domaine \(rdfs:domain\)/);
});

test('propriété incomplète si l\'expression n\'a aucune classe nommée ; A5 sans plantage', () => {
  const t = mk(); setEnd(t, 'obj', 'aPour', 'domain', 'suit some Thing');
  assert.ok(t.run('incompleteProps().some(x=>x.name==="aPour")'), 'pas d\'ancrage = « à compléter »'); t.run('checkOntology()');
});
