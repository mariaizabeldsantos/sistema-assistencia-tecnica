-- dados de exemplo para a apresentacao (nao usar em producao)
-- rodar depois do primeiro acesso do sistema, que cria o admin e as configuracoes
-- so roda uma vez, tudo dentro de uma transacao

BEGIN;

DO $seed$
DECLARE
    base INTEGER;   -- primeiro número de OS livre (settings.proximo_numero_os)
BEGIN
    -- confere antes de inserir
    SELECT proximo_numero_os INTO base FROM settings WHERE id = 1;
    IF base IS NULL THEN
        RAISE EXCEPTION 'Faça o "Primeiro acesso" no sistema antes de carregar os dados de exemplo.';
    END IF;
    IF EXISTS (SELECT 1 FROM clients WHERE id = 'c1000000-0000-4000-8000-000000000001') THEN
        RAISE EXCEPTION 'Os dados de exemplo já foram carregados.';
    END IF;

    -- clientes
    INSERT INTO clients (id, nome, cpf, telefone, whatsapp, email, endereco, created_at, updated_at) VALUES
    ('c1000000-0000-4000-8000-000000000001', 'Ana Souza',      '12345678909', '16991111111', '16991111111', 'ana.souza@email.com',      'Rua das Flores, 120 - Taquaritinga/SP', '2026-05-20 09:00', '2026-05-20 09:00'),
    ('c1000000-0000-4000-8000-000000000002', 'Bruno Lima',     '98765432100', '16992222222', '16992222222', 'bruno.lima@email.com',     'Av. Brasil, 455 - Taquaritinga/SP',     '2026-05-21 10:30', '2026-05-21 10:30'),
    ('c1000000-0000-4000-8000-000000000003', 'Carla Mendes',   NULL,          '16993333333', NULL,          'carla.mendes@email.com',   'Rua Sete de Setembro, 78 - Matão/SP',   '2026-06-15 14:00', '2026-06-15 14:00'),
    ('c1000000-0000-4000-8000-000000000004', 'Diego Ferreira', '11144477735', '16994444444', '16994444444', 'diego.ferreira@email.com', 'Rua XV de Novembro, 300 - Taquaritinga/SP', '2026-07-02 08:45', '2026-07-02 08:45'),
    ('c1000000-0000-4000-8000-000000000005', 'Elisa Rocha',    '24681357928', '16995555555', '16995555555', 'elisa.rocha@email.com',    'Rua Goiás, 12 - Taquaritinga/SP',       '2026-08-10 16:20', '2026-08-10 16:20'),
    ('c1000000-0000-4000-8000-000000000006', 'Fábio Alves',    '13579246828', '16996666666', NULL,          NULL,                       NULL,                                    '2026-10-01 11:10', '2026-10-01 11:10');

    -- equipamentos
    INSERT INTO equipment (id, client_id, tipo, marca, modelo, numero_serie, acessorios, created_at, updated_at) VALUES
    ('e1000000-0000-4000-8000-000000000001', 'c1000000-0000-4000-8000-000000000001', 'notebook',   'Dell',     'Inspiron 15',        'DL15-0001', 'Carregador',            '2026-05-20 09:10', '2026-05-20 09:10'),
    ('e1000000-0000-4000-8000-000000000002', 'c1000000-0000-4000-8000-000000000002', 'notebook',   'Lenovo',   'IdeaPad 3',          'LN3-0002',  'Carregador e mochila',  '2026-05-21 10:40', '2026-05-21 10:40'),
    ('e1000000-0000-4000-8000-000000000003', 'c1000000-0000-4000-8000-000000000003', 'computador', 'Positivo', 'Master Desktop',     'PS-0003',   'Cabo de força',         '2026-06-15 14:10', '2026-06-15 14:10'),
    ('e1000000-0000-4000-8000-000000000004', 'c1000000-0000-4000-8000-000000000004', 'notebook',   'Acer',     'Aspire 5',           'AC5-0004',  'Carregador',            '2026-07-02 08:50', '2026-07-02 08:50'),
    ('e1000000-0000-4000-8000-000000000005', 'c1000000-0000-4000-8000-000000000005', 'notebook',   'Asus',     'VivoBook 15',        'AS-0005',   'Carregador',            '2026-08-10 16:30', '2026-08-10 16:30'),
    ('e1000000-0000-4000-8000-000000000006', 'c1000000-0000-4000-8000-000000000001', 'computador', 'HP',       'ProDesk 400',        'HP-0006',   'Cabo de força e mouse', '2026-09-05 13:00', '2026-09-05 13:00'),
    ('e1000000-0000-4000-8000-000000000007', 'c1000000-0000-4000-8000-000000000004', 'computador', 'Dell',     'Optiplex 3080',      'DL-0007',   'Cabo de força',         '2026-10-18 09:30', '2026-10-18 09:30');

    -- peças
    INSERT INTO parts (id, nome, categoria, fabricante, modelo, codigo, quantidade, estoque_minimo, custo_aquisicao, preco_orcamento, fornecedor, localizacao, created_at, updated_at) VALUES
    ('a1000000-0000-4000-8000-000000000001', 'SSD 480GB',               'SSD/HD',           'Kingston', 'A400',        'SSD-480', 11, 3,  180.00, 260.00, 'TecnoPeças',   'Prateleira A1', '2026-06-01 09:00', '2026-09-02 10:00'),
    ('a1000000-0000-4000-8000-000000000002', 'Memória RAM 8GB DDR4',    'Memória RAM',      'Kingston', 'KVR26N19S8',  'RAM-8D4', 10, 4,  120.00, 180.00, 'TecnoPeças',   'Prateleira A2', '2026-06-01 09:00', '2026-06-01 09:00'),
    ('a1000000-0000-4000-8000-000000000003', 'Bateria Notebook Dell',   'Bateria',          'Dell',     'Inspiron 15', 'BAT-D15',  2, 3,  150.00, 230.00, 'Distribuidora Sul', 'Prateleira B1', '2026-06-01 09:00', '2026-06-01 09:00'),
    ('a1000000-0000-4000-8000-000000000004', 'Fonte ATX 500W',          'Fonte',            'C3Tech',   'PS-500',      'FON-500',  4, 2,   90.00, 140.00, 'TecnoPeças',   'Prateleira C1', '2026-06-01 09:00', '2026-10-26 09:00'),
    ('a1000000-0000-4000-8000-000000000005', 'Tela 15.6 LED',           'Tela/Display',     'Samsung',  'LTN156AT',    'TELA-156', 1, 2,  280.00, 420.00, 'Distribuidora Sul', 'Prateleira D1', '2026-06-01 09:00', '2026-06-01 09:00'),
    ('a1000000-0000-4000-8000-000000000006', 'Teclado Notebook ABNT2',  'Teclado',          'Genérico', 'ABNT2-15',    'TEC-ABN',  5, 2,   45.00,  80.00, 'TecnoPeças',   'Prateleira B2', '2026-06-01 09:00', '2026-06-05 09:00'),
    ('a1000000-0000-4000-8000-000000000007', 'Cooler de CPU',           'Cooler/Ventoinha', 'Cooler Master', 'Hyper H410', 'COO-H410', 7, 3,   25.00,  55.00, 'TecnoPeças',   'Prateleira C2', '2026-06-01 09:00', '2026-10-24 09:00'),
    ('a1000000-0000-4000-8000-000000000008', 'Carregador Universal 65W','Carregador',       'Multilaser', 'UN65',      'CAR-65',   4, 2,   60.00, 110.00, 'Distribuidora Sul', 'Prateleira B3', '2026-06-01 09:00', '2026-06-01 09:00');

    -- 4) ORDENS DE SERVIÇO - uma em cada status ------------------------
    -- numero = base + k, para não colidir com OS que já existam.
    INSERT INTO orders (id, numero, client_id, equipment_id, problema_relatado, acessorios, estado_fisico, status,
                        diagnostico, orcamento, aprovacao, garantia, data_conclusao, data_entrega, created_at, updated_at) VALUES

    -- k0: ENTREGUE com garantia VENCIDA (Bruno, troca de teclado)
    ('b1000000-0000-4000-8000-000000000001', base + 0,
     'c1000000-0000-4000-8000-000000000002', 'e1000000-0000-4000-8000-000000000002',
     'Várias teclas do teclado não respondem.', 'Carregador', 'Pequenos arranhões na tampa', 'ENTREGUE',
     '{"diagnostico":"Teclado com defeito de contato","testes":"Teste de teclas no modo de diagnóstico","solucao":"Troca do teclado"}',
     '{"itens":[{"id":"it-1","pecaId":"a1000000-0000-4000-8000-000000000006","descricao":"Teclado Notebook ABNT2","quantidade":1,"valorUnitario":80.0}],"maoObra":[{"id":"mo-1","descricao":"Troca de peça","valor":60.0}],"desconto":0,"totalPecas":80.0,"totalMaoObra":60.0,"total":140.0}',
     '{"status":"aprovado","data":"2026-06-03T10:00:00","usuario":"Bruno Lima","observacao":""}',
     '{"periodoDias":90,"dataInicio":"2026-06-10T15:00:00","dataFinal":"2026-09-08T15:00:00","condicoes":"Garantia padrão sobre o serviço realizado.","status":"vigente"}',
     '2026-06-09 17:00', '2026-06-10 15:00', '2026-06-02 09:00', '2026-06-10 15:00'),

    -- k1: ENTREGUE com garantia VIGENTE (Ana, troca de SSD)
    ('b1000000-0000-4000-8000-000000000002', base + 1,
     'c1000000-0000-4000-8000-000000000001', 'e1000000-0000-4000-8000-000000000001',
     'Notebook muito lento e travando.', 'Carregador', 'Em bom estado', 'ENTREGUE',
     '{"diagnostico":"HD com setores defeituosos","testes":"Teste SMART com falhas","solucao":"Troca por SSD e formatação"}',
     '{"itens":[{"id":"it-1","pecaId":"a1000000-0000-4000-8000-000000000001","descricao":"SSD 480GB","quantidade":1,"valorUnitario":260.0}],"maoObra":[{"id":"mo-1","descricao":"Formatação","valor":80.0}],"desconto":0,"totalPecas":260.0,"totalMaoObra":80.0,"total":340.0}',
     '{"status":"aprovado","data":"2026-09-02T14:00:00","usuario":"Ana Souza","observacao":""}',
     '{"periodoDias":90,"dataInicio":"2026-09-15T16:00:00","dataFinal":"2026-12-14T16:00:00","condicoes":"Garantia padrão sobre o serviço realizado.","status":"vigente"}',
     '2026-09-14 18:00', '2026-09-15 16:00', '2026-09-01 10:00', '2026-09-15 16:00'),

    -- k2: CANCELADO (Bruno recusou o orçamento de upgrade de memória)
    ('b1000000-0000-4000-8000-000000000003', base + 2,
     'c1000000-0000-4000-8000-000000000002', 'e1000000-0000-4000-8000-000000000002',
     'Quero aumentar a memória do notebook.', 'Carregador', 'Em bom estado', 'CANCELADO',
     '{"diagnostico":"Notebook aceita mais um pente de memória","testes":"Verificação de slots","solucao":"Instalar 8GB DDR4"}',
     '{"itens":[{"id":"it-1","pecaId":"a1000000-0000-4000-8000-000000000002","descricao":"Memória RAM 8GB DDR4","quantidade":1,"valorUnitario":180.0}],"maoObra":[{"id":"mo-1","descricao":"Upgrade","valor":40.0}],"desconto":0,"totalPecas":180.0,"totalMaoObra":40.0,"total":220.0}',
     '{"status":"recusado","data":"2026-09-21T11:00:00","usuario":"Bruno Lima","observacao":"Achei o valor alto."}',
     NULL, NULL, NULL, '2026-09-20 09:30', '2026-09-21 11:00'),

    -- k3: PRONTO (Diego, desktop - limpeza e troca de cooler)
    ('b1000000-0000-4000-8000-000000000004', base + 3,
     'c1000000-0000-4000-8000-000000000004', 'e1000000-0000-4000-8000-000000000007',
     'Computador esquentando e muito barulhento.', 'Cabo de força', 'Poeira interna', 'PRONTO',
     '{"diagnostico":"Cooler com rolamento gasto e poeira","testes":"Monitoramento de temperatura","solucao":"Troca do cooler e limpeza interna"}',
     '{"itens":[{"id":"it-1","pecaId":"a1000000-0000-4000-8000-000000000007","descricao":"Cooler de CPU","quantidade":1,"valorUnitario":55.0}],"maoObra":[{"id":"mo-1","descricao":"Limpeza interna","valor":50.0},{"id":"mo-2","descricao":"Formatação","valor":80.0}],"desconto":0,"totalPecas":55.0,"totalMaoObra":130.0,"total":185.0}',
     '{"status":"aprovado","data":"2026-10-21T09:00:00","usuario":"Diego Ferreira","observacao":""}',
     NULL, '2026-10-28 16:00', NULL, '2026-10-20 09:40', '2026-10-28 16:00'),

    -- k4: EM_MANUTENCAO (Carla, computador não liga)
    ('b1000000-0000-4000-8000-000000000005', base + 4,
     'c1000000-0000-4000-8000-000000000003', 'e1000000-0000-4000-8000-000000000003',
     'O computador não liga.', 'Cabo de força', 'Em bom estado', 'EM_MANUTENCAO',
     '{"diagnostico":"Fonte de alimentação queimada","testes":"Teste com fonte de bancada","solucao":"Troca da fonte"}',
     '{"itens":[{"id":"it-1","pecaId":"a1000000-0000-4000-8000-000000000004","descricao":"Fonte ATX 500W","quantidade":1,"valorUnitario":140.0}],"maoObra":[{"id":"mo-1","descricao":"Troca de peça","valor":50.0}],"desconto":0,"totalPecas":140.0,"totalMaoObra":50.0,"total":190.0}',
     '{"status":"aprovado","data":"2026-10-26T08:30:00","usuario":"Carla Mendes","observacao":""}',
     NULL, NULL, NULL, '2026-10-25 15:00', '2026-10-26 09:00'),

    -- k5: AGUARDANDO_APROVACAO (Diego, tela com listras)
    ('b1000000-0000-4000-8000-000000000006', base + 5,
     'c1000000-0000-4000-8000-000000000004', 'e1000000-0000-4000-8000-000000000004',
     'Tela com listras coloridas.', 'Carregador', 'Pequena trinca na lateral', 'AGUARDANDO_APROVACAO',
     '{"diagnostico":"Painel LCD danificado","testes":"Teste com monitor externo (imagem normal)","solucao":"Troca da tela"}',
     '{"itens":[{"id":"it-1","pecaId":"a1000000-0000-4000-8000-000000000005","descricao":"Tela 15.6 LED","quantidade":1,"valorUnitario":420.0}],"maoObra":[{"id":"mo-1","descricao":"Troca de peça","valor":120.0}],"desconto":0,"totalPecas":420.0,"totalMaoObra":120.0,"total":540.0}',
     NULL, NULL, NULL, NULL, '2026-10-30 10:00', '2026-10-31 09:00'),

    -- k6: ORCAMENTO (Elisa, bateria não carrega - só diagnóstico)
    ('b1000000-0000-4000-8000-000000000007', base + 6,
     'c1000000-0000-4000-8000-000000000005', 'e1000000-0000-4000-8000-000000000005',
     'A bateria não carrega.', 'Carregador', 'Em bom estado', 'ORCAMENTO',
     '{"diagnostico":"Conector de carga com mau contato","testes":"Teste com outro carregador","solucao":"A definir no orçamento"}',
     NULL, NULL, NULL, NULL, NULL, '2026-11-02 14:15', '2026-11-03 09:00'),

    -- k7: ENTRADA (Ana, desktop com barulho)
    ('b1000000-0000-4000-8000-000000000008', base + 7,
     'c1000000-0000-4000-8000-000000000001', 'e1000000-0000-4000-8000-000000000006',
     'Barulho alto vindo do computador.', 'Cabo de força e mouse', 'Em bom estado', 'ENTRADA',
     NULL, NULL, NULL, NULL, NULL, NULL, '2026-11-04 10:20', '2026-11-04 10:20');

    -- Próximo número de OS do sistema passa a ser base + 8
    UPDATE settings SET proximo_numero_os = base + 8 WHERE id = 1;

    -- histórico de status
    INSERT INTO order_status_history (order_id, status_anterior, status_novo, data, usuario)
    SELECT o.id, v.ant, v.novo, v.quando::timestamp, v.quem
    FROM (VALUES
        -- k0
        ('b1000000-0000-4000-8000-000000000001', NULL,                   'ENTRADA',              '2026-06-02 09:00', 'Sistema'),
        ('b1000000-0000-4000-8000-000000000001', 'ENTRADA',              'ORCAMENTO',            '2026-06-02 11:00', 'Administrador'),
        ('b1000000-0000-4000-8000-000000000001', 'ORCAMENTO',            'AGUARDANDO_APROVACAO', '2026-06-02 15:00', 'Administrador'),
        ('b1000000-0000-4000-8000-000000000001', 'AGUARDANDO_APROVACAO', 'EM_MANUTENCAO',        '2026-06-03 10:00', 'Bruno Lima'),
        ('b1000000-0000-4000-8000-000000000001', 'EM_MANUTENCAO',        'PRONTO',               '2026-06-09 17:00', 'Administrador'),
        ('b1000000-0000-4000-8000-000000000001', 'PRONTO',               'ENTREGUE',             '2026-06-10 15:00', 'Administrador'),
        -- k1
        ('b1000000-0000-4000-8000-000000000002', NULL,                   'ENTRADA',              '2026-09-01 10:00', 'Sistema'),
        ('b1000000-0000-4000-8000-000000000002', 'ENTRADA',              'ORCAMENTO',            '2026-09-01 14:00', 'Administrador'),
        ('b1000000-0000-4000-8000-000000000002', 'ORCAMENTO',            'AGUARDANDO_APROVACAO', '2026-09-01 16:00', 'Administrador'),
        ('b1000000-0000-4000-8000-000000000002', 'AGUARDANDO_APROVACAO', 'EM_MANUTENCAO',        '2026-09-02 14:00', 'Ana Souza'),
        ('b1000000-0000-4000-8000-000000000002', 'EM_MANUTENCAO',        'PRONTO',               '2026-09-14 18:00', 'Administrador'),
        ('b1000000-0000-4000-8000-000000000002', 'PRONTO',               'ENTREGUE',             '2026-09-15 16:00', 'Administrador'),
        -- k2
        ('b1000000-0000-4000-8000-000000000003', NULL,                   'ENTRADA',              '2026-09-20 09:30', 'Sistema'),
        ('b1000000-0000-4000-8000-000000000003', 'ENTRADA',              'ORCAMENTO',            '2026-09-20 10:30', 'Administrador'),
        ('b1000000-0000-4000-8000-000000000003', 'ORCAMENTO',            'AGUARDANDO_APROVACAO', '2026-09-20 11:30', 'Administrador'),
        ('b1000000-0000-4000-8000-000000000003', 'AGUARDANDO_APROVACAO', 'CANCELADO',            '2026-09-21 11:00', 'Administrador'),
        -- k3
        ('b1000000-0000-4000-8000-000000000004', NULL,                   'ENTRADA',              '2026-10-20 09:40', 'Sistema'),
        ('b1000000-0000-4000-8000-000000000004', 'ENTRADA',              'ORCAMENTO',            '2026-10-20 11:00', 'Administrador'),
        ('b1000000-0000-4000-8000-000000000004', 'ORCAMENTO',            'AGUARDANDO_APROVACAO', '2026-10-20 15:00', 'Administrador'),
        ('b1000000-0000-4000-8000-000000000004', 'AGUARDANDO_APROVACAO', 'EM_MANUTENCAO',        '2026-10-21 09:00', 'Diego Ferreira'),
        ('b1000000-0000-4000-8000-000000000004', 'EM_MANUTENCAO',        'PRONTO',               '2026-10-28 16:00', 'Administrador'),
        -- k4
        ('b1000000-0000-4000-8000-000000000005', NULL,                   'ENTRADA',              '2026-10-25 15:00', 'Sistema'),
        ('b1000000-0000-4000-8000-000000000005', 'ENTRADA',              'ORCAMENTO',            '2026-10-25 16:00', 'Administrador'),
        ('b1000000-0000-4000-8000-000000000005', 'ORCAMENTO',            'AGUARDANDO_APROVACAO', '2026-10-25 17:00', 'Administrador'),
        ('b1000000-0000-4000-8000-000000000005', 'AGUARDANDO_APROVACAO', 'EM_MANUTENCAO',        '2026-10-26 08:30', 'Carla Mendes'),
        -- k5
        ('b1000000-0000-4000-8000-000000000006', NULL,                   'ENTRADA',              '2026-10-30 10:00', 'Sistema'),
        ('b1000000-0000-4000-8000-000000000006', 'ENTRADA',              'ORCAMENTO',            '2026-10-30 14:00', 'Administrador'),
        ('b1000000-0000-4000-8000-000000000006', 'ORCAMENTO',            'AGUARDANDO_APROVACAO', '2026-10-31 09:00', 'Administrador'),
        -- k6
        ('b1000000-0000-4000-8000-000000000007', NULL,                   'ENTRADA',              '2026-11-02 14:15', 'Sistema'),
        ('b1000000-0000-4000-8000-000000000007', 'ENTRADA',              'ORCAMENTO',            '2026-11-03 09:00', 'Administrador'),
        -- k7
        ('b1000000-0000-4000-8000-000000000008', NULL,                   'ENTRADA',              '2026-11-04 10:20', 'Sistema')
    ) AS v(ordem, ant, novo, quando, quem)
    JOIN orders o ON o.id = v.ordem::uuid;

    -- estoque: entrada inicial de cada peça
    INSERT INTO stock_movements (peca_id, tipo, quantidade, data, usuario, motivo) VALUES
    ('a1000000-0000-4000-8000-000000000001', 'entrada', 12, '2026-06-01 09:00', 'Administrador', 'Estoque inicial'),
    ('a1000000-0000-4000-8000-000000000002', 'entrada', 10, '2026-06-01 09:00', 'Administrador', 'Estoque inicial'),
    ('a1000000-0000-4000-8000-000000000003', 'entrada',  2, '2026-06-01 09:00', 'Administrador', 'Estoque inicial'),
    ('a1000000-0000-4000-8000-000000000004', 'entrada',  5, '2026-06-01 09:00', 'Administrador', 'Estoque inicial'),
    ('a1000000-0000-4000-8000-000000000005', 'entrada',  1, '2026-06-01 09:00', 'Administrador', 'Estoque inicial'),
    ('a1000000-0000-4000-8000-000000000006', 'entrada',  6, '2026-06-01 09:00', 'Administrador', 'Estoque inicial'),
    ('a1000000-0000-4000-8000-000000000007', 'entrada',  8, '2026-06-01 09:00', 'Administrador', 'Estoque inicial'),
    ('a1000000-0000-4000-8000-000000000008', 'entrada',  4, '2026-06-01 09:00', 'Administrador', 'Estoque inicial');

    -- 7) PEÇAS USADAS NAS OS (N:N) + saída de estoque correspondente ----
    INSERT INTO order_parts_used (order_id, peca_id, nome, quantidade, custo, data, usuario) VALUES
    ('b1000000-0000-4000-8000-000000000001', 'a1000000-0000-4000-8000-000000000006', 'Teclado Notebook ABNT2', 1,  45.00, '2026-06-05 09:00', 'Administrador'),
    ('b1000000-0000-4000-8000-000000000002', 'a1000000-0000-4000-8000-000000000001', 'SSD 480GB',             1, 180.00, '2026-09-02 10:00', 'Administrador'),
    ('b1000000-0000-4000-8000-000000000004', 'a1000000-0000-4000-8000-000000000007', 'Cooler de CPU',         1,  25.00, '2026-10-24 09:00', 'Administrador'),
    ('b1000000-0000-4000-8000-000000000005', 'a1000000-0000-4000-8000-000000000004', 'Fonte ATX 500W',        1,  90.00, '2026-10-26 09:00', 'Administrador');

    INSERT INTO stock_movements (peca_id, tipo, quantidade, data, usuario, motivo, ordem_id) VALUES
    ('a1000000-0000-4000-8000-000000000006', 'saida', 1, '2026-06-05 09:00', 'Administrador', 'Uso em OS', 'b1000000-0000-4000-8000-000000000001'),
    ('a1000000-0000-4000-8000-000000000001', 'saida', 1, '2026-09-02 10:00', 'Administrador', 'Uso em OS', 'b1000000-0000-4000-8000-000000000002'),
    ('a1000000-0000-4000-8000-000000000007', 'saida', 1, '2026-10-24 09:00', 'Administrador', 'Uso em OS', 'b1000000-0000-4000-8000-000000000004'),
    ('a1000000-0000-4000-8000-000000000004', 'saida', 1, '2026-10-26 09:00', 'Administrador', 'Uso em OS', 'b1000000-0000-4000-8000-000000000005');

    -- auditoria
    INSERT INTO audit_log (acao, detalhe, usuario, data) VALUES
    ('OS criada',                  'OS #' || (base + 7), 'Administrador', '2026-11-04 10:20'),
    ('Diagnóstico registrado',     'OS #' || (base + 6), 'Administrador', '2026-11-03 09:00'),
    ('Orçamento enviado para aprovação', 'OS #' || (base + 5), 'Administrador', '2026-10-31 09:00'),
    ('Peça utilizada em OS',       'OS #' || (base + 4) || ' - Fonte ATX 500W', 'Administrador', '2026-10-26 09:00'),
    ('Status alterado para PRONTO','OS #' || (base + 3), 'Administrador', '2026-10-28 16:00');

    RAISE NOTICE 'Dados de exemplo carregados. Primeira OS de exemplo: #%', base;
END
$seed$;

COMMIT;
