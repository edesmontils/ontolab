/* Mise en page : déterminisme, valeurs finies, absence de chevauchement de classes, temps raisonnable. */
const { test } = require('node:test'); const assert = require('node:assert/strict'); const { load } = require('./harness');

/* Ontologie pseudo-aléatoire reproductible : n classes (arbre + quelques héritages multiples), propriétés objet et de donnée. */
const GEN = n => `(() => {
  let seed=12345; const rnd=()=>{ seed=(seed*1103515245+12345)&0x7fffffff; return seed/0x7fffffff; };
  state.classes=[];state.objProps=[];state.dataProps=[];state.nextId=1;state.nsList=[];
  for(let i=0;i<${n};i++){ const ps=[]; if(i>0) ps.push(state.classes[Math.floor(rnd()*i)].id); if(i>5&&rnd()<0.1) ps.push(state.classes[Math.floor(rnd()*i)].id);
    state.classes.push({id:state.nextId++,name:'Classe'+i+(i%3?'':'_longueNomDeClasse'),parents:[...new Set(ps)]}); }
  for(let i=0;i<${n}*1.2;i++){ const d=state.classes[Math.floor(rnd()*${n})].id, r=state.classes[Math.floor(rnd()*${n})].id;
    state.objProps.push({id:state.nextId++,name:'prop'+i,domain:d,range:r,transitive:false,symmetric:false,functional:false,inverseFunctional:false,inverseOf:null,parents:[]}); }
  for(let i=0;i<${n};i++) state.dataProps.push({id:state.nextId++,name:'donnee'+i,domain:state.classes[Math.floor(rnd()*${n})].id,type:'xsd:string',parents:[]});
})()`;

const positions = t => t.run('(() => { layoutCache={key:null,pos:null}; const p=computeLayout(); return [...p].map(([id,q])=>({id,x:q.x,y:q.y,rx:q.rx,ry:q.ry})); })()');

/* NB : pas de seuil de durée. Sous Node (contexte vm) le code tourne ~10 fois plus lentement que dans un navigateur ; la durée réelle
   (60 classes denses : mise en page ≈ 2 s, placement des propriétés ≈ 0,9 s par rendu, navigateur) est suivie dans la ROADMAP (« Dette connue »). */
test('24 classes : positions finies, sans chevauchement notable', () => {
  const t = load(); t.run(GEN(24));
  const P = positions(t);
  assert.equal(P.length, 24);
  assert.ok(P.every(p => Number.isFinite(p.x) && Number.isFinite(p.y)), 'toutes les positions sont finies');
  let overlaps = 0;
  for (let i = 0; i < P.length; i++) for (let j = i + 1; j < P.length; j++) {
    const a = P[i], b = P[j], dx = (a.x - b.x) / (a.rx + b.rx), dy = (a.y - b.y) / (a.ry + b.ry);
    if (dx * dx + dy * dy < 1) overlaps++;
  }
  assert.ok(overlaps <= 2, overlaps + ' paires de classes se chevauchent');
});

test('la mise en page est déterministe', () => {
  const a = positions((() => { const t = load(); t.run(GEN(14)); return t; })());
  const b = positions((() => { const t = load(); t.run(GEN(14)); return t; })());
  assert.deepEqual(a, b);
});

test('rendu complet de 14 classes dans tous les modes compacts, sans exception ni NaN', () => {
  const t = load(); t.run(GEN(14));
  for (const [d, o] of [[false, false], [true, false], [false, true], [true, true]]) {
    t.run(`ui.cdata=${d}; ui.cobj=${o}; state.sel=null`); t.resetCreated(); t.run('render()');
    const bad = t.created().filter(e => Object.values(e.attrs).some(v => /NaN|Infinity|undefined/.test(v)));
    assert.equal(bad.length, 0, `cdata=${d} cobj=${o} : attributs invalides ${JSON.stringify(bad.slice(0, 2))}`);
  }
});

test('classes isolées, boucles multiples, propriétés parallèles : positions finies', () => {
  const t = load();
  t.run(`state.classes=[{id:1,name:'A',parents:[]},{id:2,name:'B',parents:[]},{id:3,name:'Z',parents:[]}]; state.dataProps=[]; state.nextId=4;
    state.objProps=[1,2,3,4].map(i=>({id:10+i,name:'p'+i,domain:1,range:i%2?2:1,transitive:false,symmetric:false,functional:false,inverseFunctional:false,inverseOf:null,parents:[]}))`);
  t.run('ui.cobj=true; render()'); t.run('ui.cobj=false; render()');
  assert.ok(positions(t).every(p => Number.isFinite(p.x) && Number.isFinite(p.y)));
});
