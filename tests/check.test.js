/* A5 : vérification de cohérence. */
const { test } = require('node:test'); const assert = require('node:assert/strict'); const { load } = require('./harness');

const DEFECTS = `(() => {
  loadExample(); state.meta=newMeta();
  const [Pe,Gr,Vo]=state.classes;
  const O=(n,d,r,x)=>{const p=Object.assign({id:state.nextId++,name:n,domain:d,range:r,transitive:false,symmetric:false,functional:false,inverseFunctional:false,inverseOf:null,parents:[]},x||{});state.objProps.push(p);return p;};
  O('ft',Pe.id,Pe.id,{transitive:true,functional:true}); O('sym',Pe.id,Gr.id,{symmetric:true});
  const a=O('aaa',Pe.id,Gr.id), b=O('bbb',Pe.id,Gr.id); a.inverseOf=b.id;
  O('Mauvais',Pe.id,Gr.id); O('rien',null,null); O('sousP',Vo.id,Vo.id,{parents:[state.objProps[0].id]});
  state.classes.push({id:state.nextId++,name:'chat',parents:[]},{id:state.nextId++,name:'Chat',parents:[]},{id:state.nextId++,name:'Seule',parents:[]});
})()`;

test('exemple : seule remarque = ontologie sans titre', () => {
  const t = load(); t.run('loadExample()');
  const r = t.run('checkOntology()');
  assert.deepEqual(r.map(x => x.kind), ['meta']);
});

test('ontologie défectueuse : chaque défaut est signalé, points à corriger avant suggestions', () => {
  const t = load(); t.run(DEFECTS);
  const r = t.run('checkOntology()'); const msgs = r.map(x => x.lvl + ' ' + x.msg).join('\n');
  assert.match(msgs, /warn Propriété « rien » : domaine et portée/);
  assert.match(msgs, /warn « ft » est à la fois fonctionnelle et transitive/);
  assert.match(msgs, /warn « sym » est symétrique mais son domaine/);
  assert.match(msgs, /warn « aaa » et son inverse « bbb » : domaine et portée ne sont pas croisés/);
  assert.match(msgs, /warn « sousP » : Domaine « Voie » : devrait être « Personne »/);
  assert.match(msgs, /warn Noms très proches : « chat », « Chat »/);
  assert.match(msgs, /info Classe « Seule » isolée/);
  assert.match(msgs, /info Classe « chat » : par convention/);
  assert.match(msgs, /info Propriété « Mauvais » : par convention/);
  const firstInfo = r.findIndex(x => x.lvl === 'info'), lastWarn = r.map(x => x.lvl).lastIndexOf('warn');
  assert.ok(lastWarn < firstInfo, 'les avertissements précèdent les suggestions');
});

test('mode RDFS : pas de contrôle propre à OWL', () => {
  const t = load(); t.run(DEFECTS); t.run('ui.mode="rdfs"');
  const msgs = t.run('checkOntology()').map(x => x.msg).join('\n');
  assert.ok(!/fonctionnelle et transitive|symétrique mais|inverse/.test(msgs));
  assert.match(msgs, /Noms très proches/);
});

test('inverse réciproque correcte : aucune remarque', () => {
  const t = load(); t.run('loadExample()');
  t.run(`(()=>{ const [Pe,Gr]=state.classes; const O=(n,d,r)=>{const p={id:state.nextId++,name:n,domain:d,range:r,inverseOf:null,parents:[]};state.objProps.push(p);return p;};
    const a=O('dirige',Pe.id,Gr.id), b=O('estDirigePar',Gr.id,Pe.id); a.inverseOf=b.id; b.inverseOf=a.id; })()`);
  assert.ok(!t.run('checkOntology()').some(x => /inverse/.test(x.msg)));
});

test('Noms accentués ou en casse différente : détectés comme proches', () => {
  const t = load(); t.run('state.classes=[{id:1,name:"Étudiant",parents:[]},{id:2,name:"Etudiant",parents:[]}]; state.objProps=[]; state.dataProps=[]; state.nextId=3');
  assert.ok(t.run('checkOntology()').some(x => /Noms très proches/.test(x.msg)));
});
