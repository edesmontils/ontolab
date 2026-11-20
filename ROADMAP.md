# ROADMAP — fonctions à implanter plus tard

Liste des évolutions envisagées pour OntoLab. **Rien de ce qui suit n'est implanté** : ce sont
des idées retenues pour plus tard (cf. `AGENTS.md` : ne pas élargir le périmètre sans demande
explicite). Chaque fiche donne l'intérêt, l'impact sur le code et un ordre de grandeur de l'effort
(S = quelques heures, M = une journée, L = plusieurs jours).

> Origine : comparaison avec l'éditeur de **WebVOWL** (« WebVOWL Editor », cf. Fraunhofer, 2018)
> et besoins d'un outil de TD. La liste des fonctions réelles de l'éditeur de WebVOWL n'a pas été
> vérifiée en détail (documentation introuvable) : à compléter après essai de l'outil.

Ordre conseillé : A → B → C → D → E → F (les phases A et B facilitent tout le reste ; l'historique annuler/rétablir existe déjà). La phase G (modes d'affichage) est indépendante et peut s'intercaler quand on le souhaite.

---

## Phase A — Confort d'édition (fondations)

> Déjà réalisés (v1.x) : **A1** annuler/rétablir, **A2** panneau et légende repliables, **A3** export image
> SVG/PNG — voir `README.md` et `AGENTS.md`. Restent A4 et A5 (A6 fait).

### A4. Caractéristiques OWL supplémentaires — S
- *Fait* : `owl:InverseFunctionalProperty` (propriétés objet : case à cocher, bordure en points, Turtle, import).
- *Reste* : `AsymmetricProperty`, `ReflexiveProperty`, `IrreflexiveProperty` pour les propriétés objet ;
  `owl:FunctionalProperty` pour les propriétés de donnée.
- **Impact** : même chemin que pour la fonctionnelle inverse — cases à cocher dans le panneau et dans
  `createObjProp`, `toTTL`, `ontologyFromTriples` (qui les signale aujourd'hui comme « non représentables »),
  `dashOf()`. Pas de symbole VOWL standard : mention dans l'infobulle ou petit badge (la bordure n'a plus de style libre).

### A5. Vérification de cohérence (« Vérifier ») — M
- **Pourquoi** : pédagogique — repérer les défauts d'une ontologie d'étudiant.
- **Exemples** : classe sans propriété ni sous-classe, propriété dont le domaine est une sous-classe
  de la portée de son inverse, `owl:inverseOf` incohérent (domaine/portée non croisés), propriété
  fonctionnelle et transitive, noms proches (casse, accents), sous-propriété dont le domaine/la portée
  n'est pas contenu(e) dans celui/celle du parent.
- **Comment** : liste d'avertissements cliquables (sélectionne l'élément concerné).

### A6. Domaine et portée hérités de la propriété parente — S/M — **fait** (2026-11-20) ; voir README et AGENTS « Domaine / portée hérités (A6) »
- **Demande (2026-11-20, « à noter »)** : quand une propriété hérite d'une autre (`rdfs:subPropertyOf`) et **ne surcharge pas** son
  domaine et/ou sa portée, l'**affichage** prend ceux de la propriété parente. (Propriétés objet : domaine et portée ; propriétés de
  donnée : domaine, et type XSD si on étend la règle.)
- **Pourquoi** : c'est la sémantique de RDFS (une sous-propriété a au moins les domaines/portées de sa parente) et cela évite de
  ressaisir à chaque fille ce que la mère dit déjà.
- **Impact** : aujourd'hui `domain` et `range` sont **toujours** renseignés (obligatoires à la création, `sanitizeState` les répare,
  l'import met « Thing » en l'absence). Il faut donc **permettre « non défini = hérité »** (`null`) : sélecteur du panneau avec une
  entrée « — hérité de la propriété parente (X) » ; création sans domaine/portée possible ; une fonction `effDomain(p)` /
  `effRange(p)` (remonte les parents) utilisée par `computeProps`, `drawObjArcs`, le panneau, les candidats d'inverse, la légende.
- **Décisions prises (2026-11-20)** :
  1. **Plusieurs parents en désaccord : conflit signalé.** Si les parents n'ont pas le même domaine (ou la même portée), aucune valeur
     n'est choisie : le panneau affiche « conflit : Employé / Étudiant — à préciser » et l'élève doit surcharger. Si les parents sont
     d'accord (même valeur), elle est héritée normalement. Un domaine en conflit compte comme **non défini** pour le dessin (pas de
     flèche tant qu'il n'est pas précisé) et alimente la liste « éléments à compléter » prévue en G2 (d).
  2. **Export Turtle : hérités omis.** On n'écrit `rdfs:domain` / `rdfs:range` que s'ils sont **surchargés** : fidèle au modèle, aller-retour
     exact, `rdfs:subPropertyOf` suffit à porter l'héritage. Cohérent avec le mode RDFS pur (G1). Contrepartie assumée : un outil qui ne
     raisonne pas ne voit pas le domaine de la fille ; un réexport « valeurs effectives » pourra être ajouté en option si le besoin
     apparaît.
  3. **Import** : une propriété sans domaine (ou sans portée) dont une parente présente dans le fichier en a un reçoit « **hérité** » (vide dans
     le modèle) au lieu de « Thing ». Si aucune parente n'en a, on garde « Thing » comme aujourd'hui.
  4. **Cohérence : avertissement non bloquant.** Quand le domaine/la portée surchargé(e) n'est pas une sous-classe de celui/celle de la
     parente, une indication discrète dans le panneau (« devrait être une sous-classe de X, domaine de la parente ») ; aucune restriction
     du sélecteur. Reprise ensuite par la vérification A5.
- **Choix par défaut non discutés (à confirmer à l'implantation)** : une parente elle-même sans domaine fait remonter la recherche plus haut,
  puis « Thing » comme aujourd'hui ; l'héritage s'applique aux propriétés objet (domaine et portée) et aux propriétés de donnée (domaine ;
  le type XSD reste propre à chaque propriété, ce qui est à reconfirmer) ; le champ vide reste invisible dans le JSON existant (les anciens
  fichiers, entièrement renseignés, se chargent sans changement).
- **Affichage à prévoir** : montrer l'origine de la valeur héritée (texte gris « hérité de X » dans le panneau, flèche de même style
  que les autres ou légèrement atténuée sur le graphe).

---

## Phase B — Annotations et métadonnées

### B1. Étiquettes, commentaires et nom local d'IRI éditables — M
- *Fait* : l'**espace de noms** par élément (champ `ns`, éditeur d'espaces de noms avec préfixes et espaces
  courants, sélecteur du panneau, Turtle, import). *Reste* : étiquette,
  commentaire et nom local d'IRI distincts du nom affiché.
- **Pourquoi** : aujourd'hui le nom est à la fois affichage et nom local d'IRI ; impossible d'écrire
  « Étudiant·e » tout en gardant l'IRI `…#Etudiant` d'une ontologie importée. L'import ignore déjà `rdfs:label` /
  `rdfs:comment` (« annotations non conservées »).
- **Modèle** : champs optionnels `label` (avec langue ?), `comment`, `local` (nom local d'IRI imposé) sur
  classes et propriétés. `name` reste la clé d'affichage tant qu'aucun `label` n'est fourni.
- **Impact** : `nameTaken()` / `localName()` (unicité sur le nom local effectif), panneau, `toTTL`
  (`rdfs:label "…"@fr`, `rdfs:comment`), `ontologyFromTriples` (conserver au lieu d'ignorer),
  infobulles. Décider : plusieurs langues par étiquette ou une seule.

### B2. Métadonnées de l'ontologie — S
- IRI de l'ontologie (aujourd'hui dérivée de `ns`), titre, description, version, auteur
  (`dc:`/`dcterms:`), `owl:imports`. Fenêtre « Ontologie » ; export `toTTL`.

---

## Phase C — Axiomes de classes et de propriétés

### C1. Disjonction de classes (`owl:disjointWith`) — M
- Relation symétrique entre deux classes, plusieurs possibles ; éventuellement `owl:AllDisjointClasses`.
- **VOWL** : classes disjointes reliées par un petit cercle « disjoint » en pointillés.
- **Modèle** : `disjoint: [ids]` sur chaque classe, tenu symétrique (comme `inverseOf`). Pastilles
  dans le panneau, nouveau mode ou geste (maj+glisser ?), cohérence avec l'héritage (une classe ne peut
  pas être disjointe de son ancêtre : le signaler).

### C2. Équivalence de classes / de propriétés (`owl:equivalentClass`, `equivalentProperty`) — M
- **VOWL** : classes équivalentes fusionnées visuellement (double bordure).
- **Modèle** : `equivalent: [ids]`, symétrique. Import/export. La mise en page doit les garder proches.

### C3. Domaines et portées multiples, unions — L
- **Aujourd'hui** : un seul domaine et une seule portée par propriété ; les autres sont ignorés à
  l'import avec un message.
- **Cible** : plusieurs valeurs (intersection RDFS) ou `owl:unionOf` (classe anonyme).
- **Dépend de** : C5 (classes anonymes), car un domaine peut être une expression.

### C4. Restrictions et cardinalités — L
- `someValuesFrom`, `allValuesFrom`, `hasValue`, `minCardinality` / `maxCardinality` /
  `cardinality` (et les versions qualifiées) comme super-classe anonyme.
- **Modèle** : `restrictions: [{prop, kind, filler|value, n}]` sur la classe ; panneau « Restrictions ».
  Rendu : étiquette sur l'arête de la propriété (« ∃ », « ∀ », « ≥ 1 »…) ou nœud de restriction.
- **Turtle** : `rdfs:subClassOf [ a owl:Restriction ; owl:onProperty … ; owl:someValuesFrom … ]`,
  sans oublier la lecture à l'import (les blank nodes sont déjà parsés, cf. `parseTurtle`).
- **Pédagogie** : c'est ce qui fait la puissance d'OWL face à RDFS — à privilégier pour le cours.

### C5. Classes anonymes : `unionOf`, `intersectionOf`, `complementOf`, `oneOf` — L
- Expressions de classes imbriquées ; nécessite un petit éditeur d'expressions et un rendu VOWL
  (nœuds « union », « intersection » reliés à leurs opérandes).
- **Impact** : le modèle `parents` / `domain` / `range` devra accepter une expression au lieu d'un
  simple identifiant ; `cleanParents`, `isAncestor`, la mise en page et l'import à reprendre.

---

## Phase D — Individus

### D1. Individus nommés (`owl:NamedIndividual`) — L
- **Contenu** : nom, classe(s) d'appartenance (`rdf:type`), assertions de propriétés
  (objet → autre individu ; donnée → valeur littérale typée), `owl:sameAs` / `differentFrom` (option).
- **UI** : nouveau mode « ⑤ Individu » (clic sur une classe pour en créer un), petits nœuds
  (losanges ?) reliés à leur classe ; panneau d'édition des valeurs ; option pour les masquer (graphe
  de schéma seul ↔ avec instances).
- **Données** : `individuals[]` dans `state` → changer la clé `ontolab-v1` ? (non : champ ajouté
  facultatif, sans migration ; `sanitizeState` à étendre). Import des individus aujourd'hui compté
  et ignoré.
- **Pourquoi** : permet de tester l'ontologie sur des exemples et de produire des données RDF
  chargeables dans Jena pour les TD SPARQL.

---

## Phase E — Interopérabilité

### E1. Export VOWL JSON (lecture dans WebVOWL sans Java 8) — M
- **Pourquoi** : `owl2vowl.jar` ne tourne que sous Java 8 (cf. README). OntoLab connaît déjà classes,
  propriétés et caractéristiques : le JSON de WebVOWL (`header`, `namespace`, `class`, `classAttribute`,
  `property`, `propertyAttribute`) peut être produit directement.
- **À faire** : lire le format réel depuis `owl2vowl` / WebVOWL (ne pas le reconstituer de mémoire),
  tester le chargement dans <https://vowl.visualdataweb.org/webvowl.html>.
- **Bonus** : bouton « Ouvrir dans WebVOWL » (téléchargement du JSON + lien).

### E2. Import : fusion et RDF/XML — M
- **Fusion** avec l'ontologie courante (aujourd'hui : remplacement uniquement) : résolution des
  conflits de noms, option « ajouter / ignorer / renommer ».
- **RDF/XML** : lecture via `DOMParser` (disponible dans le navigateur, sans dépendance) pour les
  fichiers de Protégé non convertis ; rdf:Description, rdf:resource, rdf:parseType="Collection".
- **JSON-LD / N-Triples** : N-Triples est trivial à partir de l'analyseur Turtle (sous-ensemble).

### E3. Import de gros fichiers — S/M
- Non testé au-delà de quelques dizaines de classes. Prévoir : indicateur d'avancement, découpage de
  l'analyse (éviter de bloquer l'interface), seuil d'alerte, repli des sous-arbres (cf. F2),
  option « ne charger que les N premiers niveaux ».

---

## Phase F — Navigation, qualité, projets

### F1. Mise en page : améliorations — M
- Rapprocher une **sous-propriété de sa propriété parente** (aujourd'hui seulement une marge minimale
  de 58 px, `SUBGAP` dans `relax()`).
- **Épingler** un nœud (verrouiller sa position) sans passer par le mode ④ ; relancer la mise en page
  en conservant les épingles.
- Variante **hiérarchique stricte** (arbre haut → bas) en plus des forces.
- Réduire les croisements étiquette/arête (les étiquettes évitent déjà les classes et les arêtes
  déjà tracées).

### F2. Navigation dans les grandes ontologies — M
- **Recherche** par nom (zoom et mise en évidence), **filtres** (masquer propriétés de donnée / objet),
  **repli** de sous-arbres, **mini-carte**, zoom sur la sélection.

### F3. Sélection multiple et copier/coller — M
- Rectangle de sélection, suppression groupée, déplacement groupé en mode ④, duplication d'un
  motif (classe + ses propriétés).

### F4. Plusieurs ontologies / projets locaux — M
- Aujourd'hui une seule ontologie dans `localStorage` (`ontolab-v1`). Liste de projets nommés,
  duplication, export/import de l'ensemble, historique des sauvegardes automatiques.

### F5. Tests automatisés — S/M
- Le code est dans un seul `index.html` : extraire le `<script>` (comme la vérification de syntaxe
  actuelle de `AGENTS.md`) et le charger dans Node avec un faux DOM minimal, ou tester les fonctions
  pures (`parseTurtle`, `ontologyFromTriples`, `toTTL`, `cleanParents`, `localName`).
- **Tests à écrire en priorité** : export → import → export identique (déjà vérifié à la main),
  comptage de triplets contre rdflib/Jena, migration `parent` → `parents`, refus des cycles.
- Un script `deploy.sh` qui lance les tests avant de pousser.

### F6. Accessibilité et internationalisation — M
- Navigation au clavier (Tab entre les éléments, flèches pour les déplacer), rôles ARIA, contrastes
  (rouge / vert / bleu sur fond clair), taille des cibles tactiles.
- Interface en français uniquement aujourd'hui : externaliser les chaînes si une version anglaise
  est souhaitée.

---

## Phase G — Modes d'affichage et préférences

Demande de l'enseignant : un petit **panneau de préférences** (menu ⋯ › « Préférences… ») pour choisir des modes. Deux
réglages **indépendants** (RDFS/OWL × normal/compact, pas un « niveau » unique : on peut vouloir du compact en OWL ou du
normal en RDFS). Analyse faite le 2026-11-20 ; rien n'est implanté.

**Panneau de préférences (socle commun à G1 et G2)** — *fait pour le mode RDFS/OWL* : dialogue ⋯ › Préférences…, enregistrement,
`ONTOLAB_DEFAULTS` (mode, lock) et lien `?mode=`. Écart avec ce qui est écrit ci-dessous : l'entrée « Panneau d'édition » (✓) du menu ⋯ et la
pastille de légende n'ont **pas** été déplacées dans le dialogue (accès rapide conservé) ; le réglage « compact » reste à ajouter (G2). Priorité
retenue : réglage imposé > lien > choix enregistré > défaut.
- Une entrée « Préférences… » dans ⋯, ouvrant une boîte de dialogue du style de l'éditeur d'espaces de noms. On y **déplace**
  (sans dupliquer) ce qui est aujourd'hui dispersé : panneau d'édition (✓ dans ⋯), légende.
- **Persistance** dans `ontolab-ui` (préférences d'affichage), **hors** de l'état de l'ontologie et donc hors historique
  annuler/rétablir : une préférence n'est pas une édition. Locale à chaque navigateur (rien côté serveur).
- **Pilotage par l'enseignant**, comme le catalogue d'espaces de noms : `window.ONTOLAB_DEFAULTS={mode:'rdfs', compact:true, lock:false}`
  dans `namespaces.js` pour fixer les modes de départ ; `lock` (facultatif) empêche l'étudiant de les changer, pour cadrer un TD.
- **Paramètres d'URL** `?mode=rdfs&compact=1` : un lien par séance, sans rien éditer (pratique sur iPad). Priorité à décider
  (URL > préférence enregistrée > défauts de `namespaces.js` ?).

### G1. Mode RDFS / OWL — S/M — **fait** (2026-11-20) ; voir README « Préférences » et AGENTS « Préférences et mode OWL / RDFS »
- **Pourquoi** : introduire RDFS seul (classes, sous-classes, domaine/portée, sous-propriétés), puis débloquer OWL à la séance
  suivante. Aujourd'hui l'étudiant voit tout d'un coup.
- **Ce que le mode RDFS masquerait** : transitive, symétrique, fonctionnelle, fonctionnelle inverse, propriété inverse
  (`owl:inverseOf`), et les futures caractéristiques de A4 ; les entrées correspondantes de la légende (boucle verte, doubles
  flèches, bordure pointillée, ⇄). L'héritage multiple reste (légitime en RDFS). Points d'impact : `renderPanelBody` (cases
  à cocher et menu « Propriété inverse »), le dialogue de création de propriété objet (`createObjProp`), la légende et son
  export image.
- **Question de conception centrale : que devient la donnée déjà présente ?** Masquer seulement est piégeant : on charge une
  ontologie OWL, on passe en RDFS, on exporte, et le Turtle contient encore du `owl:TransitiveProperty` qu'on ne voit plus.
  Recommandation : **masquer et le dire** (indicateur discret « N caractéristiques OWL masquées » quand il y en a), l'export
  restant complet par défaut, avec une option explicite « exporter en RDFS pur » (`rdfs:Class`, `rdf:Property`,
  `rdfs:domain`/`rdfs:range`, sans `owl:*`) si on la veut. L'**import ne dépend jamais du mode**.
- **Décisions prises (2026-11-20)** :
  1. **Export filtré selon le mode** (et non « complet + option ») : en mode RDFS, le Turtle est du **RDFS pur**, sans choix.
     Conséquence assumée : les caractéristiques OWL déjà dans le modèle (transitive, symétrique, fonctionnelle, fonctionnelle
     inverse, inverse…) **restent dans le modèle** (JSON, historique) mais **ne sont pas écrites** dans le Turtle ; repasser en OWL
     les retrouve. La fenêtre d'export doit le dire (« N caractéristiques OWL omises : mode RDFS »).
  2. **Vocabulaire RDFS pur** : `rdfs:Class` et `rdf:Property` (pas de `owl:Ontology`, ni `owl:Class`, `owl:ObjectProperty`,
     `owl:DatatypeProperty`, ni `owl:*` de caractéristique ; `rdfs:subClassOf`, `rdfs:subPropertyOf`, `rdfs:domain`, `rdfs:range`
     conservés). RDFS ne distinguant pas propriété objet et de donnée, la distinction **se déduit de la portée** : un type `xsd:`
     = propriété de donnée, une classe = propriété objet, **absence de portée = propriété objet** (à documenter).
     → **Import à compléter** : lire `rdfs:Class` / `rdf:Property` et classer par la portée (l'import lit aujourd'hui surtout les
     types `owl:`) ; l'import ne dépend pas du mode et doit lire aussi bien les deux vocabulaires.
  3. **« Charger l'exemple » filtré selon le mode** : en mode RDFS, les caractéristiques OWL sont retirées **au chargement** (le
     modèle ne les contient pas, repasser en OWL ne les ramène pas) ; pas de second exemple à maintenir.
  4. **Indicateur des caractéristiques masquées** : dans le **panneau de l'élément** seulement (ligne discrète « caractéristiques
     OWL masquées : transitive, fonctionnelle », uniquement quand il y en a) ; pas de total dans la ligne d'état.
- **Points qui en découlent, à régler à l'implantation** : l'export image reflète l'écran (donc le mode) ; le format JSON reste
  complet et indépendant du mode ; le nom de fichier ou l'en-tête Turtle peut mentionner « RDFS » ; aller-retour à tester
  (export RDFS pur → import → export identique, objet/donnée correctement reclassés).
- **Risque** : faible pour le graphe (conditions d'affichage), plus délicat pour l'export (perte d'information silencieuse).

### G2. Mode compact — L (M pour les propriétés de donnée seules, en première livraison)
- **Pourquoi** : les nœuds de propriétés de donnée encombrent le plus le graphe (VOWL les dessine comme des nœuds distincts).
  Les ranger dans le panneau de la classe rapproche l'outil d'un diagramme de classes (« une classe a des attributs »).
- **Nature du changement** : un choix d'**affichage** — le modèle de données (`dataProps`, JSON, Turtle, import, historique) ne
  change pas. C'est l'argument fort pour le faire.
- **Décisions prises (2026-11-20)** :
  1. **Sur le nœud d'une classe** : un **compteur discret** (« +3 ») des propriétés de donnée, cliquable pour ouvrir ses attributs ;
     ne change ni la taille des nœuds ni le placement. Les noms ne se lisent que dans le panneau.
  2. **Création d'une propriété de donnée : les deux.** Le mode « Propriété de donnée » de la barre latérale est conservé (un clic
     sur une classe y ajoute un attribut, sans nœud) **et** un bouton « + attribut » dans le panneau de la classe (découvrabilité,
     iPad).
  3. **Édition dans le panneau de la classe** : une ligne par attribut, **nom et type XSD modifiables sur place**, suppression avec
     confirmation, et un lien **« Détails »** qui ouvre le panneau complet (domaine, propriétés parentes).
  4. **Étendue : propriétés de donnée ET propriétés objet** (flèche étiquetée entre classes au lieu de l'ellipse). C'est l'option
     ambitieuse (effort **L**) : voir les questions ouvertes ci-dessous. Recommandation de réalisation : **deux livraisons**
     (d'abord les propriétés de donnée, puis les propriétés objet), le panneau de préférences ayant **une case par famille**
     (donnée / objet) pour pouvoir les activer séparément.
- **Décisions prises (suite, 2026-11-20)** — les six questions soulevées par la décision 4 :
  a. **Symboles d'une flèche** : le **style du trait** garde le sens des bordures actuelles (fonctionnelle = tirets, fonctionnelle
     inverse = points) ; transitive, symétrique et paire d'inverses sont de **petites pastilles lettrées** (T, S, ⇄) sur
     l'étiquette, avec infobulle ; la légende les explique. En mode RDFS, aucune de ces marques (cf. G1).
  b. **Sous-propriétés** : **pas d'arc** en compact. Un petit rappel dans l'étiquette (de la forme « ⊆ parent ») et le
     **panneau** liste parents et enfants. La hiérarchie de propriétés ne se voit donc plus d'un coup d'œil sur le graphe :
     assumé.
  c. **Propriétés parallèles et boucles** : des **courbes légèrement décalées** entre les mêmes deux classes (une par propriété,
     étiquette au milieu) ; une propriété dont domaine = portée est une **boucle sur la classe**, plusieurs boucles se répartissant
     autour. Le placement des étiquettes est du code nouveau (le moteur actuel gère des ellipses autour d'une classe, pas des
     flèches parallèles).
  d. **Propriété objet sans domaine ou sans portée** : **les deux** — une **flèche courte vers un point libre**, avec « ? » à
     l'extrémité manquante, quand une extrémité existe ; et une **liste dans le panneau d'accueil** (sans sélection) des
     propriétés incomplètes, cliquables, pour celles qui n'ont aucune extrémité.
  e. **Attributs hérités et sans domaine** : le panneau d'une classe montre ses attributs propres, puis une section « hérités de X »
     en **gris** (non modifiables ici ; cliquer mène à la classe d'origine). Les **propriétés de donnée sans domaine** sont
     listées dans le **panneau d'accueil**, avec les propriétés objet incomplètes de (d) : une seule liste « éléments à compléter ».
  f. **Au doigt** : **zone de toucher élargie** (≈ 22 px en tactile, comme pour les autres nœuds) autour du trait **et** de
     l'étiquette, l'étiquette étant la cible principale ; tap et double-tap comme ailleurs (sélection, puis panneau).
- **Autres points** : l'export image reflète le mode courant (à signaler dans le dialogue) ; la légende s'adapte au mode (flèche
  au lieu de l'ellipse, compteur, pastilles T / S / ⇄, trait en tirets / en points) ; interaction avec G1 (mode RDFS : pas de symboles OWL à dessiner).
- **Tests à prévoir** : disposition du graphe après disparition des nœuds (point faible de toutes les évolutions de mise en page),
  bascule de mode sur une ontologie riche sans perte, aller-retour export/import dans chaque mode, double-clic / sélection /
  annuler en mode compact, ontologies avec boucles et propriétés parallèles, iPad.

**Toutes les questions de G1 et G2 sont tranchées** : G1 et G2 sont prêts à être implantés. **Ordre conseillé** : panneau de préférences + G1 d'abord (rapide, utile tout de suite), puis G2 limité aux propriétés de donnée ;
réserver le compactage des propriétés objet à une troisième étape, après essai en conditions réelles. Trancher les points « À trancher »
de G1 et les décisions 1 à 4 de G2 **avant** de coder.

---

## Dette connue et points à vérifier

- **iPad réel** : l'import de fichiers (champs `<input file>` permanents, sans `accept`) et le
  téléchargement du `.ttl` ont été corrigés d'après les comportements connus de Safari iOS, mais pas
  testés sur un appareil. À confirmer.
- **Gros schémas** : mise en page testée jusqu'à 60 classes (~250 ms) ; au-delà, vérifier les
  performances (simulation à forces O(n²) × 4 départs).
- **Partage d'image sur iPad** : `navigator.share({files})` (feuille de partage) est utilisé sur écran tactile, mais n'a
  pas été testé sur un appareil réel ; repli : téléchargement classique.
- **Historique** : non conservé au rechargement de la page.
- **Étiquettes** : avec beaucoup de propriétés de donnée sur une même classe, une légende de type
  peut être partiellement masquée par une flèche voisine.
- **Une seule valeur de domaine/portée** par propriété ; **types XSD** limités à la liste de
  `XSD` (les autres sont ramenés au plus proche à l'import).
- **Noms** : unicité testée sur le nom local d'IRI (`localName()`), les noms de classes et de
  propriétés partagent le même espace (cf. `nameTaken()`).
- **Clé de sauvegarde** : `ontolab-v1` conservée ; l'héritage multiple migre l'ancien champ `parent`
  dans `sanitizeState` (`cleanParents`). Pour un changement de schéma plus profond (individus,
  expressions de classes), envisager `ontolab-v2` avec migration explicite.
