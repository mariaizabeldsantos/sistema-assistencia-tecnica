-- =====================================================================
-- 03_consultas.sql  -  DML (SELECT) e relatórios
-- Sistema de Assistência Técnica  |  Laboratório de Banco de Dados
--
-- Consultas organizadas pelo conteúdo das aulas:
--   Aula 3  : SELECT, WHERE, AND/OR, IN, BETWEEN, LIKE, ORDER BY, LIMIT
--   Semana 13: JOIN entre tabelas relacionadas (PK/FK, N:N)
--   Semana 14: COUNT/SUM/AVG/MIN/MAX, GROUP BY, HAVING, LEFT JOIN
-- Só leitura (SELECT e CREATE VIEW): pode rodar quantas vezes quiser.
-- Rode antes 01_schema.sql e 02_dados_exemplo.sql.
-- =====================================================================


-- =====================================================================
-- PARTE 1 - Consultas simples (Aula 3)
-- =====================================================================

-- 1.1 Todos os clientes em ordem alfabética
SELECT nome, telefone, email
FROM clients
ORDER BY nome ASC;

-- 1.2 Colunas específicas + filtro com WHERE
SELECT nome, telefone
FROM clients
WHERE endereco LIKE '%Taquaritinga%';

-- 1.3 Ordens ainda abertas (IN / NOT IN)
SELECT numero, status, problema_relatado
FROM orders
WHERE status NOT IN ('ENTREGUE', 'CANCELADO')
ORDER BY numero;

-- 1.4 Peças com estoque baixo (comparação entre colunas)
SELECT nome, quantidade, estoque_minimo
FROM parts
WHERE quantidade <= estoque_minimo
ORDER BY quantidade;

-- 1.5 Peças com preço de orçamento entre 100 e 300 (BETWEEN, AND)
SELECT nome, preco_orcamento
FROM parts
WHERE preco_orcamento BETWEEN 100 AND 300
ORDER BY preco_orcamento DESC;

-- 1.6 As 3 peças mais caras (ORDER BY + LIMIT)
SELECT nome, preco_orcamento
FROM parts
ORDER BY preco_orcamento DESC
LIMIT 3;

-- 1.7 Busca por parte do nome, sem diferenciar maiúsculas (ILIKE)
SELECT nome, cpf, telefone
FROM clients
WHERE nome ILIKE '%souza%';

-- 1.8 Combinando AND / OR com parênteses
SELECT nome, categoria, quantidade
FROM parts
WHERE (categoria = 'SSD/HD' OR categoria = 'Memória RAM')
  AND quantidade > 5;


-- =====================================================================
-- PARTE 2 - JOIN: conectando tabelas pelas chaves (Semana 13)
-- =====================================================================

-- 2.1 OS com cliente e equipamento (orders -> clients e equipment)
SELECT o.numero,
       c.nome            AS cliente,
       e.marca || ' ' || e.modelo AS equipamento,
       o.status
FROM orders o
JOIN clients   c ON c.id = o.client_id
JOIN equipment e ON e.id = o.equipment_id
ORDER BY o.numero;

-- 2.2 Equipamentos de cada cliente (relacionamento 1:N)
SELECT c.nome AS cliente, e.tipo, e.marca, e.modelo
FROM clients c
JOIN equipment e ON e.client_id = c.id
ORDER BY c.nome, e.marca;

-- 2.3 Peças usadas em cada OS (tabela associativa N:N: orders <-> parts)
SELECT o.numero, p.nome AS peca, opu.quantidade, opu.custo
FROM order_parts_used opu
JOIN orders o ON o.id = opu.order_id
JOIN parts  p ON p.id = opu.peca_id
ORDER BY o.numero;

-- 2.4 Linha do tempo (histórico de status) de uma OS
SELECT o.numero, h.status_anterior, h.status_novo, h.data, h.usuario
FROM order_status_history h
JOIN orders o ON o.id = h.order_id
WHERE o.numero = (SELECT MIN(numero) + 1 FROM orders)   -- troque pelo número que quiser
ORDER BY h.data;

-- 2.5 LEFT JOIN: clientes SEM nenhuma OS (o JOIN comum os esconderia)
SELECT c.nome, COUNT(o.id) AS qtd_os
FROM clients c
LEFT JOIN orders o ON o.client_id = c.id
GROUP BY c.id, c.nome
HAVING COUNT(o.id) = 0;


-- =====================================================================
-- PARTE 3 - Agregações, GROUP BY e HAVING (Semana 14)
-- =====================================================================

-- 3.1 Resumo geral de peças: COUNT, SUM, AVG, MIN, MAX
SELECT COUNT(*)                         AS tipos_de_peca,
       SUM(quantidade)                  AS unidades_em_estoque,
       ROUND(AVG(preco_orcamento), 2)   AS preco_medio,
       MIN(preco_orcamento)             AS menor_preco,
       MAX(preco_orcamento)             AS maior_preco
FROM parts;

-- 3.2 OS por status (equivale ao /dashboard e /reports do backend)
SELECT status, COUNT(*) AS qtd
FROM orders
GROUP BY status
ORDER BY qtd DESC, status;

-- 3.3 OS por cliente, incluindo quem não tem nenhuma (LEFT JOIN + COUNT(coluna))
SELECT c.id, c.nome, COUNT(o.id) AS qtd_os
FROM clients c
LEFT JOIN orders o ON o.client_id = c.id
GROUP BY c.id, c.nome
ORDER BY qtd_os DESC, c.nome;

-- 3.4 HAVING filtra GRUPOS: clientes com mais de 1 OS
SELECT c.nome, COUNT(*) AS qtd_os
FROM clients c
JOIN orders o ON o.client_id = c.id
GROUP BY c.id, c.nome
HAVING COUNT(*) > 1
ORDER BY qtd_os DESC;

-- 3.5 Peças mais usadas nas OS (JOIN + GROUP BY) - equivale a "topPecas"
SELECT opu.nome, SUM(opu.quantidade) AS total_usado
FROM order_parts_used opu
GROUP BY opu.peca_id, opu.nome
ORDER BY total_usado DESC, opu.nome
LIMIT 6;

-- 3.6 Valor total orçado por cliente (lendo o JSONB do orçamento)
--     orcamento ->> 'total' extrai o valor como texto; ::numeric converte.
SELECT c.nome,
       COUNT(o.id)                               AS os_com_orcamento,
       SUM((o.orcamento ->> 'total')::numeric)   AS total_orcado
FROM clients c
JOIN orders o ON o.client_id = c.id
WHERE o.orcamento IS NOT NULL                     -- WHERE filtra LINHAS...
GROUP BY c.id, c.nome
HAVING SUM((o.orcamento ->> 'total')::numeric) > 150   -- ...HAVING filtra GRUPOS
ORDER BY total_orcado DESC;

-- 3.7 Ticket médio das OS entregues
SELECT COUNT(*)                                   AS entregues,
       ROUND(AVG((orcamento ->> 'total')::numeric), 2) AS ticket_medio,
       MIN((orcamento ->> 'total')::numeric)      AS menor,
       MAX((orcamento ->> 'total')::numeric)      AS maior
FROM orders
WHERE status = 'ENTREGUE';

-- 3.8 Movimentação de estoque por peça (entradas x saídas)
SELECT p.nome,
       SUM(CASE WHEN m.tipo = 'entrada' THEN m.quantidade ELSE 0 END) AS entradas,
       SUM(CASE WHEN m.tipo = 'saida'   THEN m.quantidade ELSE 0 END) AS saidas
FROM parts p
JOIN stock_movements m ON m.peca_id = p.id
GROUP BY p.id, p.nome
ORDER BY p.nome;

-- 3.9 Equipamentos por marca, só marcas com 2 ou mais equipamentos
SELECT marca, COUNT(*) AS qtd
FROM equipment
GROUP BY marca
HAVING COUNT(*) >= 2;


-- =====================================================================
-- PARTE 4 - Subconsultas e JSONB
-- =====================================================================

-- 4.1 Peças cujo preço está acima da média (subconsulta)
SELECT nome, preco_orcamento
FROM parts
WHERE preco_orcamento > (SELECT AVG(preco_orcamento) FROM parts)
ORDER BY preco_orcamento DESC;

-- 4.2 Garantias VIGENTES x VENCIDAS (equivale a /warranties do backend)
--     dataFinal está dentro do JSONB "garantia" como texto ISO.
SELECT o.numero,
       c.nome AS cliente,
       (o.garantia ->> 'dataFinal')::timestamp AS garantia_ate,
       CASE WHEN (o.garantia ->> 'dataFinal')::timestamp >= (now() AT TIME ZONE 'utc')
            THEN 'vigente' ELSE 'vencida' END AS situacao
FROM orders o
JOIN clients c ON c.id = o.client_id
WHERE o.garantia IS NOT NULL
ORDER BY garantia_ate;

-- 4.3 OS cujo orçamento foi recusado pelo cliente
SELECT o.numero, c.nome, o.aprovacao ->> 'observacao' AS motivo
FROM orders o
JOIN clients c ON c.id = o.client_id
WHERE o.aprovacao ->> 'status' = 'recusado';

-- 4.4 Tempo entre a entrada e a entrega das OS entregues (em dias)
SELECT numero,
       ROUND(EXTRACT(EPOCH FROM (data_entrega - created_at)) / 86400, 1) AS dias_ate_entrega
FROM orders
WHERE data_entrega IS NOT NULL
ORDER BY numero;


-- =====================================================================
-- PARTE 5 - Conferência de integridade
-- =====================================================================

-- 5.1 O estoque de cada peça deve ser igual a ENTRADAS - SAÍDAS.
--     Se esta consulta devolver alguma linha, há inconsistência.
SELECT p.nome,
       p.quantidade AS estoque_registrado,
       COALESCE(SUM(CASE WHEN m.tipo = 'entrada' THEN m.quantidade ELSE -m.quantidade END), 0) AS estoque_pelas_movimentacoes
FROM parts p
LEFT JOIN stock_movements m ON m.peca_id = p.id
GROUP BY p.id, p.nome, p.quantidade
HAVING p.quantidade <> COALESCE(SUM(CASE WHEN m.tipo = 'entrada' THEN m.quantidade ELSE -m.quantidade END), 0);

-- 5.2 Toda OS deve ter pelo menos uma linha no histórico de status
SELECT o.numero
FROM orders o
LEFT JOIN order_status_history h ON h.order_id = o.id
WHERE h.id IS NULL;

-- 5.3 Status atual da OS deve ser igual ao último status do histórico
SELECT o.numero, o.status AS status_da_os, ult.status_novo AS ultimo_do_historico
FROM orders o
JOIN LATERAL (
    SELECT status_novo FROM order_status_history
    WHERE order_id = o.id
    ORDER BY data DESC LIMIT 1
) ult ON TRUE
WHERE o.status <> ult.status_novo;


-- =====================================================================
-- PARTE 6 - Views (consultas salvas no banco)
-- =====================================================================

-- 6.1 Visão detalhada das OS: quem, qual equipamento, valor e status
CREATE OR REPLACE VIEW vw_os_detalhada AS
SELECT o.numero,
       o.status,
       c.nome                         AS cliente,
       c.telefone,
       e.tipo,
       e.marca || ' ' || COALESCE(e.modelo, '') AS equipamento,
       o.problema_relatado,
       (o.orcamento ->> 'total')::numeric       AS valor_orcado,
       o.created_at                   AS aberta_em,
       o.data_entrega
FROM orders o
JOIN clients   c ON c.id = o.client_id
JOIN equipment e ON e.id = o.equipment_id;

-- 6.2 Peças para repor (estoque no mínimo ou abaixo)
CREATE OR REPLACE VIEW vw_estoque_baixo AS
SELECT nome, categoria, quantidade, estoque_minimo,
       estoque_minimo - quantidade AS falta_para_o_minimo,
       fornecedor
FROM parts
WHERE quantidade <= estoque_minimo;

-- Usando as views:
SELECT * FROM vw_os_detalhada ORDER BY numero;
SELECT * FROM vw_estoque_baixo ORDER BY falta_para_o_minimo DESC;
