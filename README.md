# OntoLab — constructeur d'ontologies (outil pédagogique)

**`index.html`** est un fichier unique, sans dépendance : double-cliquez dessus
pour l'ouvrir dans un navigateur (Chrome, Firefox, Safari). Pas de serveur, pas
de Java, fonctionne hors-ligne. Le travail est sauvegardé automatiquement dans
le navigateur (localStorage) et exportable/importable en JSON.

L'interface reprend les codes visuels de la **notation VOWL** (cf. WebVOWL /
`owl2vowl.jar` dans le dossier `Outils/` parent) :

| Visuel | Signification |
|--------|---------------|
| Ellipse bleue | classe — l'anneau = profondeur de la hiérarchie `rdfs:subClassOf` |
| Ellipse verte | propriété objet — flèche : domaine → portée |
| Ellipse rouge | propriété de donnée (type XSD sous l'étiquette) |
| Petite boucle verte sur une classe | `owl:TransitiveProperty` |
| Flèches aux deux extrémités | `owl:SymmetricProperty` |
| Bordure verte pointillée | `owl:FunctionalProperty` |
| Symboles `⇄` sur deux propriétés | paire `owl:inverseOf` |

## Les trois modes (touches 1 / 2 / 3)

1. **Classe** — clic sur le fond : nouvelle classe ; glisser une classe sur une
   autre : `subClassOf` ; glisser sur le fond : détacher (redevient racine).
2. **Propriété objet** — glisser d'une classe (domaine) vers une classe
   (portée) ; les caractéristiques OWL se cochent au moment de la création ou
   dans le panneau (transitive, symétrique, fonctionnelle, paire inverse).
   Déposer sur soi-même crée une propriété de la classe vers elle-même
   (ex. `connaît : Personne → Personne`).
3. **Propriété de donnée** — clic sur une classe ; choix du type XSD.
4. **Déplacer** — glisser tout élément (classe, étiquette de propriété) pour le
   repositionner à la main ; les flèches et arcs suivent. Le bouton
   **Réorganiser** recalcule la mise en page automatique et efface les
   positions manuelles. Double-clic sur le fond : recentrer la vue.

La mise en page automatique est en trois temps : secteurs angulaires
proportionnels à la largeur de chaque sous-arborescence (les noms longs
réclament plus d'espace), rayons d'anneaux dimensionnés pour contenir cette
largeur totale, puis une passe de relaxation qui pousse à l'écart tout
chevauchement restant (classes, étiquettes de propriétés) en préservant la
structure radiale.

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

## Enchaînement avec la boîte à outils Jena du cours

Placez le fichier exporté dans `ontologies/` d'un exercice, puis :

```bash
arq --data ontologies/ontologie-ontolab.ttl --query req.sparql
# ou avec raisonnement, cf. README racine (sparql --desc + assemblageur)
```

Pour voir le résultat dans le vrai **WebVOWL** (notation identique) — depuis
le dossier d'exercice, ⚠️ `java` 8 requis (plante sous Java 17+ : Guice/cglib) :

```bash
/Library/Internet\ Plug-Ins/JavaAppletPlugin.plugin/Contents/Home/bin/java -jar ../../Outils/owl2vowl.jar -file ontologies/ontologie-ontolab.ttl -output ontologie-ontolab.json
# → charger le JSON dans https://vowl.visualdataweb.org/webvowl.html
```

## Idées d'exercices en TD

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

- Ajuster les paramètres de la relaxation (marge, itérations, force
  d'ancrage) sur les cas chargés — ex. ontologies Rando/Mondial complètes.
- Repoussement des étiquettes de propriétés entre elles (déjà géré par la
  relaxation, à valider visuellement).
- `disjointUnionOf`, individus (`owl:NamedIndividual`), restrictions
  (`someValuesFrom`/cardinalités) dans l'éditeur.
- Import TTL/RDF (aujourd'hui export uniquement + JSON).
- Export PNG/SVG de la visualisation pour les supports de TD.

## Limites (assumées, pédagogie > complétude)

- Une seule super-classe par classe (un parent), comme le permet la lecture
  rapide d'un diagramme VOWL ; les ontologies avec plusieurs parents
  (disjonction de super-classes) ne sont pas modélisables ici.
- Pas d'individus (`owl:NamedIndividual`), pas de `disjointUnionOf`,
  pas de restrictions (`someValuesFrom`/`onlyValuesFrom`) ni de cardinaux.
- La mise en page automatique est par anneaux concentriques ; le placement
  manuel (mode ④) est conservé tant qu'on ne relance pas « Réorganiser ».
- Les noms sont utilisés tels quels comme noms locaux d'IRI (accents
  autorisés) ; les noms durs (espaces) sont remplacés par `_` à l'export.
