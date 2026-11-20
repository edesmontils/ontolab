/* Chargement de l'application, cohérence de version, absence de fonction manquante au rendu. */
const { test } = require('node:test'); const assert = require('node:assert/strict'); const fs = require('fs'); const path = require('path');
const { load, ROOT } = require('./harness');

test('la page se charge et démarre sans exception', () => {
  const t = load();
  assert.equal(t.run('typeof toTTL'), 'function');
  assert.equal(t.run('typeof render'), 'function');
});

test('le numéro de version est cohérent avec CHANGELOG.md', () => {
  const t = load();
  const v = t.run('VERSION');
  assert.match(v, /^\d+\.\d+\.\d+$/);
  const top = fs.readFileSync(path.join(ROOT, 'CHANGELOG.md'), 'utf8').match(/^## (\d+\.\d+\.\d+)/m);
  assert.ok(top, 'CHANGELOG.md doit commencer par une entrée « ## x.y.z »');
  assert.equal(top[1], v, 'VERSION (index.html) et la dernière entrée de CHANGELOG.md doivent coïncider');
});

test('le pied de page et l\'en-tête Turtle portent la version', () => {
  const t = load();
  const v = t.run('VERSION');
  assert.ok(t.run('toTTL(state.ns)').split('\n')[0].includes('v' + v));
  assert.ok(String(t.ctx.document.querySelector('#copyright').textContent).includes('v' + v));
});
