#!/usr/bin/env bash
# Déploie OntoLab sur le Pi : pousse main vers GitHub, puis git pull sur le Pi.
# Caddy sert directement le clone (https://pedago.desmontils.net/ontolab/),
# aucun rechargement n'est nécessaire.
#
# Variables optionnelles :
#   PI_HOST  (défaut ed@192.168.1.200)
#   PI_DIR   (défaut ~/programmation/OntoLab)
#   SKIP_TESTS=1  déploie sans lancer les tests automatisés (./test.sh)
set -euo pipefail

PI_HOST="${PI_HOST:-ed@192.168.1.200}"
PI_DIR="${PI_DIR:-programmation/OntoLab}"
cd "$(dirname "$0")"

if [ -n "$(git status --porcelain)" ]; then
  echo "Des modifications ne sont pas commitées : commitez avant de déployer." >&2
  exit 1
fi

if [ "${SKIP_TESTS:-0}" != 1 ]; then
  if command -v node >/dev/null 2>&1; then
    echo "Tests automatisés…"
    ./test.sh || { echo "Les tests échouent : déploiement annulé (SKIP_TESTS=1 pour passer outre)." >&2; exit 1; }
  else
    echo "Node introuvable : tests non lancés." >&2
  fi
fi

git push origin main
ssh -o BatchMode=yes "$PI_HOST" "git -C $PI_DIR pull --ff-only && git -C $PI_DIR log --oneline -1"
echo "Déployé : https://pedago.desmontils.net/ontolab/"
