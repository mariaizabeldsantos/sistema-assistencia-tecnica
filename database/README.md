# Banco de dados — Sistema de Assistência Técnica

Esta pasta reúne **tudo o que é do banco de dados** do sistema, em SQL puro e sem depender do
código Python. É o ponto de partida para a disciplina de **Laboratório de Banco de Dados**.

- **SGBD:** PostgreSQL 16 (banco `assistencia`)
- **Quem usa o banco:** o backend FastAPI, por meio do SQLAlchemy
  (`backend/app/database.py` abre a conexão; `backend/app/models.py` descreve as tabelas)
- **Conexão padrão:** `postgresql://postgres:postgres@localhost:5432/assistencia`
  (variável `DATABASE_URL`, definida em `docker-compose.yml` e `backend/.env.example`)

## O que tem aqui

| Arquivo | O que é | Conteúdo da aula |
| --- | --- | --- |
| [`DER.md`](./DER.md) / [`der.png`](./der.png) | Diagrama entidade-relacionamento, dicionário de dados e decisões de modelagem | Aula 1 (modelo conceitual, chaves, normalização) · Semana 13 (relacionamentos 1:N e N:N) |
| [`01_schema.sql`](./01_schema.sql) | Criação das 10 tabelas, chaves, índices e regras (**DDL**) | Aula 1 (modelo físico) · integridade referencial |
| [`02_dados_exemplo.sql`](./02_dados_exemplo.sql) | Dados de demonstração: 6 clientes, 7 equipamentos, 8 peças, 8 OS (**DML / INSERT**) | Aula 3 (INSERT) |
| [`03_consultas.sql`](./03_consultas.sql) | 29 consultas e 2 views: filtros, JOIN, GROUP BY, HAVING, subconsultas, JSONB | Aula 3 · Semana 13 · Semana 14 |
| [`04_transacoes.sql`](./04_transacoes.sql) | BEGIN, COMMIT, ROLLBACK e uma função atômica de baixa de estoque (**TCL**) | Semana 12 |
| [`05_permissoes.sql`](./05_permissoes.sql) | Usuário do banco somente leitura com GRANT/REVOKE (**DCL**) | Aula 1 (DDL, DML, DCL, TCL) |

Os quatro grupos de comandos SQL da Aula 1 estão cobertos: **DDL** no `01`, **DML** no `02` e `03`,
**TCL** no `04` e **DCL** no `05`.

## Como criar o banco

### Opção 1 — Docker (recomendada)

O `docker-compose.yml` já monta o `01_schema.sql` no contêiner do PostgreSQL, então as tabelas são
criadas pelo script na primeira vez que o banco sobe:

```bash
docker compose up --build
```

O script só roda quando o volume do banco está vazio. Para recriar do zero:

```bash
docker compose down -v      # apaga o volume (e todos os dados!)
docker compose up --build
```

### Opção 2 — PostgreSQL instalado na máquina

```bash
createdb -U postgres assistencia
psql -U postgres -d assistencia -f database/01_schema.sql
```

### Opção 3 — pgAdmin ou DBeaver

Crie um banco chamado `assistencia`, abra uma janela de consulta nele e execute o conteúdo de
`01_schema.sql`. Dados de conexão do Docker: servidor `localhost`, porta `5432`, usuário
`postgres`, senha `postgres`.

> O backend também cria as tabelas sozinho ao iniciar (`Base.metadata.create_all`), se elas não
> existirem. Com o `01_schema.sql` aplicado antes, o backend simplesmente usa as tabelas que já estão lá.

## Ordem de execução

1. `01_schema.sql` — cria as tabelas.
2. **Primeiro acesso no sistema** (`http://localhost:5173`): cria o administrador e a linha de
   configurações. O `02` exige isso e avisa se faltar.
3. `02_dados_exemplo.sql` — carrega os dados de demonstração (só roda uma vez).
4. `03_consultas.sql` — consultas e views (pode rodar sempre).
5. `04_transacoes.sql` — execute **bloco por bloco** (cada bloco começa com `BLOCO`).
6. `05_permissoes.sql` — como superusuário, depois do `03` (que cria as views).

Pelo terminal:

```bash
psql -U postgres -d assistencia -f database/02_dados_exemplo.sql
psql -U postgres -d assistencia -f database/03_consultas.sql
```

Com Docker, use o `psql` de dentro do contêiner:

```bash
docker compose exec -T db psql -U postgres -d assistencia < database/02_dados_exemplo.sql
docker compose exec db psql -U postgres -d assistencia
```

## Como o sistema se liga ao banco

| Quero ver... | Onde está |
| --- | --- |
| A URL de conexão | `backend/app/config.py` e `DATABASE_URL` no `docker-compose.yml` |
| Como a conexão é aberta | `backend/app/database.py` |
| As tabelas no código Python | `backend/app/models.py` (equivale ao `01_schema.sql`) |
| As operações de gravação | `backend/app/routers/*.py` |
| A baixa de estoque (transação) | `routers/orders.py`, função `usar_peca` |
| Os relatórios feitos em Python | `routers/reports.py` (equivalentes em SQL: `03_consultas.sql`, partes 3 e 4) |

Se alguém alterar o `models.py`, o `01_schema.sql` precisa ser atualizado junto para continuarem iguais.

## Roteiro sugerido para a apresentação

1. Mostrar o **DER** (`der.png`) e explicar as relações, em especial `order_parts_used` (N:N).
2. Abrir o `01_schema.sql`: chaves primárias, estrangeiras e as regras (CHECK).
3. Rodar o `02` e mostrar os dados no pgAdmin/DBeaver.
4. Rodar consultas do `03`: um JOIN, um `GROUP BY` com `HAVING` e a conferência de integridade (5.1).
5. Demonstrar o `04`: COMMIT, ROLLBACK e o erro de estoque negativo sendo barrado.
6. Mostrar no sistema uma peça sendo usada em uma OS e conferir a baixa no banco.

## Como foi testado

Os scripts foram executados em PostgreSQL 16. O `01_schema.sql` gera as mesmas 100 colunas
(nomes, tipos e obrigatoriedade) que o SQLAlchemy cria a partir do `models.py`, e o backend rodou o
fluxo completo (primeiro acesso, cliente, equipamento, OS, orçamento, aprovação, uso de peça,
entrega com garantia, relatórios) sobre o banco criado só pelo script.
