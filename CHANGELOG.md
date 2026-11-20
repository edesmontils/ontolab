# Journal des versions d'OntoLab

Numéro **MAJEUR.MINEUR.CORRECTIF**, affiché à côté du copyright (constante `VERSION` de `index.html`) et rappelé dans le commentaire d'en-tête du Turtle exporté.
- **MINEUR** : fonction nouvelle ou évolution visible ; **CORRECTIF** : correction de bogue ou ajustement sans nouvelle fonction ; **MAJEUR** : changement incompatible (par exemple nouveau format de sauvegarde).
- À chaque modification de l'application : incrémenter `VERSION` **et** ajouter une entrée ici (en tête). Les commits qui ne touchent que la documentation ou la ROADMAP ne changent pas le numéro.
- Les entrées jusqu'à 1.14.1 ont été attribuées après coup d'après l'historique git (le numéro n'était pas encore affiché).

## 1.18.0 — 2026-11-20
- A4 : propriétés objet asymétrique / réflexive / irréflexive (`owl:AsymmetricProperty`, `ReflexiveProperty`, `IrreflexiveProperty`) et propriété de donnée fonctionnelle (`owl:FunctionalProperty`) :
  cases du panneau et des dialogues de création, export, import, pastilles A / R / I en mode compact, bordure en tirets pour une donnée fonctionnelle, vérification A5 (contradictions, restriction OWL 2 DL). Masqué en mode RDFS.

## 1.17.0 — 2026-11-20
- C4 : restrictions OWL d'une classe (∃ some, ∀ only, ≥ min, ≤ max, = exactly ; cardinalités qualifiées ou non) : section « Restrictions » du panneau (édition sur place, héritées grisées), flèche en tirets + pastille vers la classe visée,
  export `rdfs:subClassOf [ a owl:Restriction … ]`, import (some, only, cardinalités ; le reste est signalé), vérification A5 (bornes contradictoires, doublons). Masquées en mode RDFS.
- Correctif : la mise en page n'était pas recalculée quand on déclarait une équivalence de classes (clé de cache incomplète).

## 1.16.1 — 2026-11-20
- Zoom à la molette : delta normalisé (lignes / pages), pincement du trackpad amplifié, pas maximal par cran ; zoom centré sur le pointeur.

## 1.16.0 — 2026-11-20
- C1 : classes disjointes (`owl:disjointWith`) : listes dans le panneau, trait pointillé + pastille ⊥ sur le graphe, export, import (y compris `owl:AllDisjointClasses`).
- C2 : classes équivalentes (`owl:equivalentClass` : double bordure + trait ≡, rapprochées par la mise en page) et propriétés équivalentes (`owl:equivalentProperty` : pastille ≡), export et import.
- Vérification (A5) : classe insatisfiable (disjointe de son ancêtre ou héritant de deux classes disjointes), équivalentes et disjointes à la fois, équivalente à son ancêtre.
- Mode RDFS : ces éléments sont masqués et non exportés (conservés dans l'ontologie).

## 1.15.0 — 2026-11-20
- Numéro de version affiché à côté du copyright et dans l'en-tête du Turtle exporté ; ce journal.

## 1.14.1 — 2026-11-20
- Correctif : le panneau d'une classe en mode compact ne s'ouvrait plus (deux fonctions supprimées par erreur).

## 1.14.0 — 2026-11-20
- B1 : étiquettes et commentaires (plusieurs par langue), affichés sur le graphe, exportés et importés.
- B2 : métadonnées de l'ontologie (⋯ › Ontologie…) : IRI, titre, description, auteurs, version, `owl:imports`.
- A5 : vérification de cohérence (⋯ › Vérifier l'ontologie…).

## 1.13.0 — 2026-11-20
- G2 (2e livraison) : propriétés objet compactes (flèches à pastille, T/S/⇄, « ⊆ parent », extrémité « ? »).

## 1.12.0 — 2026-11-20
- G2 (1re livraison) : propriétés de donnée compactes (compteur « +N », attributs dans le panneau de la classe).

## 1.11.0 — 2026-11-20
- Disposition : placement initial par couches, repoussement nœud-arête, espacement selon le degré, ancrage des classes sur leur couche.

## 1.10.0 — 2026-11-20
- A6 : domaine et portée hérités de la propriété parente (conflit, export omis, import, avertissement).

## 1.9.0 — 2026-11-20
- Préférences (⋯ › Préférences…) : mode OWL / RDFS, export RDFS pur, défauts et verrou enseignant.

## 1.8.1 — 2026-11-20
- Mention de copyright en bas de page.

## 1.8.0 — 2026-11-20
- Espaces de noms : un par élément, éditeur, catalogue maintenu par l'enseignant (`namespaces.js`), racines d'IRI proposées.

## 1.7.0 — 2026-11-19
- Propriétés objet : `owl:InverseFunctionalProperty`.

## 1.6.0 — 2026-11-19
- Barre d'outils (palette de modes, menus Importer / Exporter / ⋯, contrôles de vue) ; double-clic ou double tap : édition dans le panneau.

## 1.5.0 — 2026-11-19
- Annuler / rétablir, panneau et légende repliables, export image SVG / PNG.

## 1.4.0 — 2026-11-19
- Import Turtle (iPad compris), légende derrière le graphe, clic sur le fond : désélection.

## 1.3.0 — 2026-11-19
- Héritage multiple des classes et des propriétés (`rdfs:subPropertyOf`).

## 1.2.0 — 2026-11-19
- Compatibilité tactile (iPad) : pincement, interface adaptée ; placement des propriétés de donnée et des boucles.

## 1.1.0 — 2026-11-19
- Hiérarchie `subClassOf` en flèche VOWL, ids corrigés, mise en page à forces par composante connexe.

## 1.0.0 — 2026-11-19
- Première version : classes, propriétés objet et de donnée, export Turtle, import robuste.
