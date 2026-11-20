/* Préférences : priorité verrou > lien > choix enregistré > défaut enseignant ; mode et compact. */
const { test } = require('node:test'); const assert = require('node:assert/strict'); const { load } = require('./harness');
const ui = o => load(o).run('({mode:ui.mode,lock:ui.lock,cdata:ui.cdata,cobj:ui.cobj,lockC:ui.lockC,lockO:ui.lockO})');
const saved = (o) => ({ 'ontolab-ui': JSON.stringify(o) });

test('mode : défaut owl, défaut enseignant, choix enregistré, lien, verrou', () => {
  assert.equal(ui({}).mode, 'owl');
  assert.equal(ui({ defaults: { mode: 'rdfs' } }).mode, 'rdfs');
  assert.equal(ui({ defaults: { mode: 'rdfs' }, storage: saved({ mode: 'owl' }) }).mode, 'owl', 'le choix enregistré l\'emporte sur le défaut');
  assert.equal(ui({ defaults: { mode: 'owl' }, storage: saved({ mode: 'owl' }), search: '?mode=rdfs' }).mode, 'rdfs', 'le lien l\'emporte sur le choix enregistré');
  const lock = ui({ defaults: { mode: 'rdfs', lock: true }, storage: saved({ mode: 'owl' }), search: '?mode=owl' });
  assert.equal(lock.mode, 'rdfs'); assert.equal(lock.lock, true);
  assert.equal(ui({ defaults: { lock: true } }).lock, false, 'verrou sans mode : ignoré');
  assert.equal(ui({ search: '?mode=nimporte' }).mode, 'owl', 'valeur de lien invalide ignorée');
});

test('un lien ?mode= n\'écrase pas durablement le choix enregistré', () => {
  const t = load({ search: '?mode=rdfs', storage: saved({ mode: 'owl' }) });
  t.run('saveUI()');
  assert.equal(JSON.parse(t.storage.get('ontolab-ui')).mode, 'owl');
});

test('compact : défaut, enregistré, lien (data, obj, none), verrou', () => {
  assert.deepEqual([ui({}).cdata, ui({}).cobj], [false, false]);
  assert.deepEqual([ui({ defaults: { compact: { data: true } } }).cdata, ui({ defaults: { compact: { data: true } } }).cobj], [true, false]);
  assert.equal(ui({ defaults: { compact: { data: true } }, storage: saved({ cdata: false }) }).cdata, false);
  const l = ui({ search: '?compact=data,obj' }); assert.deepEqual([l.cdata, l.cobj], [true, true]);
  const o = ui({ search: '?compact=obj' }); assert.deepEqual([o.cdata, o.cobj], [false, true]);
  const n = ui({ search: '?compact=none', defaults: { compact: { data: true, obj: true } } }); assert.deepEqual([n.cdata, n.cobj], [false, false]);
  const k = ui({ defaults: { compact: { data: true }, lock: true }, search: '?compact=none', storage: saved({ cdata: false }) });
  assert.deepEqual([k.cdata, k.lockC, k.lockO], [true, true, false], 'verrou : seul ce qui est défini est verrouillé');
});

test('états enregistrés corrompus : ignorés sans exception', () => {
  const t = load({ storage: { 'ontolab-ui': '{pas du json', 'ontolab-v1': '[1,2' } });
  assert.equal(t.run('ui.mode'), 'owl'); assert.equal(t.run('state.classes.length'), 0);
  const t2 = load({ storage: { 'ontolab-v1': JSON.stringify({ classes: [{ id: '4', name: 'X', parents: ['4'] }], objProps: 5 }) } });
  assert.equal(t2.run('state.classes[0].id'), 4); assert.deepEqual(t2.run('state.classes[0].parents'), []);
});

test('sauvegarde locale : la modification d\'une ontologie est enregistrée puis relue', () => {
  const t = load(); t.run('loadExample()');
  const raw = t.storage.get('ontolab-v1');
  const t2 = load({ storage: { 'ontolab-v1': raw } });
  assert.equal(t2.run('state.classes.length'), 7); assert.equal(t2.run('state.objProps.length'), 4);
});
