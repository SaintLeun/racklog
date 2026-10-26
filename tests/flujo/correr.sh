#!/usr/bin/env bash
# Pruebas de la logica del flujo "Planifica tu bodega" (sin navegador): node tests/flujo/correr.sh
set -e
cd "$(dirname "$0")/../.."
for f in tests/flujo/prueba-*.mjs; do
  echo "== $f"
  node "$f" "$PWD" | grep -E "pruebas ok|^ok|conflictos|angostos" | tail -3
done
