-- usuario so leitura para relatorios (sem acesso a tabela users)
-- rodar como postgres no banco assistencia, depois do 01 e do 03 (views)
-- trocar a senha antes de usar fora de estudo

-- cria o usuário (só se ainda não existir)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'assistencia_relatorios') THEN
        CREATE ROLE assistencia_relatorios LOGIN PASSWORD 'troque_esta_senha';
    END IF;
END
$$;

-- permite conectar no banco e enxergar o schema
DO $$
BEGIN
    EXECUTE format('GRANT CONNECT ON DATABASE %I TO assistencia_relatorios', current_database());
END
$$;
GRANT USAGE ON SCHEMA public TO assistencia_relatorios;

-- somente select nas tabelas de negócio e nas views
GRANT SELECT ON clients, equipment, orders, order_status_history,
                order_parts_used, parts, stock_movements, audit_log, settings
    TO assistencia_relatorios;
GRANT SELECT ON vw_os_detalhada, vw_estoque_baixo TO assistencia_relatorios;

-- garante que a tabela de usuários (senhas) fica fora do alcance
REVOKE ALL ON users FROM assistencia_relatorios;


-- teste (conectado como assistencia_relatorios):
--   SELECT * FROM vw_estoque_baixo;     funciona
--   UPDATE parts SET quantidade = 0;    erro de permissao
--   SELECT * FROM users;                erro de permissao
