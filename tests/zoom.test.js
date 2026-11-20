/* Zoom à la molette et au pincement de trackpad. */
const { test } = require('node:test'); const assert = require('node:assert/strict'); const { load } = require('./harness');
const view = t => t.run('({x:state.view.x,y:state.view.y,k:state.view.k})');

test('la molette zoome (vers le bas = éloigner, vers le haut = rapprocher)', () => {
  const t = load(); t.run('state.view={x:100,y:50,k:1}');
  t.fire('#canvas', 'wheel', { deltaY: -100, clientX: 300, clientY: 200 });
  assert.ok(view(t).k > 1.1, 'rapprochement');
  t.run('state.view={x:100,y:50,k:1}');
  t.fire('#canvas', 'wheel', { deltaY: 100, clientX: 300, clientY: 200 });
  assert.ok(view(t).k < 0.9, 'éloignement');
});

test('le zoom est centré sur le pointeur (le point du graphe sous le curseur ne bouge pas)', () => {
  const t = load(); t.run('state.view={x:100,y:50,k:1}');
  const world = v => [(300 - v.x) / v.k, (200 - v.y) / v.k];
  const before = world(view(t));
  t.fire('#canvas', 'wheel', { deltaY: -250, clientX: 300, clientY: 200 });
  const v = view(t), after = world(v);
  assert.ok(v.k > 1);
  assert.ok(Math.abs(before[0] - after[0]) < 1e-6 && Math.abs(before[1] - after[1]) < 1e-6);
});

test('bornes 0,2 à 3 ; deltas en lignes ou en pages ; pincement (Ctrl) plus fort', () => {
  const t = load();
  for (let i = 0; i < 100; i++) t.fire('#canvas', 'wheel', { deltaY: -100 });
  assert.equal(view(t).k, 3);
  for (let i = 0; i < 200; i++) t.fire('#canvas', 'wheel', { deltaY: 100 });
  assert.equal(view(t).k, 0.2);
  const step = ev => { t.run('state.view={x:0,y:0,k:1}'); t.fire('#canvas', 'wheel', ev); return view(t).k; };
  const px = step({ deltaY: -48 }), lines = step({ deltaY: -3, deltaMode: 1 });
  assert.ok(Math.abs(px - lines) < 1e-9, 'trois lignes = 48 px');
  assert.ok(step({ deltaY: -4, ctrlKey: true }) > step({ deltaY: -4 }), 'le pincement de trackpad zoome plus qu\'un petit delta de molette');
  assert.ok(step({ deltaY: -100000 }) < 1.8, 'un delta énorme est plafonné');
});
