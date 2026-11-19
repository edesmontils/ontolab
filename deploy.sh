#!/usr/bin/env bash
# Déploie OntoLab sur le Pi : pousse main vers GitHub, puis git pull sur le Pi.
# Caddy sert directement le clone (https://pedago.desmontils.net/ontolab/),
# aucun rechargement n'est nécessaire.
#
# Variables optionnelles :
#   PI_HOST  (défaut ed@192.168.1.200)
#   PI_DIR   (défaut ~/programmation/OntoLab)
set -euo pipefail

PI_HOST="${PI_HOST:-ed@192.168.1.200}"
PI_DIR="${PI_DIR:-programmation/OntoLab}"
cd "$(dirname "$0")"

if [ -n "$(git status --porcelain)" ]; then
  echo "Des modifications ne sont pas commitées : commitez avant de déployer." >&2
  exit 1
fi

git push origin main
ssh -o BatchMode=yes "$PI_HOST" "git -C $PI_DIR pull --ff-only && git -C $PI_DIR log --oneline -1"
echo "Déployé : https://pedago.desmontils.net/ontolab/"
