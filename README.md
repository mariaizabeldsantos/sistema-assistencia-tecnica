# Assistência Técnica - Aplicação Full-Stack (projeto acadêmico)

Sistema de gestão para assistência técnica, desenvolvido como projeto integrado
das disciplinas de **Engenharia de Software III**, **Laboratório de Banco de
Dados** e **Gestão de Projetos**.

- **Frontend:** React 18 + Vite + React Router
- **Backend:** Python + FastAPI (JWT, bcrypt)
- **Banco de dados:** PostgreSQL (SQLAlchemy) - scripts SQL, DER e consultas na pasta [`database/`](./database/)

Funcionalidades: 
Cadastro de clientes e equipamentos, ordens de serviço com
fluxo de status (Entrada → Em análise → Orçamento → Aguardando aprovação → Aprovado → Em manutenção → Pronto → Entregue, com Cancelado como status excepcional), diagnóstico,
orçamento com peças e mão de obra, aprovação pelo cliente, baixa automática de
estoque, garantia gerada automaticamente na entrega, controle de estoque com
movimentações, relatórios/auditoria e área do cliente.

## Estrutura

```
backend/                 # API FastAPI
├── app/
│   ├── models.py           # Tabelas (SQLAlchemy)
│   ├── schemas.py          # Validação (Pydantic)
│   ├── routers/            # Endpoints REST
│   └── main.py
└── requirements.txt
frontend/                # SPA React
└── src/
    ├── pages/               # Telas
    ├── components/          # Modal, Field, StatusBadge, etc.
    ├── context/             # Autenticação
    └── api/                 # Cliente HTTP
database/                # Banco de dados: DER, schema, dados, consultas, transações
├── 01_schema.sql           # Criação das tabelas (DDL)
├── 02_dados_exemplo.sql    # Dados de demonstração (INSERT)
├── 03_consultas.sql        # SELECT, JOIN, GROUP BY, HAVING, views
├── 04_transacoes.sql       # BEGIN / COMMIT / ROLLBACK
├── 05_permissoes.sql       # GRANT / REVOKE
└── DER.md, der.png         # Diagrama e dicionário de dados
docker-compose.yml
```

## Como executar (recomendado: Docker)

Pré-requisitos: Docker e Docker Compose instalados.

```bash
docker compose up --build
```

- Backend (API): http://localhost:8000 - documentação interativa em `/docs`
- Frontend: http://localhost:5173
- PostgreSQL: porta 5432 (usuário `postgres`, senha `postgres`, banco `assistencia`)

Na primeira execução, o PostgreSQL cria as tabelas a partir de
[`database/01_schema.sql`](./database/01_schema.sql) (montado no `docker-compose.yml`).
Se o banco já existir sem elas, o backend também as cria sozinho ao iniciar
(via SQLAlchemy, sem ferramenta de migração - ver decisão abaixo). Acesse
`http://localhost:5173` e você verá a tela **"Primeiro acesso"**, onde é criado
o usuário administrador e o nome da assistência técnica.

## Como executar sem Docker

### Backend
```bash
cd backend
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env      # ajuste DATABASE_URL para seu PostgreSQL local
uvicorn app.main:app --reload
```

### Frontend
```bash
cd frontend
cp .env.example .env      # aponta para http://localhost:8000 por padrão
npm install
npm run dev
```

## Principais decisões técnicas (e por quê)

- **Schema do banco em SQL puro, sem ferramenta de migração.** O arquivo
  `database/01_schema.sql` descreve todas as tabelas e é o que o Docker usa para
  criar o banco; ele equivale ao `backend/app/models.py`, que continua sendo
  usado pelo SQLAlchemy (e cria as tabelas sozinho caso não existam). Para o
  escopo deste projeto acadêmico isso é suficiente e muito mais simples de
  explicar do que um sistema de migrações versionado. O DER e o dicionário de
  dados estão em `database/DER.md`.
- **Senhas com bcrypt** (via `passlib`) - nunca texto puro nem hash simples.
- **Autenticação JWT** com dois papéis: `admin` (equipe da assistência) e
  `client` (cliente final, acessa apenas as próprias OS). O acesso do cliente
  é criado pelo admin na tela de detalhe do cliente ("Área do cliente").
- **Numeração sequencial de OS** e **garantia automática na entrega**
  implementadas como regras de negócio no backend (não no frontend), para
  garantir consistência mesmo se alguém chamar a API diretamente.
- **Baixa de estoque** ao registrar peça usada em uma OS é atômica no backend
  e valida estoque insuficiente antes de gravar.
- Campos como `diagnostico`, `orcamento`, `aprovacao` e `garantia` da OS foram
  mantidos como JSON (JSONB no Postgres) por serem estruturas ligadas a uma
  única OS; histórico de status e peças usadas viraram tabelas próprias por
  serem listas que crescem ao longo do tempo.
- Todas as validações de formulário (tamanho de nome, CPF, telefone, e-mail,
  senha) são feitas tanto no frontend (experiência do usuário) quanto - de
  forma obrigatória - no backend (segurança real).
## Banco de dados

Tudo sobre o banco está em [`database/`](./database/): diagrama (DER), dicionário de dados,
scripts de criação, dados de exemplo, consultas SQL, transações e permissões. Leia o
[`database/README.md`](./database/README.md) para ver como criar o banco e a ordem dos scripts.

## Fora do escopo (intencionalmente)

Chat, notificações, upload de arquivos/fotos, exportação para PDF, Kanban/
tarefas e distinção Pessoa Física/Jurídica **não foram implementados** - não
fazem parte do escopo definido para este trabalho.

## Próximos passos sugeridos (se o escopo crescer no futuro)

- Adicionar testes automatizados (pytest no backend, Vitest/RTL no frontend).
- Trocar o `SECRET_KEY` de exemplo por um valor aleatório forte antes de
  qualquer uso fora do ambiente acadêmico.
- Configurar HTTPS e um domínio real no `CORS_ORIGINS` ao publicar.
