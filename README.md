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
   **Domaine et portée hérités** : dans le panneau, une sous-propriété peut laisser son domaine
   (et sa portée) sur « hérité de … » : ils sont alors ceux de la propriété parente, affichés sur le graphe
   mais **non écrits** dans le Turtle (`rdfs:subPropertyOf` suffit). Si plusieurs parents n'ont pas le même
   domaine, le panneau signale un **conflit** à préciser ; une propriété sans domaine ou portée effectif n'est
   pas dessinée et apparaît dans la liste « À compléter » du panneau d'accueil (et dans le compteur du bas).
   Un domaine/une portée choisi(e) qui n'est pas une sous-classe de celui/celle de la parente est signalé(e)
   par un avertissement (non bloquant). À l'import, un domaine absent chez une fille dont la parente en a un
   devient « hérité » (au lieu de « Thing »).
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

## Préférences : mode OWL / RDFS

**⋯ › Préférences…** choisit le vocabulaire proposé.
- **OWL** (par défaut) : tout est disponible (transitive, symétrique, fonctionnelle, fonctionnelle inverse, propriété inverse).
- **RDFS** : ces éléments OWL sont masqués (panneau, création de propriété, légende, marques sur le graphe) et l'**export Turtle est du
  RDFS pur** : `rdfs:Class` et `rdf:Property`, sans `owl:Ontology` ni aucun `owl:*`. RDFS ne distingue pas propriété objet et propriété de
  donnée : à l'import, un type `xsd:` en portée donne une propriété de donnée, une classe une propriété objet, **l'absence de portée une
  propriété objet**.
- Les caractéristiques OWL déjà saisies **restent dans l'ontologie** (JSON, historique) : le panneau de la propriété les rappelle
  (« caractéristiques OWL masquées : transitive… »), la fenêtre d'export en indique le nombre, et repasser en OWL les retrouve.
  « Charger l'exemple » en mode RDFS charge l'exemple sans caractéristiques OWL.
- L'**import** ne dépend pas du mode (il lit `owl:Class` comme `rdfs:Class`, `owl:ObjectProperty` comme `rdf:Property`).
- Le mode est enregistré dans le navigateur (hors historique annuler/rétablir). L'enseignant peut le piloter : lien `…/ontolab/?mode=rdfs`
  (ne remplace pas durablement le choix enregistré), ou défaut / réglage imposé `ONTOLAB_DEFAULTS` dans `namespaces.js`
  (`lock:true` : l'étudiant ne peut plus le changer). Priorité : réglage imposé > lien > choix enregistré > défaut > OWL.

### Préférences : propriétés de donnée compactes

Case **« Propriétés de donnée compactes »** dans **⋯ › Préférences…**. Les propriétés de donnée ne sont alors plus des nœuds rouges :
chaque classe porte un compteur **« +N »**, et ses attributs se lisent et s'éditent dans son panneau (nom et type XSD sur place,
✕ pour supprimer, **Détails** pour le domaine, les parents et l'espace de noms ; ceux des classes ancêtres apparaissent en gris).
Le bouton « + attribut » et le mode ③ (clic sur une classe) créent un attribut. Seul l'**affichage** change : ontologie, Turtle et JSON
sont identiques, les positions des nœuds sont conservées et reviennent au retour en mode normal. L'export image reflète l'affichage courant.
L'enseignant peut régler le défaut (`ONTOLAB_DEFAULTS.compact:{data:true}`), le lien `…/ontolab/?compact=data` (ou `?compact=none`),
et le verrouiller avec `lock:true`. Même priorité que le mode : verrou > lien > choix enregistré > défaut > normal.

**Propriétés objet compactes** (seconde case) : la propriété n'est plus une ellipse mais une **flèche** dont l'étiquette est une **pastille verte**
(bordure en tirets : fonctionnelle, en points : fonctionnelle inverse). Pastilles lettrées **T** (transitive), **S** (symétrique, double pointe conservée),
**⇄** (inverse ; les deux propriétés d'une paire gardent chacune leur flèche). Une sous-propriété n'a plus d'arc : « ⊆ parent » est écrit sous la pastille.
Propriétés parallèles = courbes décalées, domaine = portée = boucle. Une propriété qui n'a qu'une extrémité est une flèche en tirets vers « ? »
(elle figure aussi dans « À compléter »). En mode Déplacer, glisser la pastille courbe la flèche. Réglages enseignant : `compact:{data,obj}`, `?compact=data,obj`.

### Tests automatisés (développeurs)

`./test.sh` (ou `npm test`) lance une soixantaine de tests Node sans dépendance (~15 s) : analyse et export Turtle, aller-retour export → import, import de fichiers types,
modèle et héritage, rendu et panneau dans toutes les combinaisons de préférences, vérification de cohérence, mise en page, catalogue d'espaces de noms. Si Apache Jena (`riot`)
est installé (variable `JENA_RIOT` ou `~/Applications/Jena/…`), les exports sont aussi validés par lui. `./deploy.sh` lance les tests avant de pousser.

### Disjonction et équivalence (mode OWL)

Dans le panneau d'une classe : **Disjointe de** (`owl:disjointWith`) et **Équivalente à** (`owl:equivalentClass`), listes retirables avec menu d'ajout (une classe ne peut pas être à la fois disjointe et équivalente).
Sur le graphe : trait pointillé violet + pastille **⊥** entre classes disjointes ; **double bordure** + trait plein + pastille **≡** pour les classes équivalentes (la mise en page les rapproche).
Dans le panneau d'une propriété objet ou de donnée : **Équivalente à** (`owl:equivalentProperty`, même genre uniquement), repérée par **≡** après le nom (ou pastille **≡** en mode compact).
Les relations sont symétriques (déclarées une fois par paire dans le Turtle) ; l'import lit aussi `owl:AllDisjointClasses`. En mode RDFS elles sont masquées et non exportées.
« Vérifier l'ontologie » signale les classes insatisfiables (disjointe d'un ancêtre, ou héritant de deux classes disjointes).

### Restrictions OWL (mode OWL)

Section **Restrictions** du panneau d'une classe : une ligne par restriction (`rdfs:subClassOf [ a owl:Restriction … ]`, condition nécessaire) — type (**∃** some, **∀** only, **≥** min, **≤** max, **=** exactly), nombre pour les cardinalités,
propriété (objet ou donnée) et classe ou type visé (vide = `owl:Thing` / `rdfs:Literal`, cardinalité non qualifiée). Les restrictions des super-classes sont listées en gris, avec un lien vers leur classe.
Sur le graphe : une **flèche en tirets** de la classe vers la classe visée, avec une pastille (« ∃ possède », « ≥2 possède »…) ; une restriction sans classe visée (propriété de donnée, cardinalité non qualifiée) ne se lit que dans le panneau et l'infobulle.
L'import reprend some / only / cardinalités (qualifiées ou non) ; `hasValue`, les propriétés ou classes inconnues et les classes définies par équivalence sont signalés. « Vérifier l'ontologie » repère les bornes contradictoires
(au moins 3 et au plus 1…). Masquées et non exportées en mode RDFS.

### Version

Le numéro de version est affiché à côté du copyright et dans l'en-tête des fichiers Turtle exportés ; l'historique est dans [`CHANGELOG.md`](CHANGELOG.md).

### Étiquettes, commentaires, métadonnées, vérification

- **Étiquettes et commentaires** (panneau d'une classe ou d'une propriété) : plusieurs `rdfs:label` / `rdfs:comment`, chacun avec sa langue (fr, en…, vide = sans langue).
  Le **nom** reste le nom local de l'IRI ; l'étiquette (de préférence en français) est ce qui s'affiche sur le graphe, le nom étant rappelé dans l'infobulle.
  Écrits dans le Turtle (RDFS comme OWL) et relus à l'import.
- **⋯ › Ontologie…** : IRI de l'ontologie (par défaut l'espace de noms sans « # »), titre, description (avec leur langue), auteur(s), puis, en mode OWL, version
  (`owl:versionInfo`) et `owl:imports`. Exportés en `dcterms:*` ; relus à l'import (propriétés `dc:` et `rdfs:label` comprises). Annuler/rétablir les couvre.
- **⋯ › Vérifier l'ontologie…** : liste de points à corriger (⚠) et de suggestions (ℹ), cliquables : propriété incomplète, fonctionnelle + transitive, symétrique ou transitive
  entre classes sans rapport, inverse non croisée ou non réciproque, domaine/portée plus large que celui de la propriété parente, noms très proches (casse, accents),
  classe isolée, conventions de majuscule/minuscule, ontologie sans titre.

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
