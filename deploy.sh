#!/usr/bin/env bash
# Déploie OntoLab sur le Pi : pousse main vers GitHub, puis git pull sur le Pi.
# Caddy sert directement le clone (https://pedago.desmontils.net/ontolab/),
# aucun rechargement n'est nécessaire.
#
# Cibles (variable TARGETS, « hôte:dossier » séparés par des espaces ; défaut : le Pi et le serveur « sql ») :
#   ed@192.168.1.200:programmation/OntoLab   (Caddy sert le clone sur https://pedago.desmontils.net/ontolab/ ; réseau local)
#   root@172.26.70.140:/srv/ontolab          (https://asql.ls2n.fr/ontolab/, route /ontolab/ du Caddy partagé ; le clone y utilise le proxy http://cache.ha.univ-nantes.fr:3128)
#   SKIP_TESTS=1  déploie sans lancer les tests automatisés (./test.sh)
set -euo pipefail

TARGETS="${TARGETS:-ed@192.168.1.200:programmation/OntoLab root@172.26.70.140:/srv/ontolab}"
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

# Chaque cible : « hôte:dossier » ; une cible injoignable n'empêche pas de mettre à jour les autres (le code est déjà sur GitHub).
fail=0
for t in $TARGETS; do
  host="${t%%:*}"; dir="${t#*:}"
  echo "→ $host ($dir)"
  if ssh -o BatchMode=yes -o ConnectTimeout=10 "$host" "git -C $dir pull --ff-only && git -C $dir log --oneline -1"; then :; else echo "  ÉCHEC : $host injoignable ou mise à jour refusée." >&2; fail=1; fi
done
if [ "$fail" = 0 ]; then echo "Déployé : https://pedago.desmontils.net/ontolab/ (Pi) et https://asql.ls2n.fr/ontolab/ (serveur 172.26.70.140)"; else echo "Déploiement incomplet : relancez ./deploy.sh depuis un réseau qui joint la cible en échec." >&2; exit 1; fi
