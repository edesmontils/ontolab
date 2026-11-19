# ROADMAP — fonctions à implanter plus tard

Liste des évolutions envisagées pour OntoLab. **Rien de ce qui suit n'est implanté** : ce sont
des idées retenues pour plus tard (cf. `AGENTS.md` : ne pas élargir le périmètre sans demande
explicite). Chaque fiche donne l'intérêt, l'impact sur le code et un ordre de grandeur de l'effort
(S = quelques heures, M = une journée, L = plusieurs jours).

> Origine : comparaison avec l'éditeur de **WebVOWL** (« WebVOWL Editor », cf. Fraunhofer, 2018)
> et besoins d'un outil de TD. La liste des fonctions réelles de l'éditeur de WebVOWL n'a pas été
> vérifiée en détail (documentation introuvable) : à compléter après essai de l'outil.

Ordre conseillé : A → B → C → D → E → F (les phases A et B facilitent tout le reste ; l'historique annuler/rétablir existe déjà).

---

## Phase A — Confort d'édition (fondations)

> Déjà réalisés (v1.x) : **A1** annuler/rétablir, **A2** panneau et légende repliables, **A3** export image
> SVG/PNG — voir `README.md` et `AGENTS.md`. Restent A4 et A5.

### A4. Caractéristiques OWL supplémentaires — S
- `owl:InverseFunctionalProperty`, `AsymmetricProperty`, `ReflexiveProperty`, `IrreflexiveProperty`
  pour les propriétés objet ; `owl:FunctionalProperty` pour les propriétés de donnée.
- **Impact** : cases à cocher dans le panneau et dans `createObjProp`, `toTTL`, `ontologyFromTriples`
  (qui les signale aujourd'hui comme « non représentables »). Pas de symbole VOWL standard pour
  toutes : prévoir un petit badge ou une mention dans l'infobulle.

### A5. Vérification de cohérence (« Vérifier ») — M
- **Pourquoi** : pédagogique — repérer les défauts d'une ontologie d'étudiant.
- **Exemples** : classe sans propriété ni sous-classe, propriété dont le domaine est une sous-classe
  de la portée de son inverse, `owl:inverseOf` incohérent (domaine/portée non croisés), propriété
  fonctionnelle et transitive, noms proches (casse, accents), sous-propriété dont le domaine/la portée
  n'est pas contenu(e) dans celui/celle du parent.
- **Comment** : liste d'avertissements cliquables (sélectionne l'élément concerné).

---

## Phase B — Annotations et métadonnées

### B1. Étiquettes, commentaires et IRI éditables — M
- **Pourquoi** : aujourd'hui le nom est à la fois affichage et nom local d'IRI ; impossible d'écrire
  « Étudiant·e » ou de garder l'IRI d'une ontologie importée. L'import ignore déjà `rdfs:label` /
  `rdfs:comment` (« annotations non conservées »).
- **Modèle** : champs optionnels `label` (avec langue ?), `comment`, `iri` (nom local imposé) sur
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

## Dette connue et points à vérifier

- **iPad réel** : l'import de fichiers (champs `<input file>` permanents, sans `accept`) et le
  téléchargement du `.ttl` ont été corrigés d'après les comportements connus de Safari iOS, mais pas
  testés sur un appareil. À confirmer.
- **Gros schémas** : mise en page testée jusqu'à 60 classes (~250 ms) ; au-delà, vérifier les
  performances (simulation à forces O(n²) × 4 départs).
- **Partage d'image sur iPad** : `navigator.share({files})` (feuille de partage) est utilisé sur écran tactile, mais n'a
  pas été testé sur un appareil réel ; repli : téléchargement classique.
- **Historique** : non conservé au rechargement de la page ; `ns` (namespace) n'en fait pas partie.
- **Étiquettes** : avec beaucoup de propriétés de donnée sur une même classe, une légende de type
  peut être partiellement masquée par une flèche voisine.
- **Une seule valeur de domaine/portée** par propriété ; **types XSD** limités à la liste de
  `XSD` (les autres sont ramenés au plus proche à l'import).
- **Noms** : unicité testée sur le nom local d'IRI (`localName()`), les noms de classes et de
  propriétés partagent le même espace (cf. `nameTaken()`).
- **Clé de sauvegarde** : `ontolab-v1` conservée ; l'héritage multiple migre l'ancien champ `parent`
  dans `sanitizeState` (`cleanParents`). Pour un changement de schéma plus profond (individus,
  expressions de classes), envisager `ontolab-v2` avec migration explicite.
