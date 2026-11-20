/* Catalogue d'espaces de noms (namespaces.js) et racines d'IRI proposées par l'enseignant. */
const { test } = require('node:test'); const assert = require('node:assert/strict'); const { load } = require('./harness');

test('namespaces.js livré : toutes les entrées sont valides, groupes et racines présents', () => {
  const t = load();
  assert.deepEqual(t.run('NS_CATALOGUE.problems'), []);
  assert.equal(t.run('NS_CATALOGUE.source'), 'namespaces.js');
  const l = t.run('FREQUENT_NS');
  assert.ok(l.length >= 10);
  assert.equal(new Set(l.map(e => e.prefix)).size, l.length, 'préfixes uniques');
  assert.ok(l.every(e => /[#/]$/.test(e.iri) && /^https?:\/\//.test(e.iri)), 'IRI absolues finissant par # ou /');
  assert.ok(t.run('NS_ROOTS.length') >= 1 && /\/$/.test(t.run('NS_ROOTS[0].iri')));
  assert.ok(t.run('defaultNs()').startsWith(t.run('NS_ROOTS[0].iri')));
});

test('entrées invalides ignorées et signalées, les autres conservées', () => {
  const t = load({ namespacesSource: `window.ONTOLAB_NAMESPACES=[{prefix:'ok',iri:'http://a.org/x#'},{prefix:'rdf',iri:'http://b/'},{prefix:'2mauvais',iri:'http://c/'},{prefix:'ok',iri:'http://d/'},{prefix:'sansiri'},null,{prefix:'bon',iri:'http://e.org/ns'}]; window.ONTOLAB_ROOTS=['http://r.org/a','http://r.org/a/','pas une iri'];` });
  const l = t.run('FREQUENT_NS.map(e=>e.prefix+"="+e.iri)');
  assert.deepEqual(l, ['ok=http://a.org/x#', 'bon=http://e.org/ns#']);
  assert.equal(t.run('NS_CATALOGUE.problems.length'), 5);
  assert.deepEqual(t.run('NS_ROOTS.map(r=>r.iri)'), ['http://r.org/a/'], 'racine en double et IRI invalide ignorées');
});

test('liste absente ou sans entrée valide : liste intégrée', () => {
  const t = load({ namespaces: false });
  assert.equal(t.run('FREQUENT_NS').length, 17); assert.equal(t.run('NS_CATALOGUE.source'), 'intégré');
  const t2 = load({ namespacesSource: 'window.ONTOLAB_NAMESPACES=[{prefix:"x"}];' });
  assert.equal(t2.run('FREQUENT_NS').length, 17); assert.ok(t2.run('NS_CATALOGUE.problems').some(p => /aucune entrée valide/.test(p)));
});

test('sans racine : espace de noms par défaut d\'exemple', () => {
  const t = load({ namespacesSource: 'window.ONTOLAB_NAMESPACES=undefined;' });
  assert.equal(t.run('defaultNs()'), 'http://example.org/onto#');
});

test('validateNs : # ajouté, IRI relatives et vides refusées', () => {
  const t = load();
  assert.equal(t.call('v => validateNs(v).iri', 'http://x.org/a'), 'http://x.org/a#');
  assert.equal(t.call('v => validateNs(v).iri', 'http://x.org/a/'), 'http://x.org/a/');
  assert.ok(t.call('v => validateNs(v).err', ''));
  assert.ok(t.call('v => validateNs(v).err', 'relative/chemin'));
});
