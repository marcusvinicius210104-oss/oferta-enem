#!/usr/bin/env bash
# Renderiza os PDFs gratuitos a partir do HTML com o Chrome headless.
#   Diagnóstico Express -> public/downloads (público, amostra gratuita)
#   Kit de Ação do Aluno -> privado/ (brinde: entregue só pela plataforma, nunca em public/)
set -euo pipefail

RAIZ="$(cd "$(dirname "$0")/.." && pwd)"
CHROME="${CHROME:-/Applications/Google Chrome.app/Contents/MacOS/Google Chrome}"

render() {
  local origem="$1" destino="$2"
  "$CHROME" --headless=new --disable-gpu --no-pdf-header-footer \
    --virtual-time-budget=15000 --run-all-compositor-stages-before-draw \
    --print-to-pdf="$destino" "file://$origem" 2>/dev/null
  echo "gerado: ${destino#$RAIZ/}"
}

render "$RAIZ/materiais-fonte/diagnostico-express.html" "$RAIZ/public/downloads/diagnostico-express-enem.pdf"

if [ -f "$RAIZ/privado/fonte/kit-acao-do-aluno.html" ]; then
  render "$RAIZ/privado/fonte/kit-acao-do-aluno.html" "$RAIZ/privado/kit-acao-do-aluno.pdf"
fi
