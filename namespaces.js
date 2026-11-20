/* OntoLab — catalogue des espaces de noms proposés aux étudiants.
 *
 * Ce fichier est le seul à modifier pour enrichir la liste « Espaces courants » (éditeur ⋯ › Espaces de noms…
 * et sélecteur « Espace de noms » du panneau). Aucun autre changement de code n'est nécessaire.
 *
 * Une entrée = une ligne :
 *   {prefix:'foaf', iri:'http://xmlns.com/foaf/0.1/', label:'FOAF — personnes, relations', group:'Vocabulaires généraux'},
 *   - prefix : préfixe Turtle, lettres/chiffres/_ . - (rdf, rdfs, owl, xsd sont réservés), unique dans la liste ;
 *   - iri    : IRI absolue de l'espace de noms. Elle doit finir par # ou / (sinon # est ajouté) ;
 *   - label  : texte affiché après le préfixe (facultatif, l'IRI par défaut) ;
 *   - group  : titre du groupe dans les listes (facultatif, « Espaces courants » par défaut). Les groupes
 *              s'affichent dans l'ordre de leur première apparition ici.
 *
 * Racine d'IRI pour les ontologies des étudiants : voir ONTOLAB_ROOTS en bas de ce fichier.
 *
 * Vérifier une IRI avant de l'ajouter : https://prefix.cc (donne l'IRI usuelle d'un préfixe).
 * Une entrée invalide est ignorée sans bloquer les autres ; l'éditeur d'espaces de noms indique laquelle.
 * Si ce fichier est absent, illisible ou ne contient aucune entrée valide, OntoLab utilise sa liste intégrée.
 *
 * Mise à jour : éditer, commiter, puis ./deploy.sh. Les navigateurs qui ont mis la page en cache la prennent
 * au rechargement (mise à jour forcée : Maj + recharger).
 */
window.ONTOLAB_NAMESPACES=[
  /* ---- Vocabulaires généraux ---- */
  {prefix:'foaf',    iri:'http://xmlns.com/foaf/0.1/',                 label:'FOAF — personnes, relations',     group:'Vocabulaires généraux'},
  {prefix:'dcterms', iri:'http://purl.org/dc/terms/',                  label:'Dublin Core terms — métadonnées', group:'Vocabulaires généraux'},
  {prefix:'dc',      iri:'http://purl.org/dc/elements/1.1/',           label:'Dublin Core elements',            group:'Vocabulaires généraux'},
  {prefix:'skos',    iri:'http://www.w3.org/2004/02/skos/core#',       label:'SKOS — thésaurus, concepts',      group:'Vocabulaires généraux'},
  {prefix:'schema',  iri:'https://schema.org/',                        label:'schema.org — web, personnes, lieux', group:'Vocabulaires généraux'},
  {prefix:'org',     iri:'http://www.w3.org/ns/org#',                  label:'ORG — organisations',             group:'Vocabulaires généraux'},
  {prefix:'prov',    iri:'http://www.w3.org/ns/prov#',                 label:'PROV-O — provenance',             group:'Vocabulaires généraux'},
  {prefix:'time',    iri:'http://www.w3.org/2006/time#',               label:'OWL-Time — temps',                group:'Vocabulaires généraux'},
  {prefix:'geo',     iri:'http://www.w3.org/2003/01/geo/wgs84_pos#',   label:'WGS84 — coordonnées',             group:'Vocabulaires généraux'},
  {prefix:'vcard',   iri:'http://www.w3.org/2006/vcard/ns#',           label:'vCard — contacts',                group:'Vocabulaires généraux'},
  {prefix:'dcat',    iri:'http://www.w3.org/ns/dcat#',                 label:'DCAT — catalogues de données',    group:'Vocabulaires généraux'},
  {prefix:'sioc',    iri:'http://rdfs.org/sioc/ns#',                   label:'SIOC — communautés en ligne',     group:'Vocabulaires généraux'},
  {prefix:'bibo',    iri:'http://purl.org/ontology/bibo/',             label:'BIBO — bibliographie',            group:'Vocabulaires généraux'},
  {prefix:'sh',      iri:'http://www.w3.org/ns/shacl#',                label:'SHACL — contraintes',             group:'Vocabulaires généraux'},

  /* ---- Bases de connaissances ---- */
  {prefix:'dbo',     iri:'http://dbpedia.org/ontology/',               label:'DBpedia ontology',                group:'Bases de connaissances'},
  {prefix:'dbr',     iri:'http://dbpedia.org/resource/',               label:'DBpedia resources',               group:'Bases de connaissances'},
  {prefix:'wd',      iri:'http://www.wikidata.org/entity/',            label:'Wikidata — entités',              group:'Bases de connaissances'}

  /* ---- Exemple : espaces propres au cours (décommenter / adapter, sans oublier la virgule à la ligne précédente) ----
  ,{prefix:'cours', iri:'http://example.org/cours#', label:'Espace de noms du cours', group:'Cours'}
  */
];

/* ---- Racine(s) d'IRI proposée(s) aux étudiants pour leur propre ontologie ----
 * L'étudiant choisit la racine dans ⋯ › Espaces de noms… et donne un nom à son ontologie : avec la racine ci-dessous,
 * http://www.univ-nantes.fr/ns/mon-onto#  (racine + nom + « # »). La première racine sert aussi d'espace de noms de départ
 * (nom « mon-ontologie ») pour un nouvel utilisateur. L'étudiant peut toujours choisir « Autre » et saisir une IRI libre.
 * Une racine finit par « / » (ajouté si besoin). Plusieurs racines possibles (cours, projets…) ; sans ligne : pas de racine.
 * Forme : une chaîne, ou un tableau de chaînes / de {iri, label}.
 */
window.ONTOLAB_ROOTS=[
  {iri:'http://www.univ-nantes.fr/ns/', label:'Université de Nantes'}
];

/* ---- Préférences de départ (facultatif) ----
 * mode : 'owl' (complet, par défaut) ou 'rdfs' (restreint : éléments OWL masqués, export Turtle en RDFS pur).
 * lock : true = l'étudiant ne peut pas changer le mode (réglage imposé pour un TD) ; il est ignoré si mode est absent.
 * Ordre de priorité : lock > lien ?mode=rdfs (ou ?mode=owl) > choix enregistré par l'utilisateur dans ⋯ › Préférences… > ces défauts.
 * compact.data / compact.obj : true = propriétés de donnée affichées dans le panneau de leur classe (compteur « +N » sur le graphe) plutôt qu'en nœuds ; propriétés objet en flèches étiquetées ; lien ?compact=data,obj (ou ?compact=none).
 *   Même priorité que le mode ; lock:true verrouille aussi ce réglage lorsqu'il est présent.
 * Un lien ?mode=… ne remplace pas durablement le choix enregistré. Exemples de liens : …/ontolab/?mode=rdfs
 */
window.ONTOLAB_DEFAULTS={mode:'owl', compact:{data:false, obj:false}, lock:false};
