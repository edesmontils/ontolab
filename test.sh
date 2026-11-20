#!/usr/bin/env bash
# Lance les tests automatisés d'OntoLab (Node >= 20, aucune dépendance) : ./test.sh [fichier.test.js …]
# Jena (riot) est utilisé s'il est trouvé (variable JENA_RIOT, ~/Applications/Jena/…, ou `riot` dans le PATH) ; sinon ce test est ignoré.
set -euo pipefail
cd "$(dirname "$0")"
if [ "$#" -gt 0 ]; then exec node --test "$@"; fi
exec node --test tests/*.test.js
