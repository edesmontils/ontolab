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
   latéral (`updatePanel()`), câblage de la barre d'outils (palette `#rail`, menus `showMenu()`,
   contrôles de vue `#viewctl`), démarrage.

## Modèle de données (persisté)

- Sauvegarde automatique dans `localStorage`, clé **`ontolab-v1`**.
- Schéma de `state` :
  - `classes[]` : `{id, name, parents: [id]}` (héritage multiple) + positions
    manuelles optionnelles `{mx, my, man}` ;
  - `objProps[]` : `{id, name, domain, range, transitive, symmetric,  (`domain`/`range` **null = hérité** des parents, A6)
    functional, inverseFunctional, inverseOf: id|null, parents: [id]}` + `{mx, my}` ;
    (`inverseFunctional` = `owl:InverseFunctionalProperty`, absent des anciens exports = faux ; objets seulement,
    jamais sur une propriété de donnée ; style de bordure par `dashOf()` : tirets / points / tirets-points)
  - `dataProps[]` : `{id, name, domain, type, parents: [id]}` (type = IRI XSD ; `domain` null = hérité)
    + `{mx, my}` ; `parents` = `rdfs:subPropertyOf` (même type de propriété) ;
  - `nextId`, `ns` (espace de noms de l'ontologie, défaut `http://example.org/onto#`), `nsList` (autres espaces déclarés :
    `[{prefix, iri}]`) ; chaque classe/propriété peut porter un `ns` **facultatif** (son IRI d'espace de noms,
    toujours présente dans `nsList` ; absent = celui de l'ontologie) → IRI = `(x.ns||state.ns)+localName(x.name)`.
    `syncNsList()` (appelée par `sanitizeState`) nettoie la liste et y ajoute les espaces utilisés mais non
    déclarés (préfixe auto `autoPrefix()`) ; `ns` et `nsList` font partie de l'historique (`snapOf`) ;
    `sel`, `mode` (`class|obj|data|move`), `view` (`{x,y,k}`).
- Évolution du schéma : de préférence **changer la clé** `ontolab-v1` (ex.
  `ontolab-v2`) plutôt que migrer. Exception faite pour l'héritage : l'ancien
  champ `parent` (héritage simple) est migré vers `parents` par `cleanParents()`
  (appelée par `sanitizeState`, donc au chargement et à l'import JSON).
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

- **Double-clic / double tap** sur un élément (deux `pointerdown` < 400 ms sur le même `kind`/`id`, détecté
  dans `nodeDown()` via `lastTap` — `dblclick` n'est pas fiable au toucher sur iOS) : `openEditor()` sélectionne,
  rouvre le panneau (`ui.panel=true`) et, hors écran tactile, active le champ Nom. Ne démarre aucun glisser.
- Clic sur un élément (hors mode ④) = sélection + édition dans le panneau
  droit. Clic (sans glisser) sur le fond : **désélectionne** s'il y a une sélection, sinon
  (mode ①) crée une classe ; `newClassAt()` ne sélectionne pas la classe créée, pour que
  la création en série reste à un clic. `Suppr` = supprimer l'élément sélectionné (cascade : une classe
  emporte ses propriétés liées, ses sous-classes redeviennent racines).
- **Héritage multiple** (classes, propriétés objet, propriétés de donnée) : un seul code
  générique indexé par `kind` ∈ `class|obj|data` (`KINDS`) : `addParent()`,
  `removeParent()`, `clearParents()`, `isAncestor()` (refus des cycles, y compris
  par plusieurs chemins), `parentsBlock()`/`wireParents()` pour le panneau (pastilles +
  menu d'ajout). `cleanParents()` retire parents inexistants, doublons, auto-références
  et rompt les cycles (DFS) ; appelée après toute suppression et dans `sanitizeState`.
- Glisser une classe sur une autre (mode ①) ou une propriété sur une autre du même type
  (modes ② / ③, drag de type `prop`) **ajoute** un parent ; sur le fond : retire tous les
  parents. Dessin : `drawSubArcs()` (classes), `drawSubProps()` (propriétés), une
  flèche par parent.
- Molette = zoom (autour du curseur), glisser le fond = pan, double-clic fond
  = recentrer (`initView()`), boutons flottants + / − / recentrer / réorganiser (`#viewctl`,
  `zoomBy()`, `reorganize()`) pour le tactile.
- **Pointer Events** (pas de `mouse*`/`touch*`) : souris, doigt et stylet passent par
  le même code. `touches` (Map) suit les pointeurs posés ; 2 pointeurs = pincement
  (`pinchStart/pinchMove`) et annulent tout glisser en cours (`cancelGesture`).
  `svg` a `touch-action:none` et capture le pointeur (`setPointerCapture`) pour
  survivre aux re-rendus du DOM. Seuil tap/glisser : `thrOf()` (10 px doigt, 4 souris).
  Les boîtes de dialogue ignorent les clics 350 ms après ouverture (clic synthétisé
  par le tap qui les ouvre). À tester avec des `PointerEvent` `pointerType:'touch'`.
- « **Réorganiser** » : supprime tous les `mx/my` puis re-layout.

## Mise en page (le point le plus fragile)

`render()` = `computeLayout()` → `computeProps()` → `relax()` →
`refinalizeProps()` → `draw*` (`drawSubArcs`, `drawObjArcs`, `drawData`, …).

1. **`computeLayout()`** — déterministe, mis en cache (`layoutCache`, clé =
   noms/parents/liens/nb de props de donnée) pour que le mode ④ ne relance pas la
   simulation à chaque mouvement ; puis positions manuelles `mx/my` appliquées.
   `forceLayout()` :
   - composantes connexes (union-find sur `subClassOf` + propriétés objet) ;
   - par composante, `simulate(v)` : départ circulaire (décalé/miroir selon `v`),
     ressorts (`L` : sub ≥125, obj ≥190), repoussement anisotrope des ellipses
     (`minD = ra+rb+40`), gravité 0,006, contrainte « sous-classe sous sa
     super-classe » ; 4 départs, on garde le meilleur `score()` (croisements ×1000
     + longueur + pénalité de hiérarchie) ;
   - boîtes englobantes avec marge pour étiquettes, empaquetage en rangées.
2. **`computeProps()`** — étiquettes vertes au milieu domaine–portée (décalage
   perpendiculaire si plusieurs propriétés sur la même paire non orientée) ;
   boucles et props de donnée placées par `placeAround()` : 72 angles × 5 distances,
   coût = chevauchement avec classes / étiquettes déjà posées (légende de type XSD
   incluse), arêtes traversées (`segHitsEllipse`, y compris les flèches déjà tracées),
   écart angulaire aux liens ; on garde le moins coûteux.
3. **`relax()`** — 150 itérations max : écarte les ellipses qui se chevauchent
   (marge 10 px, coefficients asymétriques, positions manuelles immuables) ;
   marge `SUBGAP`=58 px entre une propriété et sa propriété parente pour que la flèche
   pointillée `subPropertyOf` reste visible.
4. **`refinalizeProps()`** — points d'attache sur les bords après relaxation ;
   boucle = deux points du bord de part et d'autre de l'étiquette. Les courbes
   objet ont pour point de contrôle `2·étiquette − (début+fin)/2` : elles passent
   par le centre de l'étiquette.

Ajustements possibles : constantes de `simulate()`, `extra` des boîtes englobantes,
nombre de départs (`tries`). Toujours re-tester visuellement avec l'exemple
(`loadExample()`) **et** une ontologie dense (20-60 classes, propriétés croisées,
boucles) ; vérifier l'absence de chevauchement et de croisements inutiles.

## Export Turtle (à maintenir valide)

`toTTL()` génère du Turtle/OWL **valide et ordonné** :
- préfixes `:`, `rdf:`, `rdfs:`, `owl:`, `xsd:` + déclaration
  `owl:Ontology` ;
- classes en **ordre hiérarchique** (une classe n'est émise qu'après toutes ses
  super-classes) pour que chaque `rdfs:subClassOf` (liste d'objets `:A, :B` si
  plusieurs parents) pointe vers des classes déjà déclarées ;
- caractéristiques en listage : `a owl:ObjectProperty, owl:TransitiveProperty, …` ;
- `owl:inverseOf` émis des deux côtés de la paire ;
- `rdfs:range` XSD pour les propriétés de donnée ;
- `rdfs:subPropertyOf :A, :B` pour les sous-propriétés ; les prédicats sont assemblés en
  liste jointe par ` ;` (un oubli de `;` rendait le TTL invalide avec `owl:inverseOf`).

Le TTL exporté doit rester chargable par **Jena** (`arq --data`, `sparql
--desc`) et convertissable par **`../owl2vowl.jar`** (VOWL JSON) — c'est le
lien avec le reste du cours ; un export cassé est un incident pédagogique.

## Barre d'outils (disposition « B »)

- **Palette `#rail`** (gauche, 88 px = `RAIL_W` : `initView()`/`zoomBy()` centrent la vue sur la zone libre
  à droite) : 4 boutons `data-mode`, libellés longs, icônes SVG en ligne (**pas de police d'icônes** :
  l'outil doit rester autonome hors-ligne). `setMode()` pilote `.active` et `aria-pressed`.
- **Barre du haut** : `#b-undo`/`#b-redo`, puis `#b-imp`, `#b-exp`, `#b-more` qui ouvrent des **menus**
  via `showMenu(bouton, entrées)` (entrées `{label, run, hint?, danger?, check?()}` ou `'-'`) : un seul menu
  ouvert, fermé par Échap, par le choix d'une entrée ou par un tap à côté (le `pointerdown` de capture
  l'absorbe pour qu'il ne crée pas de classe). Toute nouvelle action de fichier va dans l'un de ces menus.
- **`#viewctl`** (bas-droite) : zoom, recentrer, réorganiser ; le panneau (`#panel`) limite sa hauteur
  (`max-height`) pour ne pas passer dessous. Légende : pastille `#legend-pill` (bas-gauche, à droite de la palette).
- Z-index : graphe 2 < légende… (légende 1, derrière) ; panneau 5 ; pastille/contrôles 6 ; palette 9 ;
  barre du haut 10 ; menus 40 ; dialogues 50.

## Espaces de noms (éditeur, sélecteur, catalogue)

`openNamespaceEditor()` (menu ⋯) : dialogue propre (lignes préfixe/IRI, ajout, retrait, espaces courants), validation
(`validateNs()` : IRI absolue, `#` ajouté si besoin ; préfixes `[A-Za-z][\w-]*`, uniques, hors `RESERVED_PREFIXES`), remappage
des éléments si une IRI change, confirmation si on retire un espace utilisé. Panneau : `nsBlock(kind,x)` = `<select id="pf-ns">`
(par défaut, déclarés, groupe `FREQUENT_NS`, `@@edit`) ; `onNsSelect()` déclare un espace courant au premier choix
(`declareNs()`). L'export Turtle (`toTTL`) émet un `@prefix` par entrée de `nsList` et `préfixe:Nom` ; plus aucune saisie
d'espace de noms dans la fenêtre d'export. **Catalogue** : `FREQUENT_NS=loadNsCatalogue()` lit `window.ONTOLAB_NAMESPACES` défini par **`namespaces.js`**
(chargé par `<script src="namespaces.js">` avant le script principal : un `.js` et non un `.json`, car `fetch` est bloqué en
`file://`). Entrée `{prefix,iri,label,group?}` ; entrées invalides ignorées et listées dans `NS_CATALOGUE.problems` (affichées
dans l'éditeur) ; fichier absent / sans entrée valide : repli sur `BUILTIN_NS` (liste intégrée, à garder alignée avec
`namespaces.js` si on la modifie). `nsCatalogueOptions()` produit les `<optgroup>` par `group`. **Racines** : `NS_ROOTS` (lue avant `state`, depuis `window.ONTOLAB_ROOTS` : chaîne | tableau de chaînes ou `{iri,label}` ; erreurs dans
`NS_ROOTS_PROBLEMS`) ; `defaultNs()` = première racine + `mon-ontologie#` (sinon `example.org`), utilisé pour l'état initial et par
`sanitizeState`. Éditeur : si `state.ns` = racine + nom + `#` → mode « racine » (`#ns-root`, `#ns-slug`, `SLUG_RE`), sinon IRI
libre (`#ns-def`) ; l'option « Autre » bascule. C'est l'enseignant qui
édite `namespaces.js` : ne pas y mettre de logique. Côté Pi, Caddy ne sert que `/`, `/index.html` et `/namespaces.js`
(matcher `@page`) ; `install-pi.sh` (idempotent, `--check`) vérifie/corrige cela. Tout nouveau fichier à servir doit être
ajouté à ce matcher **et** à `install-pi.sh`.

## Domaine / portée hérités (A6)

`domain`/`range` (objProps) et `domain` (dataProps) peuvent être **null = hérité**. **Ne jamais lire `p.domain`/`p.range` directement pour le
dessin, la mise en page ou la logique** : utiliser `oDom(p)`, `oRng(p)`, `dDom(p)` (= `effField(p,champ,lookup)`, qui remonte les parents :
`{id, from, conflict}` ; plusieurs parents en désaccord → `conflict`, `id=null`). Les accès directs restants sont voulus : `sanitizeState`,
`deleteClass` (valeurs explicites), `toTTL` (n'écrit que les valeurs explicites), `inhSelect`. Une propriété sans domaine/portée effectif n'est
**pas dessinée** (`computeProps`/`drawObjProps` l'ignorent déjà quand une classe manque) : elle est listée par `incompleteProps()` (panneau
d'accueil « À compléter », compteur de `updateStats`). Panneau : `inhSelect()` (entrée « hérité de X : Classe » / « conflit » / « non défini »),
`inhWarn()` (avertissement non bloquant si la surcharge n'est pas une sous-classe de celle du parent). Import : `ontologyFromTriples` laisse
null le domaine/la portée absent(e) d'une fille, et ne met « Thing » qu'aux propriétés **sans parent**. Inverses : `invOK(p,q)` (valeurs effectives).

## Préférences et mode OWL / RDFS

`ui.mode` ('owl' | 'rdfs'), `ui.modeSaved` (seul le choix explicite du dialogue `openPrefs()` est enregistré, dans `ontolab-ui`),
`ui.lock`. Calcul dans `loadUI()` : lock > `?mode=` > modeSaved > `ONTOLAB_DEFAULTS.mode` (namespaces.js) > 'owl'. Helpers : `isRdfs()`,
`owlOn(p,k)` (caractéristique « visible » : à utiliser pour tout dessin / comptage), `owlList(p)` (caractéristiques portées, pour
l'indicateur du panneau), `OWL_FLAGS`. **Le modèle de données ne dépend jamais du mode** : les drapeaux OWL restent dans `objProps`
(JSON, historique) ; seuls l'affichage (panneau, dialogue de création, légende `.owl-only`, `exportLegend`, `drawObjArcs`, `dashOf`,
`updateStats`) et `toTTL` (RDFS pur : `rdfs:Class`, `rdf:Property`, pas de `owl:Ontology` ni de `@prefix owl`) en tiennent compte.
`loadExample` omet les caractéristiques en RDFS. Import : inchangé, indépendant du mode (`ontologyFromTriples` lit déjà
`rdfs:Class`/`rdf:Property` et classe par la portée ; sans portée = propriété objet). Toute nouvelle caractéristique OWL (A4) doit passer
par `owlOn`/`OWL_FLAGS`/`owlList` et être omise de `toTTL` en mode RDFS. 
**Mode compact des propriétés de donnée (G2, 1re livraison)** : `ui.cdata` (+ `cdataSaved`, `lockC`, `hiAttr`), calculé dans `loadUI()` avec la même priorité
(lock > `?compact=data|none` > choix enregistré > `ONTOLAB_DEFAULTS.compact.data` > faux) ; clé `cdata` dans `ontolab-ui`. En compact, `computeProps` ne place
aucun nœud de donnée (les autres fonctions de dessin les ignorent : absents de la table des positions) ; `drawClasses` dessine le compteur `.cnt`
(clic = sélection de la classe + panneau) ; `attrsBlock`/`wireAttrs` rendent la liste éditable dans le panneau de classe. Le modèle et `mx/my` ne sont pas touchés.
Les propriétés objet restent des nœuds (seconde livraison de G2 non faite).

## Historique, préférences d'affichage, export image

- **Historique (annuler/rétablir)** : intégré à `save()` — `trackHistory()` compare `snapOf()`
  (classes, objProps, dataProps, nextId ; **pas** la vue, la sélection, le mode ni `ns`) à la dernière
  photographie et empile l'ancienne si elle a changé. **Toute modification doit donc appeler `save()`**
  (déjà le cas) et **ne pas l'appeler à chaque micro-étape** d'un geste (mode ④ : `save()` seulement au
  `pointerup`, pour une seule entrée). `restoreSnap()` réécrit les données, `undo()`/`redo()`, plafonds
  `HIST_MAX`=100 et `HIST_CHARS`. Les imports (`state=sanitizeState(...)` puis `save()`) sont annulables.
- **Préférences d'affichage** : objet `ui` ({panel, legend}) dans `localStorage` clé `ontolab-ui`
  (hors `state`, donc hors exports) ; défaut = replié si `innerWidth < 900`. `updatePanel()` gère le
  panneau déplié (+ bouton `#pf-collapse`) ou masqué (rouvert par l'entrée « Panneau d'édition » du menu ⋯,
  il n'y a plus de pastille de panneau) ; le corps du panneau est `renderPanelBody()` (ne pas y rappeler `updatePanel()`). La légende (z-index 1) est derrière
  le graphe (2) : ses contrôles sont la pastille `#legend-pill` (z-index 6), pas des éléments internes.
- **Export image** : `exportImage()` → `buildExportSVG({legend,bg})` (re-rendu sans sélection, sérialisation
  `XMLSerializer` des 4 couches + `<defs>` des marqueurs, boîte `exportBBox()`, légende redessinée par
  `exportLegend()`) → SVG, ou `svgToPng()` (canvas, plafond 16 Mpx) → `deliverFile()` (feuille de
  partage `navigator.share` sur écran tactile, sinon `download()`). Si on ajoute un élément graphique, vérifier
  qu'il est dans une des 4 couches et ne dépend pas du CSS de la page (attributs de présentation en ligne).

## Fichiers (import JSON / TTL) : à garder tel quel pour iPad

`#f-json` et `#f-ttl` sont des `<input type=file>` **permanents dans le DOM** (visuellement cachés,
pas `display:none`), jamais créés à la volée : sur Safari iOS un input détaché peut être libéré avant
la fin du choix et `change` n'arrive jamais. `#f-ttl` n'a **pas** d'attribut `accept` (iOS grise
`.ttl`, type inconnu). `openFilePicker()` vide `value` avant `click()` pour pouvoir re-sélectionner
le même fichier. Les erreurs d'import passent par `infoBox()` (bloquant) et non par `status()`.

## Import Turtle (`importTTL()`)

Remplace l'ontologie courante (avec confirmation, sauf si elle est vide et qu'il n'y a rien à
signaler). Trois briques, toutes en JS pur dans `index.html` (pas de dépendance) :
- `parseTurtle(src)` — analyseur Turtle (`@prefix`/`@base` et `PREFIX`/`BASE`, IRI relatives,
  noms préfixés, `a`, listes `;` `,`, littéraux simples/longs/@lang/^^, nombres, booléens,
  `[ ]`, `( )`) → triplets `[s,p,o]` (termes `'I'+iri`, `'B'+id`, `'L'+texte`). Erreurs avec n° de
  ligne. Vérifié contre rdflib et Jena (`riot --count`) : mêmes décomptes de triplets.
- `ontologyFromTriples(T)` — triplets → `{classes, objProps, dataProps, nextId, ns, notes}` :
  détection des classes/propriétés (déclarées, ou déduites de `subClassOf`/`domain`/`range`),
  genre objet/donnée (types OWL, sinon portée), `owl:Thing`/domaine absent → classe « Thing »,
  `XSD_MAP` pour les types non gérés, inverses (seulement si domaine/portée croisés), parents
  (même genre), `cleanParents()`, namespace majoritaire (`ns` de l'ontologie) ; les éléments d'un autre
  espace de noms gardent le leur (`ownNs()`, champ `x.ns`) et le préfixe du fichier (`prefixes` renvoyé par
  `parseTurtle`, 2ᵉ argument de `ontologyFromTriples`) ; le `@prefix :` du fichier l'emporte comme espace par défaut ; `notes` = ce qui n'est pas repris.
- `importTTL()` — fichier → analyse → confirmation avec les notes → `sanitizeState()` +
  `initView()` + `render()`.
Un TTL exporté par `toTTL()` doit se réimporter à l'identique (test : export → import → export
→ comparer les ensembles de triplets) ; garder cette propriété en faisant évoluer l'un ou l'autre.

## Périmètre assumé (v1)

Construire + visualiser + exporter. Hors périmètre (voir `README.md` §
« Perfectionnements à l'étude » et « Limites ») : `disjointUnionOf`,
individus, restrictions OWL, export image, import RDF/XML ou fusion d'ontologies. Ne pas élargir le
périmètre sans demande explicite.

**`ROADMAP.md`** recense les évolutions envisagées (fiches avec intérêt, modèle de données, impact
sur le code, effort). Ce sont des idées retenues *pour plus tard* : ne rien en implanter sans demande
explicite ; en implanter une = la retirer du ROADMAP et mettre à jour `README.md` / `AGENTS.md`.
