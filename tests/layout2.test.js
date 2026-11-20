/* F1 : épingles, disposition hiérarchique, sous-propriétés rapprochées, réduction des croisements, performances (exactitude). */
const { test } = require('node:test'); const assert = require('node:assert/strict'); const { load } = require('./harness');

const TREE = `(() => {
  state.classes=[];state.objProps=[];state.dataProps=[];state.nextId=1;state.nsList=[];
  const C=(n,ps)=>{const c={id:state.nextId++,name:n,parents:ps||[]};state.classes.push(c);return c.id;};
  const A=C('Racine'),B=C('B',[A]),Cc=C('C',[A]),D=C('D',[B]),E=C('E',[B]),F=C('F',[Cc]),G=C('G',[D,F]),H=C('Isolee');
  const O=(n,d,r,x)=>{const p=Object.assign({id:state.nextId++,name:n,domain:d,range:r,transitive:false,symmetric:false,functional:false,inverseFunctional:false,inverseOf:null,parents:[]},x||{});state.objProps.push(p);return p;};
  O('p1',D,F); O('p2',E,Cc);
  state.dataProps.push({id:state.nextId++,name:'nom',domain:A,type:'xsd:string',parents:[]});
  globalThis.cls=n=>state.classes.find(c=>c.name===n); globalThis.op=n=>state.objProps.find(p=>p.name===n);
})()`;
const pos = t => t.run(`(() => { layoutCache={key:null,pos:null}; const p=computeLayout(); return Object.fromEntries([...p].map(([id,q])=>[classById(id).name,{x:Math.round(q.x),y:Math.round(q.y)}])); })()`);

test('disposition hiérarchique : racines en haut, une couche par niveau, sous-classes sous leurs parents', () => {
  const t = load(); t.run(TREE); t.run("state.layout='hier'");
  const P = pos(t);
  assert.equal(P.Racine.y, P.Isolee.y, 'les racines (isolée comprise) sont sur la même rangée');
  assert.ok(P.Racine.y < P.B.y && P.B.y === P.C.y, 'niveau 1 : B et C'); assert.ok(P.B.y < P.D.y && P.D.y === P.E.y && P.D.y === P.F.y, 'niveau 2 : D, E, F');
  assert.ok(P.D.y < P.G.y && P.F.y < P.G.y, 'G (héritage multiple) sous ses deux parents');
  const rows = new Set(Object.values(P).map(q => q.y)); assert.equal(rows.size, 4, '4 couches');
});

test('la disposition hiérarchique est mémorisée dans le projet (état, export JSON) et assainie', () => {
  const t = load(); t.run(TREE);
  assert.equal(t.run('state.layout'), 'force'); t.run("setLayoutMode('hier')"); assert.equal(t.run('state.layout'), 'hier');
  assert.equal(JSON.parse(t.run('JSON.stringify(state)')).layout, 'hier');
  const st = t.call(`s => sanitizeState(s).layout`, { classes: [], layout: 'n\'importe quoi' }); assert.equal(st, 'force');
  assert.equal(t.call(`s => sanitizeState(s).layout`, { classes: [], layout: 'hier' }), 'hier');
  const t2 = load({ storage: Object.fromEntries(t.storage) }); assert.equal(t2.run('state.layout'), 'hier', 'rechargé');
  t.run("openNewProject('Autre',null)"); assert.equal(t.run('state.layout'), 'force', 'un nouveau projet repart par forces');
});

test('changer de disposition efface les positions non épinglées', () => {
  const t = load(); t.run(TREE);
  t.run("cls('B').mx=500; cls('B').my=500; setLayoutMode('hier')"); assert.equal(t.run("cls('B').mx"), undefined);
});

test('épingler : fige la position actuelle ; « Réorganiser » garde les épingles et efface le reste', () => {
  const t = load(); t.run(TREE); t.run('render()');
  const before = pos(t);
  assert.equal(t.run("setPin('class',cls('B').id,true)"), true);
  assert.deepEqual(t.run("({x:Math.round(cls('B').mx),y:Math.round(cls('B').my),pin:cls('B').pin})"), { x: before.B.x, y: before.B.y, pin: true });
  t.run("cls('C').mx=900; cls('C').my=900; cls('C').man=true; cls('D').mx=-900; cls('D').my=-900");     // positions manuelles non épinglées
  t.run('reorganize()');
  assert.equal(t.run("cls('B').pin"), true); assert.ok(t.run("cls('B').mx")!=null, 'épinglée : gardée');
  assert.equal(t.run("cls('C').mx"), undefined); assert.equal(t.run("cls('D').mx"), undefined); assert.equal(t.run("'man' in cls('C')"), false);
  const after = t.run('(() => { const p=computeLayout(); const q=p.get(cls("B").id); return [Math.round(q.x),Math.round(q.y)]; })()');
  assert.deepEqual(after, [before.B.x, before.B.y], 'la classe épinglée reste exactement à sa place');
});

test('épingler une étiquette de propriété ; désépingler ; tout désépingler garde les positions', () => {
  const t = load(); t.run(TREE); t.run('render()');
  assert.equal(t.run("setPin('obj',op('p1').id,true)"), true); assert.equal(t.run("op('p1').pin"), true);
  t.run("setPin('class',cls('G').id,true)"); assert.equal(t.run('pinCount()'), 2);
  t.run("setPin('class',cls('G').id,false)"); assert.equal(t.run('pinCount()'), 1); assert.ok(t.run("cls('G').mx")!=null, 'désépingler laisse la position manuelle');
  t.run('unpinAll()'); assert.equal(t.run('pinCount()'), 0); assert.ok(t.run("op('p1').mx")!=null);
  assert.equal(t.run("setPin('class',999,true)"), false);
});

test('épingle : marque dessinée, case du panneau, assainissement', () => {
  const t = load(); t.run(TREE); t.run('render()'); t.run("setPin('class',cls('B').id,true)");
  t.resetCreated(); t.run('state.sel=null; render()');
  assert.equal(t.created().filter(e => e.tag === 'circle' && e.attrs.fill === '#E4572E' && e.attrs.r === '4').length, 1, 'une punaise');
  t.run("ui.panel=true; state.sel={kind:'class',id:cls('B').id}; render()"); assert.match(t.panelHTML(), /id="pf-pin" checked/);
  t.run("state.sel={kind:'class',id:cls('C').id}; render()"); assert.ok(/id="pf-pin"/.test(t.panelHTML()) && !/id="pf-pin" checked/.test(t.panelHTML()));
  const st = t.call(`s => JSON.parse(JSON.stringify(sanitizeState(s)))`, { classes: [{ id: 1, name: 'A', pin: true }, { id: 2, name: 'B', pin: true, mx: 5, my: 6 }, { id: 3, name: 'C', pin: 'oui', mx: 1, my: 1 }] });
  assert.deepEqual(st.classes.map(c => c.pin ?? null), [null, true, null], 'pas d\'épingle sans position, ni de valeur autre que true');
  t.run("ui.cdata=true; state.sel={kind:'data',id:state.dataProps[0].id}; render()"); assert.ok(!/id="pf-pin"/.test(t.panelHTML()), 'pas de case pour une donnée sans nœud (mode compact)');
});

test('menu Réorganiser : par forces, hiérarchique, réorganiser, désépingler', () => {
  const t = load(); t.run(TREE);
  const clicks = []; t.run("globalThis.showMenu=(btn,items)=>{ globalThis.__menu=items; }"); t.fire('#v-layout', 'click'); // le menu est ouvert par le gestionnaire du bouton
  // les gestionnaires sont posés avec onclick (propriété) : on les appelle directement
  const h = t.ctx.document.querySelector('#v-layout').onclick; assert.equal(typeof h, 'function'); h();
  const items = t.ctx.__menu.filter(i => i !== '-'); assert.deepEqual(JSON.parse(JSON.stringify(items.map(i => i.label))), ['Par forces', 'Hiérarchique', 'Réorganiser', 'Tout désépingler']);
  items[1].run(); assert.equal(t.run('state.layout'), 'hier'); assert.equal(items[1].check(), true); assert.equal(items[0].check(), false);
  items[0].run(); assert.equal(t.run('state.layout'), 'force');
});

test('rendu complet dans les deux dispositions et les 4 modes compacts, sans NaN', () => {
  const t = load(); t.run(TREE);
  for (const lay of ['force', 'hier']) for (const [d, o] of [[false, false], [true, true]]) {
    t.run(`state.layout='${lay}'; ui.cdata=${d}; ui.cobj=${o}; state.sel=null`); t.resetCreated(); t.run('render()');
    assert.equal(t.created().filter(e => Object.values(e.attrs).some(v => /NaN|Infinity|undefined/.test(v))).length, 0, lay + ' ' + d + o);
  }
});

const GEN = (n, subs) => `(() => { let seed=4242; const rnd=()=>{ seed=(seed*1103515245+12345)&0x7fffffff; return seed/0x7fffffff; };
  state.classes=[];state.objProps=[];state.dataProps=[];state.nextId=1;state.nsList=[];
  for(let i=0;i<${n};i++){ const ps=[]; if(i>0) ps.push(state.classes[Math.floor(rnd()*i)].id); state.classes.push({id:state.nextId++,name:'Classe'+i,parents:ps}); }
  for(let i=0;i<${n}*1.3;i++){ const d=state.classes[Math.floor(rnd()*${n})].id, r=state.classes[Math.floor(rnd()*${n})].id; state.objProps.push({id:state.nextId++,name:'prop'+i,domain:d,range:r,transitive:false,symmetric:false,functional:false,inverseFunctional:false,inverseOf:null,parents:[]}); }
  for(let i=0;i<${n};i++) state.dataProps.push({id:state.nextId++,name:'donnee'+i,domain:state.classes[Math.floor(rnd()*${n})].id,type:'xsd:string',parents:[]});
  ${subs ? 'state.objProps.slice(3,3+' + subs + ').forEach((p,i)=>p.parents=[state.objProps[i].id]);' : ''}
})()`;
const stage = t => t.run(`(() => { layoutCache={key:null,pos:null}; const pos=computeLayout(); const pp=computeProps(pos); relax(pos,pp.obj,pp.data); return {pos,pp}; })()`);

test('réduction des croisements : jamais plus de croisements qu\'avant, et moins sur un graphe chargé', () => {
  let better = 0, total = 0;
  for (const n of [10, 14, 18]) {
    const t = load(); t.run(GEN(n, 0));
    const r = t.run(`(() => { layoutCache={key:null,pos:null}; const pos=computeLayout(), pp=computeProps(pos); relax(pos,pp.obj,pp.data);
      const before=countCrossings(pos,pp.obj,pp.data); reduceCrossings(pos,pp.obj,pp.data); const after=countCrossings(pos,pp.obj,pp.data);
      const bad=[...pp.obj.values(),...pp.data.values()].filter(q=>!Number.isFinite(q.x)||!Number.isFinite(q.y)).length; return {before,after,bad}; })()`);
    assert.ok(r.after <= r.before, `n=${n} : ${r.before} → ${r.after}`); assert.equal(r.bad, 0); total += r.before; better += r.before - r.after;
  }
  assert.ok(total === 0 || better >= 1, 'au moins un croisement évité au total (' + better + '/' + total + ')');
});

test('réduction des croisements : les étiquettes déplacées à la main ne bougent pas, et l\'option peut être coupée', () => {
  const t = load(); t.run(GEN(12, 0));
  t.run('state.objProps.forEach(p=>{ p.mx=0; p.my=0; })');
  const moved = t.run(`(() => { const pos=computeLayout(), pp=computeProps(pos); relax(pos,pp.obj,pp.data); const b=JSON.stringify([...pp.obj.values()].map(q=>[q.x,q.y])); reduceCrossings(pos,pp.obj,pp.data); return b===JSON.stringify([...pp.obj.values()].map(q=>[q.x,q.y])); })()`);
  assert.equal(moved, true);
  t.run('state.objProps.forEach(p=>{ delete p.mx; delete p.my; }); LAYOUT_OPTS.reduce=false');
  const same = t.run(`(() => { const pos=computeLayout(), pp=computeProps(pos); relax(pos,pp.obj,pp.data); const b=JSON.stringify([...pp.obj.values()].map(q=>[q.x,q.y])); reduceCrossings(pos,pp.obj,pp.data); return b===JSON.stringify([...pp.obj.values()].map(q=>[q.x,q.y])); })()`);
  assert.equal(same, true, 'option coupée : aucun changement');
});

test('sous-propriétés : l\'étiquette fille est rapprochée de l\'étiquette mère (distance bornée)', () => {
  const t = load(); t.run(GEN(14, 6));
  const gaps = t.run(`(() => { layoutCache={key:null,pos:null}; const pos=computeLayout(), pp=computeProps(pos); relax(pos,pp.obj,pp.data);
    return state.objProps.filter(p=>p.parents.length).map(p=>{ const a=pp.obj.get(p.id), b=pp.obj.get(p.parents[0]); const d=Math.hypot(a.x-b.x,a.y-b.y); return d-(Math.max(a.rx,a.ry)+Math.max(b.rx,b.ry)); }); })()`);
  assert.equal(gaps.length, 6);
  assert.ok(gaps.every(g => g < 320), 'écarts (px, au-delà des rayons) : ' + gaps.map(Math.round));
});

test('la mise en page reste déterministe après les optimisations', () => {
  const run = () => { const t = load(); t.run(GEN(14, 4)); return JSON.stringify(stage(t)); };
  assert.equal(run(), run());
});

test('performances : le placement et le relâchement restent rapides sur un graphe dense (garde-fou large)', () => {
  const t = load(); t.run(GEN(40, 0)); t.run('layoutCache={key:null,pos:null}; computeLayout()');
  const ms = t.run(`(() => { const pos=computeLayout(); const t0=Date.now(); const pp=computeProps(pos); relax(pos,pp.obj,pp.data); return Date.now()-t0; })()`);
  assert.ok(ms < 4000, 'placement + relax en ' + ms + ' ms (sous Node ; ≈ 10× plus vite dans un navigateur)');
});
