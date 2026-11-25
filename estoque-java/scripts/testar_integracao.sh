#!/usr/bin/env bash
# Teste de integração ponta a ponta: Python (login + OS) <-> Java (estoque) <-> PostgreSQL.
# Pré-requisitos: backend Python em :8000, API Java em :8080, e um admin já criado ("Primeiro acesso").
# Uso: EMAIL=admin@x.com SENHA=suasenha ./scripts/testar_integracao.sh
set -euo pipefail
PY=${PY:-http://localhost:8000}; JAVA=${JAVA:-http://localhost:8080}
: "${EMAIL:?defina EMAIL}"; : "${SENHA:?defina SENHA}"
ok(){ echo "  OK  $*"; }; falha(){ echo " FALHA $*"; exit 1; }
j(){ python3 -c "import sys,json; d=json.load(sys.stdin); print($1)"; }

TOKEN=$(curl -sf -X POST "$PY/auth/login" -d "username=$EMAIL" -d "password=$SENHA" | j "d['access_token']")
H=(-H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json")
code(){ curl -s -o /dev/null -w "%{http_code}" "$@"; }

[ "$(code "$JAVA/parts")" = 401 ] && ok "sem token -> 401" || falha "sem token deveria dar 401"
[ "$(code -H 'Authorization: Bearer lixo' "$JAVA/parts")" = 401 ] && ok "token inválido -> 401" || falha "token inválido"

ID=$(curl -sf "${H[@]}" -X POST "$JAVA/parts" -d '{"nome":"Peça teste Java","quantidade":5,"estoqueMinimo":3,"custoAquisicao":10,"precoOrcamento":20}' | j "d['id']")
ok "peça criada $ID"
curl -sf "${H[@]}" "$JAVA/parts" | grep -q "$ID" && ok "aparece na listagem Java" || falha "listagem"
curl -sf "${H[@]}" "$PY/parts" | grep -q "$ID" && ok "Python enxerga a mesma peça (mesmo banco)" || falha "Python não vê a peça"

curl -sf "${H[@]}" -X PUT "$JAVA/parts/$ID" -d '{"nome":"Peça teste Java 2","estoqueMinimo":3}' | j "d['nome']" | grep -q "Java 2" && ok "edição" || falha "edição"
[ "$(curl -sf "${H[@]}" "$JAVA/parts" | j "[p for p in d if p['id']=='$ID'][0]['quantidade']")" = 5 ] && ok "edição não alterou quantidade" || falha "quantidade mudou na edição"

[ "$(curl -sf "${H[@]}" -X POST "$JAVA/parts/$ID/movimentar" -d '{"tipo":"entrada","quantidade":2,"motivo":"teste"}' | j "d['quantidade']")" = 7 ] && ok "entrada +2 = 7" || falha "entrada"
[ "$(curl -sf "${H[@]}" -X POST "$JAVA/parts/$ID/movimentar" -d '{"tipo":"saida","quantidade":4}' | j "d['quantidade']")" = 3 ] && ok "saída -4 = 3" || falha "saída"
R=$(curl -s "${H[@]}" -X POST "$JAVA/parts/$ID/movimentar" -d '{"tipo":"saida","quantidade":99}' -w " %{http_code}")
echo "$R" | grep -q "Estoque insuficiente.* 400" && ok "saída maior que o saldo -> 400 {detail}" || falha "saída excessiva: $R"

curl -sf "${H[@]}" "$JAVA/parts/estoque-baixo" | grep -q "$ID" && ok "peça aparece em estoque-baixo (3 <= 3)" || falha "estoque-baixo"
[ "$(curl -sf "${H[@]}" "$JAVA/parts/$ID/movimentacoes" | j "len(d)")" = 2 ] && ok "histórico com 2 movimentações" || falha "histórico"
curl -sf "${H[@]}" "$JAVA/parts/movimentacoes?limit=10" | grep -q "pecaNome" && ok "histórico geral" || falha "histórico geral"

echo "--- Concorrência Java x Python (20 saídas de 1 unidade em paralelo, saldo 10) ---"
curl -sf "${H[@]}" -X POST "$JAVA/parts/$ID/movimentar" -d '{"tipo":"entrada","quantidade":7}' >/dev/null   # saldo 10
for i in $(seq 1 10); do
  curl -s -o /dev/null "${H[@]}" -X POST "$JAVA/parts/$ID/movimentar" -d '{"tipo":"saida","quantidade":1}' &
  curl -s -o /dev/null "${H[@]}" -X POST "$PY/parts/$ID/movimentar" -d '{"tipo":"saida","quantidade":1}' &
done; wait
FINAL=$(curl -sf "${H[@]}" "$JAVA/parts" | j "[p for p in d if p['id']=='$ID'][0]['quantidade']")
[ "$FINAL" = 0 ] && ok "saldo final 0, sem perda de baixas" || echo "  AVISO saldo final=$FINAL (esperado 0). As rotas /parts do Python NÃO usam trava; só o /orders/{id}/pecas usa."
echo "Concluído."
