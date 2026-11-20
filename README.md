# OntoLab — constructeur d'ontologies (outil pédagogique)

Outil pédagogique de construction d'ontologies RDFS/OWL : modélisation
interactive (classes, propriétés objet avec caractéristiques OWL, propriétés
de donnée), visualisation de type VOWL, export Turtle.

## Démarrage rapide

**`index.html`** est un fichier unique, sans aucune dépendance :

1. clonez le repo (ou téléchargez l'archive ZIP de GitHub) ;
2. ouvrez `index.html` dans un navigateur (Chrome, Firefox, Safari) —
   double-clic, pas de serveur, pas de Java, fonctionne **hors-ligne** ;
3. menu **⋯ › Charger l'exemple** : charge une mini-ontologie de démo.

## L'interface

- **Palette de modes** (colonne de gauche) : ① Classe, ② Propriété objet, ③ Propriété de donnée,
  ④ Déplacer — touches `1` à `4`.
- **Barre du haut** : annuler ↶ / rétablir ↷, menu **Importer ▾** (Turtle, JSON OntoLab), menu
  **Exporter ▾** (Turtle, JSON OntoLab, image PNG/SVG) et menu **⋯** (Charger l'exemple, Vider l'ontologie,
  Panneau d'édition, Espaces de noms…, Aide et raccourcis).
- **Contrôles de vue** (en bas à droite, au-dessus du graphe) : zoom +, zoom −, recentrer, réorganiser.
- **Légende** : pastille en bas à gauche ; **panneau d'édition** à droite (replié/affiché par le menu ⋯).

Le travail est sauvegardé automatiquement dans le navigateur (localStorage) et
est exportable/importable en JSON (« Exporter ▾ › JSON OntoLab » / « Importer ▾ › JSON OntoLab ») pour
le partager ou le sauvegarder durablement. « Exporter ▾ › Turtle » produit,
lui, un fichier `.ttl` OWL standard, lisible par tout outil RDF.

> **Développeurs** : l'architecture, le modèle de données et les points de
> vigilance sont documentés dans `AGENTS.md`. Licence : GPL-3.0 (fichier
> `LICENSE`).

L'interface reprend les codes visuels de la **notation VOWL**
(cf. [WebVOWL](https://vowl.visualdataweb.org)) :

| Visuel | Signification |
|--------|---------------|
| Ellipse bleue | classe |
| Flèche à pointe creuse | `rdfs:subClassOf` : de la sous-classe vers sa super-classe (**plusieurs super-classes possibles** : une flèche par parent) |
| Ligne pointillée à pointe creuse (verte / rouge) | `rdfs:subPropertyOf` : de la sous-propriété vers sa propriété parente (objet / donnée), plusieurs parents possibles |
| Ellipse verte | propriété objet — flèche : domaine → portée |
| Ellipse rouge | propriété de donnée (type XSD sous l'étiquette) |
| Petite boucle verte sur une classe | `owl:TransitiveProperty` |
| Flèches aux deux extrémités | `owl:SymmetricProperty` |
| Bordure verte en tirets | `owl:FunctionalProperty` |
| Bordure verte en points | `owl:InverseFunctionalProperty` (tirets-points : les deux) |
| Symboles `⇄` sur deux propriétés | paire `owl:inverseOf` |

## Les modes (touches 1 / 2 / 3 / 4)

1. **Classe** — clic sur le fond : nouvelle classe ; glisser une classe sur une
   autre : lui **ajoute** une super-classe (`subClassOf`, héritage multiple : répéter
   le geste avec un autre parent) ; glisser sur le fond : retire toutes ses
   super-classes (redevient racine). Le panneau liste les parents sous forme de
   pastilles (× pour en retirer un) avec un menu pour en ajouter.
2. **Propriété objet** — glisser d'une classe (domaine) vers une classe
   (portée) ; les caractéristiques OWL se cochent au moment de la création ou
   dans le panneau (transitive, symétrique, fonctionnelle, **fonctionnelle inverse**, paire inverse).
   **Héritage de propriété** (`rdfs:subPropertyOf`, multiple lui aussi) : glisser une
   ellipse verte sur une autre ellipse verte, ou menu du panneau ; lâcher sur le
   fond pour retirer tous les parents.
   Déposer sur soi-même crée une propriété de la classe vers elle-même
   (ex. `connaît : Personne → Personne`).
3. **Propriété de donnée** — clic sur une classe ; choix du type XSD. Comme en
   ②, glisser une ellipse rouge sur une autre = sous-propriété de donnée.
4. **Déplacer** — glisser tout élément (classe, étiquette de propriété) pour le
   repositionner à la main ; les flèches et arcs suivent. Le bouton flottant
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
déplacement de la vue ; glisser le fond à un doigt : déplacement. Les boutons flottants
**+ / − / Recentrer** remplacent molette et double-clic ; le panneau contient le bouton de
suppression (pas de touche `Suppr` sur tablette). La barre du haut tient sur une rangée même en
portrait, et la palette de modes remplace les touches `1`-`4`.

**Double-clic** (ou **double tap** au toucher) sur une classe ou une propriété : la sélectionne et
**ouvre le panneau d'édition sur elle**, même s'il était replié (sur ordinateur, le champ « Nom » est
actif ; sur tablette, le clavier ne s'ouvre pas tout seul).

Clic sur n'importe quel élément : édition (nom, domaine, portée,
caractéristiques, suppression) dans le panneau de droite. Molette : zoom ;
glisser le fond : déplacement ; `Suppr` : supprimer l'élément sélectionné ; `Cmd/Ctrl+Z` : annuler ; `Échap` ou **clic sur
le fond** : désélectionner (en mode ① Classe, le clic sur le fond désélectionne d'abord, et ne
crée une classe que s'il n'y a rien de sélectionné).

Menu **⋯ › Charger l'exemple** : charge une mini-ontologie de randonnées (Personne ⊃
Membre, Guide ; Groupe ; Voie ⊃ Sentier, Piste ; `connaît` transitive et
symétrique, `mène-à` transitive, `encadre` fonctionnelle, types XSD) — idéale
pour montrer chaque concept d'un coup.

## Annuler / rétablir, panneau, légende, image

- **Annuler / Rétablir** : boutons ↶ ↷ de la barre du haut, ou `Cmd/Ctrl+Z` et
  `Cmd/Ctrl+Maj+Z` (`Ctrl+Y`). Jusqu'à 100 étapes ; couvre toute modification des classes et
  des propriétés (création, suppression, renommage, héritage, déplacement — un glisser = une étape),
  y compris « Vider », « Réorganiser » et les imports JSON/TTL. La vue (zoom), la sélection et
  le mode ne sont pas dans l'historique, et l'historique n'est pas conservé au rechargement de la
  page. Dans un champ texte, l'annulation native du navigateur reste active.
- **Panneau et légende repliables** : le bouton **–** du panneau le replie, et l'entrée « Panneau
  d'édition » du menu ⋯ (cochée quand il est affiché) le rouvre ; la pastille en bas à gauche masque
  ou affiche la légende. Les deux sont **repliés par défaut sur écran étroit** (< 900 px, iPad en portrait) ;
  le choix est mémorisé sur l'appareil.
- **Exporter ▾ › Image** : PNG (1×, 2× ou 3×) ou SVG vectoriel du schéma **entier** (quelle que soit la
  partie visible), avec ou sans légende, fond blanc ou transparent ; la sélection n'apparaît pas.
  Sur iPad / iPhone, le fichier est proposé via la feuille de partage (« Enregistrer l'image »).

## Espaces de noms (IRI) des éléments

L'IRI d'une classe ou d'une propriété = **espace de noms + nom**.

- **Éditeur** : menu **⋯ › Espaces de noms…**. La première ligne est l'espace de noms de
  l'ontologie (préfixe `:` dans le Turtle) ; les suivantes sont des espaces de noms
  supplémentaires, chacun avec son **préfixe** (`foaf`, `skos`…). On peut les ajouter à la main, ou
  choisir dans une liste d'**espaces courants** : FOAF, Dublin Core (terms et elements), SKOS,
  schema.org, ORG, PROV-O, OWL-Time, WGS84, vCard, DCAT, SIOC, BIBO, SHACL, DBpedia (ontologie et
  ressources), Wikidata (liste modifiable par l'enseignant, voir ci-dessous). Les préfixes `rdf`, `rdfs`, `owl`, `xsd` sont réservés ; chaque préfixe et chaque
  IRI doit être unique. Retirer un espace utilisé demande confirmation (ses éléments reviennent à l'espace
  par défaut) ; modifier son IRI met à jour ses éléments.
- **Panneau d'édition** : sous le nom, un **sélecteur « Espace de noms »** propose l'espace par défaut,
  les espaces déclarés, les espaces courants (choisir l'un d'eux le déclare aussitôt) et « Gérer les
  espaces de noms… ». L'**IRI complète** s'affiche dessous et suit le nom. Sans sélection, le panneau
  d'accueil donne l'espace de noms de l'ontologie et un bouton vers l'éditeur.
- **Turtle** : les espaces déclarés deviennent des `@prefix` ; les éléments s'écrivent `:Nom` (espace
  par défaut) ou `foaf:Nom` (leur préfixe). **À l'import**, un élément d'un autre espace de noms le garde,
  avec le préfixe qu'il avait dans le fichier ; le `@prefix :` du fichier devient l'espace par défaut.
- Annuler / rétablir couvre aussi les espaces de noms ; « Charger l'exemple » et « Vider » remettent la
  liste à zéro (l'espace par défaut est conservé).

### Catalogue des espaces courants (pour l'enseignant)

La liste des espaces courants se maintient dans **`namespaces.js`**, à côté de `index.html` : une ligne par espace
(`{prefix, iri, label, group}`), le format est détaillé en tête du fichier. Pas d'autre fichier à toucher ;
vérifiez une IRI sur <https://prefix.cc> avant de l'ajouter. Une ligne erronée est ignorée et signalée en bas de
l'éditeur d'espaces de noms ; si le fichier manque, OntoLab retombe sur sa liste intégrée (rien ne casse hors ligne).
Pour publier : modifier, commiter, `./deploy.sh`.

**Racine d'IRI pour les ontologies des étudiants** : `ONTOLAB_ROOTS`, en bas de `namespaces.js`, donne une ou plusieurs
racines (ex. `http://www.univ-nantes.fr/ns/`). Dans **⋯ › Espaces de noms…**, l'étudiant choisit la racine et saisit le
**nom** de son ontologie : `http://www.univ-nantes.fr/ns/mon-onto#` (nom : lettres, chiffres, `- _ . ~`). « Autre » laisse
une IRI libre, comme sans racine. La première racine sert d'espace de départ (nom `mon-ontologie`) à un nouvel utilisateur ;
un état déjà enregistré dans le navigateur n'est pas modifié.

**Première installation sur le Pi** (ou si Caddy ne sert pas `namespaces.js`) : `./install-pi.sh` (ou
`./install-pi.sh --check` pour seulement voir l'état). Il vérifie le clone git et ajoute `/namespaces.js` aux
fichiers servis par Caddy, avec sauvegarde du Caddyfile, validation et retour arrière si la configuration est refusée.

## Export Turtle

« **Exporter ▾ › Turtle** » affiche et télécharge un fichier `.ttl` OWL en Turtle
(namespace par défaut modifiable ; un élément peut avoir le sien) :

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

## Importer un fichier Turtle

« **Importer ▾ › Turtle** » charge un fichier `.ttl` (Turtle) et **remplace** l'ontologie
courante après confirmation. Un fichier exporté par OntoLab est relu à l'identique
(export → import → export redonne les mêmes triplets). Les ontologies venant d'ailleurs
(Protégé, cours, Internet…) sont lues pour ce qu'OntoLab sait représenter :

- **repris** : classes (`owl:Class`, `rdfs:Class`), `rdfs:subClassOf` (plusieurs parents),
  propriétés objet et de donnée (déduites aussi d'un domaine/d'une portée en RDFS pur),
  `rdfs:domain`, `rdfs:range`, `rdfs:subPropertyOf` (plusieurs parents, même type),
  `owl:inverseOf`, propriétés transitives, symétriques, fonctionnelles, fonctionnelles inverses ; le namespace
  le plus fréquent du fichier devient celui de l'ontologie, et **chaque élément d'un autre namespace
  le conserve** (champ « Espace de noms » de son panneau) ;
- **adapté** : types XSD non gérés ramenés au plus proche (`xsd:int` → `xsd:integer`,
  `xsd:float` → `xsd:double`, `rdfs:Literal` → `xsd:string`) ; propriété sans domaine ou
  portée précis (ou `owl:Thing`) rattachée à une classe « Thing » ajoutée ; une seule
  valeur de domaine/portée par propriété (les autres sont ignorées) ;
- **ignoré, et signalé avant d'importer** : individus, restrictions (`someValuesFrom`,
  cardinalités…), classes anonymes (`unionOf`, `intersectionOf`), `equivalentClass`,
  `disjointWith`, annotations (`rdfs:label`, `rdfs:comment`…), imports.

Sur **iPad / iPhone**, tous les fichiers sont proposés dans le sélecteur (pas de filtre sur
`.ttl`, que iOS ne reconnaît pas) : choisissez simplement votre fichier dans l'app Fichiers.
Le fichier doit être en **Turtle** : le RDF/XML est refusé avec un message (convertissez-le,
par exemple avec Protégé, `riot --output=turtle` de Jena ou rdflib). Les erreurs de syntaxe
sont signalées avec leur numéro de ligne.

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

La liste détaillée et ordonnée des fonctions envisagées est dans
**[`ROADMAP.md`](ROADMAP.md)** (rien n'y est encore implanté) : annuler/rétablir, étiquettes et
commentaires, disjonction et équivalence de classes, restrictions et cardinalités, individus,
export image et export VOWL JSON, fusion à l'import, navigation dans les grandes ontologies,
tests automatisés… Autre piste immédiate : ajuster les paramètres de la mise en page sur des
ontologies complètes (ex. Rando/Mondial).

## Limites (assumées, pédagogie > complétude)

- L'héritage de propriété se fait uniquement entre propriétés du même type
  (objet/objet, donnée/donnée). L'héritage multiple n'exprime que des
  super-classes cumulées (`rdfs:subClassOf :A, :B`), pas d'union ni de disjonction.
- Pas d'individus (`owl:NamedIndividual`), pas de `disjointUnionOf`,
  pas de restrictions (`someValuesFrom`/`onlyValuesFrom`) ni de cardinaux.
- La mise en page automatique est à forces (cf. ci-dessus) ; le placement
  manuel (mode ④) est conservé tant qu'on ne relance pas « Réorganiser ».
- L'import TTL remplace l'ontologie (pas de fusion) et ne lit pas le RDF/XML.
- Les noms sont utilisés comme noms locaux d'IRI (accents autorisés) ; tout
  caractère autre que lettre, chiffre, `_`, `-` ou `.` est remplacé par `_`,
  et l'unicité des noms est testée sur ce nom local.

## Licence

GPL-3.0 — voir le fichier [`LICENSE`](LICENSE).
