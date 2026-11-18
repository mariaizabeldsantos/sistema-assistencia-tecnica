-- =====================================================================
-- 04_transacoes.sql  -  TCL: BEGIN / COMMIT / ROLLBACK (Semana 12)
-- Sistema de Assistência Técnica  |  Laboratório de Banco de Dados
--
-- Cenário real do sistema: "usar uma peça em uma ordem de serviço".
-- Essa operação mexe em TRÊS tabelas ao mesmo tempo:
--     parts              -> baixa a quantidade em estoque
--     stock_movements    -> registra a saída
--     order_parts_used   -> liga a peça à OS (com custo e nome)
-- Se qualquer passo falhar, nenhum pode ficar gravado (atomicidade).
--
-- No backend isso é feito por POST /orders/{id}/pecas (routers/orders.py,
-- função usar_peca): as 3 mudanças só são gravadas no único db.commit()
-- final; se acontecer um erro, o SQLAlchemy desfaz tudo (rollback).
--
-- COMO RODAR: execute um bloco por vez (cada bloco começa com "BLOCO").
-- Os blocos A e D ALTERAM os dados de exemplo (baixam 1 cooler do estoque);
-- os blocos B e C não deixam nenhuma alteração.
--
-- Ids usados:  OS #5 (Carla)   = b1000000-0000-4000-8000-000000000005
--              Cooler de CPU    = a1000000-0000-4000-8000-000000000007
--              Bateria Notebook = a1000000-0000-4000-8000-000000000003
-- =====================================================================


-- ---------------------------------------------------------------------
-- BLOCO A - Transação com COMMIT (tudo deu certo)
-- ---------------------------------------------------------------------
SELECT nome, quantidade FROM parts
WHERE id = 'a1000000-0000-4000-8000-000000000007';          -- antes

BEGIN;

UPDATE parts
SET quantidade = quantidade - 1,
    updated_at = (now() AT TIME ZONE 'utc')
WHERE id = 'a1000000-0000-4000-8000-000000000007';

INSERT INTO stock_movements (peca_id, tipo, quantidade, usuario, motivo, ordem_id)
VALUES ('a1000000-0000-4000-8000-000000000007', 'saida', 1,
        'Administrador', 'Uso em OS', 'b1000000-0000-4000-8000-000000000005');

INSERT INTO order_parts_used (order_id, peca_id, nome, quantidade, custo, usuario)
SELECT 'b1000000-0000-4000-8000-000000000005', id, nome, 1, custo_aquisicao, 'Administrador'
FROM parts
WHERE id = 'a1000000-0000-4000-8000-000000000007';

COMMIT;     -- agora as 3 alterações são permanentes

SELECT nome, quantidade FROM parts
WHERE id = 'a1000000-0000-4000-8000-000000000007';          -- depois: 1 a menos


-- ---------------------------------------------------------------------
-- BLOCO B - ROLLBACK voluntário (o "UPDATE sem WHERE" que a aula alerta)
-- ---------------------------------------------------------------------
BEGIN;

UPDATE parts SET quantidade = 0;            -- esqueci o WHERE!

SELECT nome, quantidade FROM parts;         -- dentro da transação: tudo zerado

ROLLBACK;                                   -- desfaz tudo

SELECT nome, quantidade FROM parts;         -- as quantidades voltaram ao normal


-- ---------------------------------------------------------------------
-- BLOCO C - Falha no meio da transação -> ROLLBACK
-- O 1º UPDATE é válido; o 2º tenta tirar 999 unidades e viola a regra
-- ck_parts_quantidade (quantidade >= 0). O banco recusa, e o ROLLBACK
-- desfaz também o 1º UPDATE, que "parecia ter funcionado".
-- (No psql, depois do erro a transação fica "abortada" até o ROLLBACK.)
-- ---------------------------------------------------------------------
BEGIN;

UPDATE parts SET quantidade = quantidade - 1
WHERE id = 'a1000000-0000-4000-8000-000000000007';          -- OK

UPDATE parts SET quantidade = quantidade - 999
WHERE id = 'a1000000-0000-4000-8000-000000000003';          -- ERRO!

ROLLBACK;

SELECT nome, quantidade FROM parts
WHERE id IN ('a1000000-0000-4000-8000-000000000007',
             'a1000000-0000-4000-8000-000000000003');       -- nada mudou


-- ---------------------------------------------------------------------
-- BLOCO D - A mesma operação como FUNÇÃO (atômica por natureza)
-- Uma função PL/pgSQL roda dentro de uma única transação: se um RAISE
-- EXCEPTION acontecer, tudo o que ela já tinha feito é desfeito.
-- FOR UPDATE trava a linha da peça, evitando que dois atendentes usem a
-- mesma última unidade ao mesmo tempo (controle de concorrência).
-- Observação: esta função é um exemplo didático; o sistema continua
-- usando a lógica do backend (routers/orders.py).
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION usar_peca_em_os(
    p_order_id UUID,
    p_peca_id  UUID,
    p_qtd      INTEGER,
    p_usuario  TEXT DEFAULT 'Administrador'
) RETURNS VOID
LANGUAGE plpgsql
AS $$
DECLARE
    v_peca parts%ROWTYPE;
BEGIN
    IF p_qtd IS NULL OR p_qtd < 1 THEN
        RAISE EXCEPTION 'Quantidade inválida.';
    END IF;

    SELECT * INTO v_peca FROM parts WHERE id = p_peca_id FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Peça não encontrada.';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM orders WHERE id = p_order_id) THEN
        RAISE EXCEPTION 'Ordem de serviço não encontrada.';
    END IF;
    IF v_peca.quantidade < p_qtd THEN
        RAISE EXCEPTION 'Estoque insuficiente para realizar esta operação.';
    END IF;

    UPDATE parts
    SET quantidade = quantidade - p_qtd,
        updated_at = (now() AT TIME ZONE 'utc')
    WHERE id = p_peca_id;

    INSERT INTO stock_movements (peca_id, tipo, quantidade, usuario, motivo, ordem_id)
    VALUES (p_peca_id, 'saida', p_qtd, p_usuario, 'Uso em OS', p_order_id);

    INSERT INTO order_parts_used (order_id, peca_id, nome, quantidade, custo, usuario)
    VALUES (p_order_id, p_peca_id, v_peca.nome, p_qtd, v_peca.custo_aquisicao, p_usuario);
END;
$$;

-- D.1 Uso válido (grava as 3 alterações)
SELECT usar_peca_em_os('b1000000-0000-4000-8000-000000000005',
                       'a1000000-0000-4000-8000-000000000007', 1);

-- D.2 Uso inválido: só há 2 baterias em estoque e pedimos 5.
--     A função levanta o erro e NADA é gravado.
SELECT usar_peca_em_os('b1000000-0000-4000-8000-000000000005',
                       'a1000000-0000-4000-8000-000000000003', 5);

-- D.3 Conferência: estoque registrado = entradas - saídas (deve voltar 0 linhas)
SELECT p.nome, p.quantidade
FROM parts p
LEFT JOIN stock_movements m ON m.peca_id = p.id
GROUP BY p.id, p.nome, p.quantidade
HAVING p.quantidade <> COALESCE(SUM(CASE WHEN m.tipo = 'entrada' THEN m.quantidade ELSE -m.quantidade END), 0);
