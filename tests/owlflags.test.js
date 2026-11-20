/* A4 : Asymmetric / Reflexive / Irreflexive (propriétés objet) et Functional (propriétés de donnée). */
const { test } = require('node:test'); const assert = require('node:assert/strict'); const { load } = require('./harness');

const SETUP = `(() => {
  state.classes=[];state.objProps=[];state.dataProps=[];state.nextId=1;state.nsList=[];
  const A={id:state.nextId++,name:'A',parents:[]},B={id:state.nextId++,name:'B',parents:[]}; state.classes.push(A,B);
  const O=(n,d,r,x)=>{const p=Object.assign({id:state.nextId++,name:n,domain:d,range:r,transitive:false,symmetric:false,functional:false,inverseFunctional:false,inverseOf:null,parents:[]},x||{});state.objProps.push(p);return p;};
  O('asy',A.id,A.id,{asymmetric:true}); O('ref',A.id,A.id,{reflexive:true}); O('irr',A.id,B.id,{irreflexive:true}); O('plain',A.id,B.id);
  state.dataProps.push({id:state.nextId++,name:'dF',domain:A.id,type:'xsd:string',parents:[],functional:true},{id:state.nextId++,name:'dN',domain:A.id,type:'xsd:integer',parents:[]});
})()`;
const roundTrip = (t, ttl) => t.call(`txt => { const p=parseTurtle(txt), r=ontologyFromTriples(p.triples,p.prefixes); state=sanitizeState({classes:r.classes,objProps:r.objProps,dataProps:r.dataProps,nextId:r.nextId,ns:r.ns||state.ns,nsList:r.nsList,meta:r.meta,mode:state.mode}); return r.notes; }`, ttl);

test('export OWL : les quatre nouvelles caractéristiques sont écrites', () => {
  const t = load(); t.run(SETUP); const ttl = t.run('toTTL(state.ns)');
  assert.match(ttl, /:asy a owl:ObjectProperty, owl:AsymmetricProperty ;/);
  assert.match(ttl, /:ref a owl:ObjectProperty, owl:ReflexiveProperty ;/);
  assert.match(ttl, /:irr a owl:ObjectProperty, owl:IrreflexiveProperty ;/);
  assert.match(ttl, /:dF a owl:DatatypeProperty, owl:FunctionalProperty ;/);
  assert.match(ttl, /:dN a owl:DatatypeProperty ;/);
});

test('aller-retour : caractéristiques relues, sans note « non représentable »', () => {
  const t = load(); t.run(SETUP);
  const notes = roundTrip(t, t.run('toTTL(state.ns)'));
  const flags = t.run(`Object.fromEntries(state.objProps.map(p=>[p.name,['asymmetric','reflexive','irreflexive'].filter(k=>p[k])]))`);
  assert.deepEqual(flags, { asy: ['asymmetric'], ref: ['reflexive'], irr: ['irreflexive'], plain: [] });
  assert.deepEqual(t.run('state.dataProps.map(p=>p.name+":"+(p.functional?1:0))').sort(), ['dF:1', 'dN:0']);
  assert.deepEqual(notes, []);
});

test('import : propriété typée seulement AsymmetricProperty reconnue comme objet ; transitive / symétrique sur donnée signalées', () => {
  const t = load();
  const notes = roundTrip(t, `@prefix : <http://e/#> . @prefix owl: <http://www.w3.org/2002/07/owl#> . @prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> . @prefix xsd: <http://www.w3.org/2001/XMLSchema#> .
    :A a owl:Class . :q a owl:IrreflexiveProperty ; rdfs:domain :A ; rdfs:range :A . :d a owl:DatatypeProperty, owl:SymmetricProperty, owl:FunctionalProperty ; rdfs:domain :A ; rdfs:range xsd:string .`);
  assert.deepEqual(t.run('state.objProps.map(p=>p.name+":"+p.irreflexive)'), ['q:true']);
  assert.equal(t.run('state.dataProps[0].functional'), true);
  assert.ok(notes.some(n => /SymmetricProperty sur une propriété de donnée/.test(n)), notes.join('|'));
});

test('mode RDFS : non exportées, non dessinées, indiquées dans le panneau ; conservées', () => {
  const t = load(); t.run(SETUP); t.run('ui.mode="rdfs"; ui.panel=true');
  assert.ok(!/Asymmetric|Reflexive|Irreflexive|FunctionalProperty/.test(t.run('toTTL(state.ns)').replace(/^#.*$/gm, '')));
  const id = n => t.run(`(state.objProps.concat(state.dataProps).find(p=>p.name==='${n}')).id`);
  t.run(`state.sel={kind:'obj',id:${id('asy')}}; render()`); assert.match(t.panelHTML(), /Caractéristiques OWL masquées \(mode RDFS\) : asymétrique/);
  t.run(`state.sel={kind:'data',id:${id('dF')}}; render()`); assert.match(t.panelHTML(), /Caractéristiques OWL masquées \(mode RDFS\) : fonctionnelle/); assert.ok(!/pf-dfunc/.test(t.panelHTML()));
  t.run('state.sel=null; ui.cobj=true'); t.resetCreated(); t.run('render()');
  assert.equal(t.created().filter(e => e.tag === 'circle' && e.attrs.r === '7.5').length, 0);
  assert.equal(t.created().filter(e => e.attrs['stroke-dasharray'] === '5 3' && e.tag === 'ellipse').length, 0);
  t.run('ui.mode="owl"; ui.cobj=false'); t.resetCreated(); t.run('render()');
  assert.ok(t.created().some(e => e.tag === 'ellipse' && e.attrs['stroke-dasharray'] === '5 3'), 'la propriété de donnée fonctionnelle a une bordure en tirets en OWL');
});

test('panneau OWL : cases à cocher des quatre caractéristiques', () => {
  const t = load(); t.run(SETUP); t.run('ui.panel=true');
  const id = n => t.run(`(state.objProps.concat(state.dataProps).find(p=>p.name==='${n}')).id`);
  t.run(`state.sel={kind:'obj',id:${id('plain')}}; render()`);
  for (const k of ['pf-asym', 'pf-refl', 'pf-irr', 'pf-func', 'pf-ifunc', 'pf-trans', 'pf-sym']) assert.ok(t.panelHTML().includes('id="' + k + '"'), k);
  t.run(`state.sel={kind:'data',id:${id('dF')}}; render()`); assert.match(t.panelHTML(), /id="pf-dfunc" checked/);
  t.run(`state.sel={kind:'data',id:${id('dN')}}; render()`); assert.ok(!/id="pf-dfunc" checked/.test(t.panelHTML()) && /id="pf-dfunc"/.test(t.panelHTML()));
});

test('compact : pastilles A, R, I ; infobulle en mode normal', () => {
  const t = load(); t.run(SETUP);
  t.run('ui.cobj=true; state.sel=null'); t.resetCreated(); t.run('render()');
  const letters = t.created().filter(e => e.tag === 'text').length; assert.ok(letters > 0);
  assert.equal(t.created().filter(e => e.tag === 'circle' && e.attrs.r === '7.5').length, 3, 'une pastille pour chacune des trois propriétés');
  assert.match(t.run('exportLegend().svg'), /A asymétrique · R réflexive · I irréflexive/);
});

test('A5 : combinaisons contradictoires et restrictions OWL 2 DL', () => {
  const t = load(); t.run(SETUP);
  t.run(`(()=>{ const p=n=>state.objProps.find(x=>x.name===n); p('asy').symmetric=true; p('ref').irreflexive=true; p('irr').transitive=true; p('plain').reflexive=true; p('asy').reflexive=true; })()`);
  const m = t.run('checkOntology().map(x=>x.msg)').join('\n');
  assert.match(m, /« asy » est à la fois asymétrique et symétrique/);
  assert.match(m, /« ref » est à la fois réflexive et irréflexive/);
  assert.match(m, /« asy » est à la fois réflexive et asymétrique/);
  assert.match(m, /« irr » est irréflexive et transitive : OWL 2 DL/);
  assert.match(m, /« plain » est réflexive mais son domaine « A » et sa portée « B »/);
  t.run('ui.mode="rdfs"'); assert.ok(!/réflexive|asymétrique/.test(t.run('checkOntology().map(x=>x.msg)').join('\n')));
});

test('statistiques et liste OWL : comptent les nouvelles caractéristiques', () => {
  const t = load(); t.run(SETUP);
  assert.deepEqual(t.run('owlList(state.objProps[0])'), ['asymétrique']); assert.deepEqual(t.run('owlList(state.dataProps[0])'), ['fonctionnelle']);
  t.run('render()'); assert.match(String(t.ctx.document.querySelector('#stats').textContent), /triples/);
});
