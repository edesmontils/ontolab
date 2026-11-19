# AGENTS.md — OntoLab

Outil pédagogique de **construction d'ontologies** (cours Web Sémantique).
Construction interactive de classes, propriétés objet (caractéristiques OWL)
et propriétés de donnée, visualisation de type VOWL, export Turtle.

Le contexte général du cours et les contraintes durables (pas de
suppression sans confirmation, documentation en français, claims « vérifiés »
réellement vérifiés) sont dans **`../../Exemples/AGENTS.md`** et
`../../Exemples/README.md` — les respecter avant toute modification.
> ⚠️ Dans le repo GitHub (`edesmontils/ontolab`), ce dépôt est **autonome** :
> l'arborescence `Exemples/` n'y existe pas ; seul le présent dossier compte.

## Architecture : un fichier unique

- **`index.html`** contient tout : HTML, CSS et JS **en ligne**, zéro
  dépendance externe. Il doit rester fonctionnel ouvert en `file://`
  (pas de fetch, pas de module, pas de CDN, pas de worker).
- `README.md` : mode d'emploi, codes visuels VOWL, enchaînement Jena/WebVOWL,
  idées de TD, perfectionnements à l'étude.
- Toute modification du code se fait **dans `index.html`**.

### Vérification après toute édition (obligatoire)

```bash
node -e "const fs=require('fs');const h=fs.readFileSync('index.html','utf8');
fs.writeFileSync('/tmp/ontolab.js',h.match(/<script>([\s\S]*)<\/script>/)[1]);"
node --check /tmp/ontolab.js
```

Le JS est organisé en 3 blocs commentés :
1. **partie 1** — état, boîte de dialogue générique (`dialog()`/`confirmBox()`),
   CRUD, export JSON, export Turtle (`toTTL()`/`exportTTL()`), exemple ;
2. **partie 2** — mise en page (`computeLayout()`, `computeProps()`,
   `relax()`, `refinalizeProps()`) et rendu SVG (`render()` et `draw*`) ;
3. **partie 3** — interactions (modes, drag, zoom/pan, clavier), panneau
   latéral (`updatePanel()`), câblage toolbar, démarrage.

## Modèle de données (persisté)

- Sauvegarde automatique dans `localStorage`, clé **`ontolab-v1`**.
- Schéma de `state` :
  - `classes[]` : `{id, name, parent: id|null}` + positions manuelles
    optionnelles `{mx, my, man}` ;
  - `objProps[]` : `{id, name, domain, range, transitive, symmetric,
    functional, inverseOf: id|null}` + `{mx, my}` ;
  - `dataProps[]` : `{id, name, domain, type}` (type = IRI XSD) + `{mx, my}` ;
  - `nextId`, `ns` (namespace, défaut `http://example.org/onto#`),
    `sel`, `mode` (`class|obj|data|move`), `view` (`{x,y,k}`).
- **En cas d'évolution incompatible du schéma : changer la clé** `ontolab-v1`
  (ex. `ontolab-v2`) plutôt que de migrer — l'outil est pédagogique, pas
  un produit de gestion.
- Noms d'éléments **uniques** entre classes et propriétés (`nameTaken()`) ;
  un nom est utilisé tel quel comme nom local d'IRI (accents autorisés) ;
  `localName()` remplace tout caractère hors lettre/chiffre/`_`/`-`/`.` par `_`
  (nom préfixé Turtle valide) et `nameTaken()` compare sur ce nom local.
- `sanitizeState()` normalise l'état venant du `localStorage` ou d'un JSON importé.

## Modes et interactions (à ne pas casser)

| Mode | Touche | Action principale |
|------|--------|-------------------|
| ① Classe | `1` | clic fond = créer ; glisser classe → classe = `subClassOf` ; glisser → fond = détacher |
| ② Propriété objet | `2` | glisser classe → classe = créer (domaine → portée ; sur soi-même = boucle) |
| ③ Propriété de donnée | `3` | clic sur classe = créer (type XSD demandé) |
| ④ Déplacer | `4` | glisser n'importe quel élément = position manuelle |

- Clic sur un élément (hors mode ④) = sélection + édition dans le panneau
  droit. `Suppr` = supprimer l'élément sélectionné (cascade : une classe
  emporte ses propriétés liées, ses sous-classes redeviennent racines).
- **Protection des cycles** : `isAncestorOf()` refuse tout `subClassOf`
  créant un cycle ; le panneau exclut les descendants de la liste.
- Molette = zoom (autour du curseur), glisser le fond = pan, double-clic fond
  = recentrer (`initView()`).
- « **Réorganiser** » : supprime tous les `mx/my` puis re-layout.

## Mise en page (le point le plus fragile)

`render()` = `computeLayout()` → `computeProps()` → `relax()` →
`refinalizeProps()` → `draw*`.

1. **`computeLayout()`** — anneaux concentriques type VOWL :
   - secteur angulaire de chaque nœud ∝ **poids** de sa sous-arborescence
     (`wOf()` = somme des largeurs des feuilles, `GAP=36` entre feuilles) ;
   - rayon des anneaux ∝ largeur totale des feuilles (`rBase =
     1.18·totalW/2π`) + dégagement parent/enfant par profondeur ;
   - multiple racines : chaque racine occupe un secteur du cercle de rayon 170.
2. **`computeProps()`** — étiquettes vertes au milieu du domaine→portée
   (repoussées de 15 % du centre, décalage perpendiculaire si plusieurs
   propriétés sur le même couple) ; étiquettes rouges radialement vers
   l'extérieur, écartées de 0,55 rad par propriété.
3. **`relax()`** — 150 itérations max : pousse à l'écart les paires
   d'ellipses qui se chevauchent (test exact le long de l'axe des centres,
   marge 10 px), avec coefficients asymétriques (une étiquette cède 90 % face
   à une classe), ancrage doux des classes vers leur position radiale (8 %/itér)
   et **positions manuelles immuables**.
4. **`refinalizeProps()`** — recalcule les points d'attache des courbes sur
   les bords des ellipses après relaxation.

Ajustements possibles : `GAP`, les facteurs `1.18` / `0.08` / `10` (marge),
les coefficients de `relax()`, `SPACING` implicite via `ringR`. Toujours
re-tester visuellement avec l'exemple chargé (`loadExample()`) **et** une
ontologie chargée (bouton Exemple puis densifier).

## Export Turtle (à maintenir valide)

`toTTL()` génère du Turtle/OWL **valide et ordonné** :
- préfixes `:`, `rdf:`, `rdfs:`, `owl:`, `xsd:` + déclaration
  `owl:Ontology` ;
- classes en **ordre hiérarchique** (racines d'abord, puis DFS) pour que
  chaque `rdfs:subClassOf` pointe vers une classe déjà déclarée ;
- caractéristiques en listage : `a owl:ObjectProperty, owl:TransitiveProperty, …` ;
- `owl:inverseOf` émis des deux côtés de la paire ;
- `rdfs:range` XSD pour les propriétés de donnée.

Le TTL exporté doit rester chargable par **Jena** (`arq --data`, `sparql
--desc`) et convertissable par **`../owl2vowl.jar`** (VOWL JSON) — c'est le
lien avec le reste du cours ; un export cassé est un incident pédagogique.

## Périmètre assumé (v1)

Construire + visualiser + exporter. Hors périmètre (voir `README.md` §
« Perfectionnements à l'étude » et « Limites ») : `disjointUnionOf`,
individus, restrictions OWL, import TTL, export image. Ne pas élargir le
périmètre sans demande explicite.
