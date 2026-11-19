# OntoLab — constructeur d'ontologies (outil pédagogique)

Outil pédagogique de construction d'ontologies RDFS/OWL : modélisation
interactive (classes, propriétés objet avec caractéristiques OWL, propriétés
de donnée), visualisation de type VOWL, export Turtle.

## Démarrage rapide

**`index.html`** est un fichier unique, sans aucune dépendance :

1. clonez le repo (ou téléchargez l'archive ZIP de GitHub) ;
2. ouvrez `index.html` dans un navigateur (Chrome, Firefox, Safari) —
   double-clic, pas de serveur, pas de Java, fonctionne **hors-ligne** ;
3. bouton **Exemple** : charge une mini-ontologie de démo.

Le travail est sauvegardé automatiquement dans le navigateur (localStorage) et
est exportable/importable en JSON (« Exporter JSON » / « Importer JSON ») pour
le partager ou le sauvegarder durablement. Le bouton « Exporter TTL » produit,
lui, un fichier `.ttl` OWL standard, lisible par tout outil RDF.

> **Développeurs** : l'architecture, le modèle de données et les points de
> vigilance sont documentés dans `AGENTS.md`. Licence : GPL-3.0 (fichier
> `LICENSE`).

L'interface reprend les codes visuels de la **notation VOWL**
(cf. [WebVOWL](https://vowl.visualdataweb.org)) :

| Visuel | Signification |
|--------|---------------|
| Ellipse bleue | classe |
| Flèche à pointe creuse | `rdfs:subClassOf` : de la sous-classe vers sa super-classe |
| Ligne pointillée à pointe creuse (verte / rouge) | `rdfs:subPropertyOf` : de la sous-propriété vers sa propriété parente (objet / donnée) |
| Ellipse verte | propriété objet — flèche : domaine → portée |
| Ellipse rouge | propriété de donnée (type XSD sous l'étiquette) |
| Petite boucle verte sur une classe | `owl:TransitiveProperty` |
| Flèches aux deux extrémités | `owl:SymmetricProperty` |
| Bordure verte pointillée | `owl:FunctionalProperty` |
| Symboles `⇄` sur deux propriétés | paire `owl:inverseOf` |

## Les modes (touches 1 / 2 / 3 / 4)

1. **Classe** — clic sur le fond : nouvelle classe ; glisser une classe sur une
   autre : `subClassOf` ; glisser sur le fond : détacher (redevient racine).
2. **Propriété objet** — glisser d'une classe (domaine) vers une classe
   (portée) ; les caractéristiques OWL se cochent au moment de la création ou
   dans le panneau (transitive, symétrique, fonctionnelle, paire inverse).
   **Héritage de propriété** (`rdfs:subPropertyOf`) : glisser une ellipse verte
   sur une autre ellipse verte, ou menu « Sous-propriété de » du panneau ; lâcher
   sur le fond pour détacher.
   Déposer sur soi-même crée une propriété de la classe vers elle-même
   (ex. `connaît : Personne → Personne`).
3. **Propriété de donnée** — clic sur une classe ; choix du type XSD. Comme en
   ②, glisser une ellipse rouge sur une autre = sous-propriété de donnée.
4. **Déplacer** — glisser tout élément (classe, étiquette de propriété) pour le
   repositionner à la main ; les flèches et arcs suivent. Le bouton
   **Réorganiser** recalcule la mise en page automatique et efface les
   positions manuelles. Double-clic sur le fond : recentrer la vue.

La mise en page automatique fonctionne par composante connexe (classes reliées
par `subClassOf` ou par une propriété objet) : simulation à forces (ressorts le
long des liens, repoussement des ellipses, sous-classes placées sous leur
super-classe), plusieurs départs déterministes dont on garde celui qui a le moins
de croisements d'arêtes, puis empaquetage des composantes en rangées. Les
étiquettes de propriétés objet sont posées sur leur arête (la courbe passe par
leur centre) ; boucles et propriétés de donnée prennent, autour de leur classe, la place
la moins encombrée (sans recouvrir classes, étiquettes ni arêtes) ; une dernière passe de relaxation pousse à
l'écart tout chevauchement restant.

**Écran tactile (iPad, tablette)** : les mêmes gestes fonctionnent au doigt ou au
stylet — toucher = clic, glisser = glisser. Pincer à deux doigts : zoom et
déplacement de la vue ; glisser le fond à un doigt : déplacement. Le bouton
**Recentrer** remplace le double-clic ; le panneau contient le bouton de
suppression (pas de touche `Suppr` sur tablette) et la barre d'outils défile
horizontalement si l'écran est étroit. Les touches `1`-`4` ont pour équivalent
les boutons de mode.

Clic sur n'importe quel élément : édition (nom, domaine, portée,
caractéristiques, suppression) dans le panneau de droite. Molette : zoom ;
glisser le fond : déplacement ; `Suppr` : supprimer l'élément sélectionné.

Bouton **Exemple** : charge une mini-ontologie de randonnées (Personne ⊃
Membre, Guide ; Groupe ; Voie ⊃ Sentier, Piste ; `connaît` transitive et
symétrique, `mène-à` transitive, `encadre` fonctionnelle, types XSD) — idéale
pour montrer chaque concept d'un coup.

## Export Turtle

« **Exporter TTL** » affiche et télécharge un fichier `.ttl` OWL en Turtle
(namespace modifiable) :

```ttl
@prefix : <http://example.org/onto#> .
@prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> .
@prefix owl: <http://www.w3.org/2002/07/owl#> .
@prefix xsd: <http://www.w3.org/2001/XMLSchema#> .

<http://example.org/onto> rdf:type owl:Ontology .

:Personne rdf:type owl:Class .
:Membre rdf:type owl:Class ;
    rdfs:subClassOf :Personne .

:connaît a owl:ObjectProperty, owl:TransitiveProperty, owl:SymmetricProperty ;
    rdfs:domain :Personne ;
    rdfs:range :Personne .

:âge a owl:DatatypeProperty ;
    rdfs:domain :Membre ;
    rdfs:range xsd:integer .
```

## Enchaîner avec d'autres outils

Le `.ttl` exporté est du **Turtle/OWL standard** : il se charge dans n'importe
quel outil RDF (Jena, Apache Jena Fuseki, Protégé, Stardog, …) et se requête en
SPARQL avec ou sans raisonnement.

Dans le cadre du cours Web Sémantique, la boîte à outils Jena s'utilise ainsi
(les chemins relatifs ci-dessous sont ceux de l'arborescence du cours) :

```bash
# requêter sans raisonnement
arq --data ontologies/ontologie-ontolab.ttl --query req.sparql
# ou avec raisonnement, cf. README racine (sparql --desc + assemblageur)
```

Pour voir le résultat dans le vrai **WebVOWL** (notation identique), convertir
le TTL en JSON avec [OWL2VOWL](https://github.com/VisualDataWeb/OWL2VOWL)
(`owl2vowl.jar`, ⚠️ **Java 8 requis** — plante sous Java 17+) :

```bash
java -jar owl2vowl.jar -file ontologie-ontolab.ttl -output ontologie-ontolab.json
# → charger le JSON dans https://vowl.visualdataweb.org/webvowl.html
```

## Idées d'exercices en TD

(les dossiers cités entre parenthèses font partie du matériel du cours —
toute ontologie ou MCD de votre choix convient)

1. **Repérage** : montrer l'exemple chargé ; faire identifier chaque axiome
   (subClassOf, domaine, portée, transitivité…) dans la visualisation, puis
   retrouver les mêmes axiomes dans le TTL exporté.
2. **Modélisation guidée** : reprendre un MCD existant du cours (`Veto`,
   `Lib-cafe`, `Mariage`…) et le transformer en ontologie ; comparer avec
   l'ontologie de référence du dossier correspondant.
3. **Caractéristiques OWL** : modéliser un domaine où des propriétés
   transitives/symétriques/inverses ont un sens (ex. `Aime/` : `connait`),
   export, et vérifier l'effet avec Jena + `OWLFBRuleReasoner` (cf. README
   racine, tableau des raisonneurs).
4. **Correction** : charger une ontologie JSON fournie (exportée avec un
   bug : domaine/portée inversés, cycle manquant…) et la faire corriger
   avant export.

## Perfectionnements à l'étude

- Ajuster les paramètres de la mise en page (longueurs de ressort, forces,
  nombre de départs, marge de relaxation) sur les cas chargés — ex. ontologies Rando/Mondial complètes.
- Repoussement des étiquettes de propriétés entre elles (déjà géré par la
  relaxation, à valider visuellement).
- `disjointUnionOf`, individus (`owl:NamedIndividual`), restrictions
  (`someValuesFrom`/cardinalités) dans l'éditeur.
- Import TTL/RDF (aujourd'hui export uniquement + JSON).
- Export PNG/SVG de la visualisation pour les supports de TD.

## Limites (assumées, pédagogie > complétude)

- Une seule super-propriété par propriété (comme pour les classes, un seul parent), et
  uniquement entre propriétés du même type (objet/objet, donnée/donnée).
- Une seule super-classe par classe (un parent), comme le permet la lecture
  rapide d'un diagramme VOWL ; les ontologies avec plusieurs parents
  (disjonction de super-classes) ne sont pas modélisables ici.
- Pas d'individus (`owl:NamedIndividual`), pas de `disjointUnionOf`,
  pas de restrictions (`someValuesFrom`/`onlyValuesFrom`) ni de cardinaux.
- La mise en page automatique est à forces (cf. ci-dessus) ; le placement
  manuel (mode ④) est conservé tant qu'on ne relance pas « Réorganiser ».
- Les noms sont utilisés comme noms locaux d'IRI (accents autorisés) ; tout
  caractère autre que lettre, chiffre, `_`, `-` ou `.` est remplacé par `_`,
  et l'unicité des noms est testée sur ce nom local.

## Licence

GPL-3.0 — voir le fichier [`LICENSE`](LICENSE).
