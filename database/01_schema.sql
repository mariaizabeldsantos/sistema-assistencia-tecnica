-- criacao das tabelas do banco assistencia (postgresql)
-- usa IF NOT EXISTS, entao pode rodar mais de uma vez

-- clients: clientes da assistência
CREATE TABLE IF NOT EXISTS clients (
    id           UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    nome         VARCHAR(150) NOT NULL,
    cpf          VARCHAR(11),                       -- opcional, só dígitos
    telefone     VARCHAR(11)  NOT NULL,             -- só dígitos
    whatsapp     VARCHAR(11),
    email        VARCHAR(254),
    endereco     VARCHAR(500),
    observacoes  TEXT,
    status       VARCHAR(20)  DEFAULT 'ativo',
    created_at   TIMESTAMP    DEFAULT (now() AT TIME ZONE 'utc'),
    updated_at   TIMESTAMP    DEFAULT (now() AT TIME ZONE 'utc'),
    CONSTRAINT ck_clients_status CHECK (status IN ('ativo', 'inativo'))
);
CREATE INDEX IF NOT EXISTS ix_clients_cpf ON clients (cpf);

-- users: usuários do sistema (admin = equipe | client = cliente)
CREATE TABLE IF NOT EXISTS users (
    id             UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    name           VARCHAR(150) NOT NULL,
    email          VARCHAR(254) NOT NULL,
    password_hash  VARCHAR(255) NOT NULL,           -- bcrypt, nunca senha pura
    role           VARCHAR(20)  NOT NULL DEFAULT 'admin',
    client_id      UUID         REFERENCES clients (id),  -- só para role = 'client'
    created_at     TIMESTAMP    DEFAULT (now() AT TIME ZONE 'utc'),
    CONSTRAINT ck_users_role CHECK (role IN ('admin', 'client'))
);
CREATE UNIQUE INDEX IF NOT EXISTS ix_users_email ON users (email);

-- equipment: equipamentos dos clientes (1 cliente : N equipamentos)
CREATE TABLE IF NOT EXISTS equipment (
    id            UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id     UUID         NOT NULL
                  REFERENCES clients (id) ON DELETE CASCADE,
    tipo          VARCHAR(20)  NOT NULL DEFAULT 'notebook',  -- notebook | computador
    marca         VARCHAR(50)  NOT NULL,
    modelo        VARCHAR(100),
    numero_serie  VARCHAR(100),
    acessorios    VARCHAR(500),
    observacoes   TEXT,
    senha         VARCHAR(255),
    created_at    TIMESTAMP    DEFAULT (now() AT TIME ZONE 'utc'),
    updated_at    TIMESTAMP    DEFAULT (now() AT TIME ZONE 'utc')
);
CREATE INDEX IF NOT EXISTS ix_equipment_numero_serie ON equipment (numero_serie);

-- parts: peças em estoque
CREATE TABLE IF NOT EXISTS parts (
    id               UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
    nome             VARCHAR(150)  NOT NULL,
    categoria        VARCHAR(100),
    fabricante       VARCHAR(100),
    modelo           VARCHAR(100),
    codigo           VARCHAR(100),
    quantidade       INTEGER       DEFAULT 0,
    estoque_minimo   INTEGER       DEFAULT 0,
    custo_aquisicao  NUMERIC(12,2) DEFAULT 0,
    preco_orcamento  NUMERIC(12,2) DEFAULT 0,
    fornecedor       VARCHAR(150),
    localizacao      VARCHAR(150),
    status           VARCHAR(20)   DEFAULT 'ativo',
    created_at       TIMESTAMP     DEFAULT (now() AT TIME ZONE 'utc'),
    updated_at       TIMESTAMP     DEFAULT (now() AT TIME ZONE 'utc'),
    -- regras de integridade (extras em relação ao models.py)
    CONSTRAINT ck_parts_quantidade CHECK (quantidade >= 0),
    CONSTRAINT ck_parts_estoque_minimo CHECK (estoque_minimo >= 0),
    CONSTRAINT ck_parts_valores CHECK (custo_aquisicao >= 0 AND preco_orcamento >= 0)
);

-- settings: configurações da assistência (sempre UMA linha, id = 1)
CREATE TABLE IF NOT EXISTS settings (
    id                    INTEGER      PRIMARY KEY DEFAULT 1,
    nome_assistencia      VARCHAR(150) DEFAULT 'Minha Assistência Técnica',
    telefone              VARCHAR(11),
    whatsapp              VARCHAR(11),
    email                 VARCHAR(254),
    endereco              VARCHAR(500),
    categorias            JSONB        DEFAULT '[]'::jsonb,
    marcas                JSONB        DEFAULT '[]'::jsonb,
    servicos              JSONB        DEFAULT '[]'::jsonb,
    garantia_padrao_dias  INTEGER      DEFAULT 90,
    proximo_numero_os     INTEGER      DEFAULT 1,
    CONSTRAINT ck_settings_linha_unica CHECK (id = 1)
);

-- orders: ordens de serviço (OS)
CREATE TABLE IF NOT EXISTS orders (
    id                 UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    numero             INTEGER      NOT NULL,                 -- nº sequencial da OS
    client_id          UUID         NOT NULL REFERENCES clients (id),
    equipment_id       UUID         NOT NULL REFERENCES equipment (id),
    problema_relatado  TEXT         NOT NULL,
    acessorios         VARCHAR(500),
    estado_fisico      VARCHAR(500),
    observacoes        TEXT,
    prazo              VARCHAR(20),                           -- data ISO yyyy-mm-dd
    status             VARCHAR(30)  NOT NULL DEFAULT 'ENTRADA',
    diagnostico        JSONB,
    orcamento          JSONB,
    aprovacao          JSONB,
    garantia           JSONB,
    data_conclusao     TIMESTAMP,
    data_entrega       TIMESTAMP,
    created_at         TIMESTAMP    DEFAULT (now() AT TIME ZONE 'utc'),
    updated_at         TIMESTAMP    DEFAULT (now() AT TIME ZONE 'utc'),
    CONSTRAINT ck_orders_status CHECK (status IN (
        'ENTRADA', 'ORCAMENTO', 'AGUARDANDO_APROVACAO',
        'EM_MANUTENCAO', 'PRONTO', 'ENTREGUE', 'CANCELADO'))
);
CREATE UNIQUE INDEX IF NOT EXISTS ix_orders_numero ON orders (numero);

-- order_status_history: histórico de status da OS (1 OS : N linhas)
CREATE TABLE IF NOT EXISTS order_status_history (
    id               UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id         UUID         NOT NULL
                     REFERENCES orders (id) ON DELETE CASCADE,
    status_anterior  VARCHAR(30),
    status_novo      VARCHAR(30)  NOT NULL,
    data             TIMESTAMP    DEFAULT (now() AT TIME ZONE 'utc'),
    usuario          VARCHAR(150)
);

-- order_parts_used: tABELA ASSOCIATIVA entre orders e parts (N:N)
CREATE TABLE IF NOT EXISTS order_parts_used (
    id          UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id    UUID          NOT NULL
                REFERENCES orders (id) ON DELETE CASCADE,
    peca_id     UUID          NOT NULL REFERENCES parts (id),
    nome        VARCHAR(150)  NOT NULL,
    quantidade  INTEGER       NOT NULL,
    custo       NUMERIC(12,2) DEFAULT 0,
    data        TIMESTAMP     DEFAULT (now() AT TIME ZONE 'utc'),
    usuario     VARCHAR(150),
    CONSTRAINT ck_order_parts_used_quantidade CHECK (quantidade > 0)
);

-- stock_movements: movimentações de estoque (entrada / saída)
CREATE TABLE IF NOT EXISTS stock_movements (
    id          UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
    peca_id     UUID          NOT NULL REFERENCES parts (id),
    tipo        VARCHAR(20)   NOT NULL,
    quantidade  INTEGER       NOT NULL,
    data        TIMESTAMP     DEFAULT (now() AT TIME ZONE 'utc'),
    usuario     VARCHAR(150),
    motivo      VARCHAR(255),
    ordem_id    UUID          REFERENCES orders (id),         -- só quando é uso em OS
    CONSTRAINT ck_stock_movements_tipo CHECK (tipo IN ('entrada', 'saida')),
    CONSTRAINT ck_stock_movements_quantidade CHECK (quantidade > 0)
);

-- audit_log: auditoria de ações do sistema
CREATE TABLE IF NOT EXISTS audit_log (
    id       UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
    acao     VARCHAR(255)  NOT NULL,
    detalhe  VARCHAR(500),
    usuario  VARCHAR(150),
    data     TIMESTAMP     DEFAULT (now() AT TIME ZONE 'utc')
);

-- Índices extras para as consultas mais comuns (chaves estrangeiras)
CREATE INDEX IF NOT EXISTS ix_equipment_client_id        ON equipment (client_id);
CREATE INDEX IF NOT EXISTS ix_orders_client_id           ON orders (client_id);
CREATE INDEX IF NOT EXISTS ix_orders_equipment_id        ON orders (equipment_id);
CREATE INDEX IF NOT EXISTS ix_orders_status              ON orders (status);
CREATE INDEX IF NOT EXISTS ix_order_status_history_order ON order_status_history (order_id);
CREATE INDEX IF NOT EXISTS ix_order_parts_used_order     ON order_parts_used (order_id);
CREATE INDEX IF NOT EXISTS ix_order_parts_used_peca      ON order_parts_used (peca_id);
CREATE INDEX IF NOT EXISTS ix_stock_movements_peca       ON stock_movements (peca_id);

-- Comentários no próprio banco (aparecem no pgAdmin/DBeaver)
COMMENT ON TABLE clients              IS 'Clientes da assistência técnica';
COMMENT ON TABLE users                IS 'Usuários de acesso (admin = equipe, client = cliente final)';
COMMENT ON TABLE equipment            IS 'Equipamentos (notebooks/computadores) de cada cliente';
COMMENT ON TABLE parts                IS 'Peças em estoque, com quantidade e estoque mínimo';
COMMENT ON TABLE settings             IS 'Configurações gerais (linha única, id = 1)';
COMMENT ON TABLE orders               IS 'Ordens de serviço; diagnóstico, orçamento, aprovação e garantia em JSONB';
COMMENT ON TABLE order_status_history IS 'Histórico de mudanças de status de cada OS';
COMMENT ON TABLE order_parts_used     IS 'Peças usadas em cada OS (tabela associativa N:N entre orders e parts)';
COMMENT ON TABLE stock_movements      IS 'Entradas e saídas do estoque de peças';
COMMENT ON TABLE audit_log            IS 'Registro de auditoria das ações do sistema';
