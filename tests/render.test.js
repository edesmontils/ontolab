/* Rendu complet (render, panneau, double-clic) dans toutes les combinaisons de préférences : aucune exception,
   panneau correct, éléments dessinés conformes au mode. Attrape les régressions du type « fonction supprimée par erreur ». */
const { test } = require('node:test'); const assert = require('node:assert/strict'); const { load } = require('./harness');

/* Ontologie riche : héritage, boucle transitive, symétrique, paire d'inverses, sous-propriété, incomplètes, étiquettes. */
const RICH = `(() => {
  state.classes=[];state.objProps=[];state.dataProps=[];state.nextId=1;state.nsList=[];
  const C=(n,ps)=>{const c={id:state.nextId++,name:n,parents:ps||[]};state.classes.push(c);return c.id;};
  const A=C('Personne'),B=C('Groupe'),D=C('Membre',[A]),E=C('Guide',[A,B]);
  const O=(n,d,r,x)=>{const p=Object.assign({id:state.nextId++,name:n,domain:d,range:r,transitive:false,symmetric:false,functional:false,inverseFunctional:false,inverseOf:null,parents:[]},x||{});state.objProps.push(p);return p;};
  const t=O('ancetre',A,A,{transitive:true}),s=O('ami',A,B,{symmetric:true}),i1=O('dirige',E,B),i2=O('estDirigePar',B,E);i1.inverseOf=i2.id;i2.inverseOf=i1.id;
  O('co',null,null,{parents:[i1.id]}); O('sansPortee',A,null); O('sansDomaine',null,B); O('rien',null,null); O('fonc',A,B,{functional:true,inverseFunctional:true});
  const dp=(n,d)=>state.dataProps.push({id:state.nextId++,name:n,domain:d,type:'xsd:string',parents:[]});
  dp('nom',A); dp('age',D); dp('orpheline',null);
  state.classes[0].labels=[{lang:'fr',text:'Personne physique'}]; state.objProps[0].comments=[{lang:'fr',text:'x'}];
})()`;

const COMBOS = [];
for (const mode of ['owl', 'rdfs']) for (const cdata of [false, true]) for (const cobj of [false, true]) COMBOS.push({ mode, cdata, cobj });
const TITLES = { class: 'Classe', obj: 'Propriété objet', data: 'Propriété de donnée' };

test('render + panneau de chaque élément, dans les 8 combinaisons de préférences', () => {
  const t = load(); t.run(RICH);
  for (const c of COMBOS) {
    t.run(`ui.mode='${c.mode}'; ui.cdata=${c.cdata}; ui.cobj=${c.cobj}; ui.panel=true; state.sel=null; render()`);
    assert.match(t.panelHTML(), /<h3>OntoLab<\/h3>/, JSON.stringify(c) + ' : accueil');
    for (const [list, kind] of [['classes', 'class'], ['objProps', 'obj'], ['dataProps', 'data']]) {
      const ids = t.run(`state.${list}.map(x=>x.id)`);
      for (const id of ids) {
        t.run(`state.sel={kind:'${kind}',id:${id}}; render()`);
        assert.ok(t.panelHTML().includes('<h3>' + TITLES[kind] + '</h3>'), `${JSON.stringify(c)} ${kind} ${id} : le panneau doit décrire l'élément`);
      }
    }
  }
});

test('double-clic sur un nœud : le panneau décrit l\'élément (compact ou non)', () => {
  const t = load(); t.run(RICH);
  const ev = '{pointerType:"mouse",button:0,clientX:0,clientY:0,preventDefault(){}}';
  for (const c of COMBOS) {
    t.run(`ui.mode='${c.mode}'; ui.cdata=${c.cdata}; ui.cobj=${c.cobj}; ui.panel=false; state.sel=null; touches.clear(); lastTap=null; render()`);
    for (const [kind, expr] of [['class', 'state.classes[2].id'], ['obj', 'state.objProps[0].id'], ['data', 'state.dataProps[0].id']]) {
      t.run(`(() => { const id=${expr}; nodeDown(${ev},'${kind}',id); nodeDown(${ev},'${kind}',id); })()`);
      assert.equal(t.run('ui.panel'), true);
      assert.ok(t.panelHTML().includes('<h3>' + TITLES[kind] + '</h3>'), `${JSON.stringify(c)} double-clic ${kind}`);
      t.run('state.sel=null; ui.panel=false; lastTap=null; render()');
    }
  }
});

test('mode compact : pas de nœud de donnée, compteurs « +N » ; mode normal : nœuds de donnée', () => {
  const t = load(); t.run(RICH);
  const count = (pred) => t.created().filter(pred).length;
  t.run('ui.mode="owl"; ui.cobj=false; ui.cdata=false; state.sel=null'); t.resetCreated(); t.run('render()');
  assert.equal(count(e => e.attrs['data-kind'] === 'data'), 2, '2 nœuds de donnée en mode normal (la propriété sans domaine n\'est pas dessinée)');
  assert.equal(count(e => e.attrs.class === 'cnt'), 0);
  t.run('ui.cdata=true'); t.resetCreated(); t.run('render()');
  assert.equal(count(e => e.attrs['data-kind'] === 'data'), 0, 'aucun nœud de donnée en compact');
  assert.equal(count(e => e.attrs.class === 'cnt'), 2, 'un compteur pour chaque classe qui a des attributs (la propriété orpheline n\'en a pas)');
});

test('propriétés objet compactes : pastilles, pas d\'ellipse verte ni d\'arc de sous-propriété ; flèche « ? » pour une extrémité manquante', () => {
  const t = load(); t.run(RICH);
  const objNodes = () => t.created().filter(e => e.attrs['data-kind'] === 'obj' && e.tag === 'g' && e.attrs['data-id']);
  t.run('ui.mode="owl"; ui.cdata=false; ui.cobj=false; state.sel=null'); t.resetCreated(); t.run('render()');
  const nNormal = objNodes().length;
  const subArcsNormal = t.created().filter(e => e.tag === 'line' && e.attrs['marker-end'] === 'url(#m-subo)').length;
  assert.ok(subArcsNormal >= 1, 'arc de sous-propriété en mode normal');
  t.run('ui.cobj=true'); t.resetCreated(); t.run('render()');
  const els = t.created();
  assert.equal(els.filter(e => e.tag === 'line' && e.attrs['marker-end'] === 'url(#m-subo)').length, 0, 'pas d\'arc de sous-propriété en compact');
  assert.ok(objNodes().length > nNormal, 'les propriétés à une extrémité (sansPortee, sansDomaine) sont dessinées en compact');
  assert.equal(t.run('incompleteProps().length'), 4, 'les 4 propriétés incomplètes (3 objet + 1 donnée) restent listées');
});

test('mode RDFS : aucune marque OWL dessinée (pastilles T/S/⇄, boucle transitive)', () => {
  const t = load(); t.run(RICH);
  t.run('ui.mode="rdfs"; ui.cobj=true; ui.cdata=true; state.sel=null'); t.resetCreated(); t.run('render()');
  assert.equal(t.created().filter(e => e.tag === 'circle' && e.attrs.r === '7.5').length, 0, 'aucune pastille lettrée en RDFS');
  t.run('ui.mode="owl"'); t.resetCreated(); t.run('render()');
  assert.ok(t.created().filter(e => e.tag === 'circle' && e.attrs.r === '7.5').length >= 4, 'pastilles T/S/⇄ en OWL');
});

test('étiquette affichée à la place du nom ; légende exportée adaptée au mode', () => {
  const t = load(); t.run(RICH);
  assert.equal(t.run('disp(state.classes[0])'), 'Personne physique');
  assert.equal(t.run('disp(state.classes[1])'), 'Groupe');
  assert.match(t.run('tipOf(state.classes[0])'), /Personne physique \(Personne\)/);
  t.run('ui.mode="owl"; ui.cobj=false; ui.cdata=false');
  assert.ok(t.run('exportLegend().svg').includes('Bordure en tirets'));
  t.run('ui.mode="rdfs"'); assert.ok(!t.run('exportLegend().svg').includes('Bordure en tirets'));
  t.run('ui.cdata=true'); assert.ok(t.run('exportLegend().svg').includes('+N'));
});

test('ontologie vide, sélection d\'un élément supprimé, état corrompu : pas d\'exception', () => {
  const t = load();
  t.run('state.classes=[];state.objProps=[];state.dataProps=[];state.sel=null;render()');
  t.run('state.sel={kind:"class",id:999};render()');
  assert.equal(t.run('state.sel'), null);
  t.run('state.sel={kind:"obj",id:999};render()'); t.run('state.sel={kind:"data",id:999};render()');
});
