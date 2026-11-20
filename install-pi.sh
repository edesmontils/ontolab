#!/usr/bin/env bash
# Met en place (ou vérifie) OntoLab sur le Pi. Idempotent : sans effet si tout est déjà en place.
#   1. le clone git existe (sinon : git clone) ;
#   2. Caddy sert aussi namespaces.js, en plus de / et /index.html (sinon : correction du Caddyfile,
#      sauvegarde datée, validation, rechargement, retour arrière si la configuration est refusée).
# Les mises à jour courantes du code passent par ./deploy.sh ; ce script ne sert qu'à l'installation
# initiale, ou après une modification du Caddyfile.
#
# Usage : ./install-pi.sh [--check]     (--check : affiche l'état sans rien modifier)
# Variables optionnelles : PI_HOST (défaut ed@192.168.1.200), PI_DIR (défaut programmation/OntoLab),
#                          CADDYFILE (défaut /etc/caddy/Caddyfile)
# Prérequis : accès ssh par clé au Pi, et sudo sans mot de passe pour caddy (validate, reload) et le Caddyfile.
set -euo pipefail

PI_HOST="${PI_HOST:-ed@192.168.1.200}"
PI_DIR="${PI_DIR:-programmation/OntoLab}"
CADDYFILE="${CADDYFILE:-/etc/caddy/Caddyfile}"
CHECK=0; [ "${1:-}" = "--check" ] && CHECK=1
cd "$(dirname "$0")"
REPO_URL="$(git remote get-url origin)"

ssh -o BatchMode=yes "$PI_HOST" bash -s -- "$PI_DIR" "$CADDYFILE" "$CHECK" "$REPO_URL" <<'REMOTE'
set -euo pipefail
PI_DIR="$1"; CADDYFILE="$2"; CHECK="$3"; REPO_URL="$4"
say() { printf '  %s\n' "$*"; }

echo "[1/2] Clone git"
if [ -d "$PI_DIR/.git" ]; then
  say "déjà en place : $PI_DIR"
elif [ "$CHECK" = 1 ]; then
  say "MANQUANT : $PI_DIR (sera cloné depuis $REPO_URL)"
else
  mkdir -p "$(dirname "$PI_DIR")"; git clone "$REPO_URL" "$PI_DIR"; say "cloné : $PI_DIR"
fi

echo "[2/2] Caddy : fichiers servis pour /ontolab/"
if ! grep -q 'handle_path /ontolab/\*' "$CADDYFILE"; then
  say "AUCUN bloc /ontolab/ dans $CADDYFILE : à ajouter à la main dans le site concerné, par exemple :"
  cat <<'SNIPPET'

	redir /ontolab /ontolab/ 308
	handle_path /ontolab/* {
		root * /home/ed/programmation/OntoLab
		@page path / /index.html /namespaces.js
		handle @page {
			file_server
		}
		respond 404
	}

SNIPPET
  exit 0
fi
if grep -Eq '@page path .*/namespaces\.js' "$CADDYFILE"; then
  say "déjà en place : /namespaces.js est servi"
  exit 0
fi
if ! grep -Eq '^[[:space:]]*@page path / /index\.html[[:space:]]*$' "$CADDYFILE"; then
  say "ligne « @page path / /index.html » introuvable telle quelle : ajoutez /namespaces.js à la main au matcher @page du bloc /ontolab/."
  exit 1
fi
if [ "$CHECK" = 1 ]; then say "MANQUANT : /namespaces.js n'est pas servi (sera ajouté au matcher @page)"; exit 0; fi

BAK="$CADDYFILE.bak-$(date +%Y%m%d-%H%M%S)"
sudo -n cp -p "$CADDYFILE" "$BAK"
sudo -n sed -i -E 's#^([[:space:]]*@page path / /index\.html)[[:space:]]*$#\1 /namespaces.js#' "$CADDYFILE"
if sudo -n caddy validate --config "$CADDYFILE" >/dev/null 2>&1; then
  sudo -n systemctl reload caddy
  say "Caddyfile modifié et rechargé (sauvegarde : $BAK)"
else
  sudo -n cp -p "$BAK" "$CADDYFILE"
  say "configuration refusée par Caddy : Caddyfile restauré ($BAK). Rien n'a été modifié."
  exit 1
fi
REMOTE

if [ "$CHECK" = 0 ]; then
  echo "Terminé. Déployez le code avec ./deploy.sh puis vérifiez : https://pedago.desmontils.net/ontolab/namespaces.js"
fi
